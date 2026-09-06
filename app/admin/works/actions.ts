'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one } from '@/lib/db'
import { str, int, date, pick, media, slugify } from '@/lib/form'
import type { MediaSource } from '@/lib/media'

interface RowIn { source?: unknown; ref?: unknown; caption?: unknown; original_name?: unknown }

/** อ่าน JSON ที่คอมโพเนนต์ฝั่งหน้าเว็บส่งมา แล้วกรองให้เหลือเฉพาะค่าที่ใช้ได้จริง */
function parseRows(raw: string): { source: MediaSource; ref: string; caption: string; name: string }[] {
  let data: unknown
  try { data = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(data)) return []
  return data.flatMap((r: RowIn) => {
    const source = r.source === 'static' ? 'static' : 'drive'
    const ref = String(r.ref ?? '').trim()
    if (!ref || ref.length > 200) return []
    return [{
      source: source as MediaSource,
      ref,
      caption: String(r.caption ?? '').slice(0, 255),
      name: String(r.original_name ?? '').slice(0, 255) || 'ไฟล์แนบ',
    }]
  }).slice(0, 60)   // กันการยัดข้อมูลจำนวนมหาศาล
}

/** ทำให้ slug ไม่ซ้ำกับผลงานอื่น */
async function uniqueSlug(base: string, exceptId: number): Promise<string> {
  let slug = base
  for (let i = 2; i < 200; i++) {
    const hit = await one<{ id: number }>('SELECT id FROM works WHERE slug = ? AND id <> ?', [slug, exceptId])
    if (!hit) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

export async function saveWork(id: number, f: FormData): Promise<void> {
  await requireAdmin()                          // ด่านตรวจ — ต้องมีทุก action

  const title = str(f, 'title', 255)
  if (!title) redirect(id ? `/admin/works/${id}?error=title` : '/admin/works/new?error=title')

  const indicatorId = int(f, 'indicator_id')
  const ind = await one<{ id: number }>('SELECT id FROM indicators WHERE id = ?', [indicatorId])
  if (!ind) redirect(id ? `/admin/works/${id}?error=indicator` : '/admin/works/new?error=indicator')

  const cover = media(f, 'cover')
  const slug = await uniqueSlug(slugify(str(f, 'slug', 200) || title), id)
  const t = now()
  const common = [
    indicatorId, title, slug, str(f, 'summary', 400), str(f, 'content', 20000),
    int(f, 'academic_year', new Date().getFullYear() + 543), int(f, 'semester', 1),
    date(f, 'work_date'), cover.source, cover.ref, str(f, 'video_url', 500),
    str(f, 'tags', 255), f.get('is_featured') ? 1 : 0,
    pick(f, 'status', ['draft', 'published'] as const, 'published'), t,
  ]

  let workId = id
  if (id) {
    await db.execute({
      sql: `UPDATE works SET indicator_id=?, title=?, slug=?, summary=?, content=?,
              academic_year=?, semester=?, work_date=?, cover_source=?, cover_ref=?,
              video_url=?, tags=?, is_featured=?, status=?, updated_at=? WHERE id=?`,
      args: [...common, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO works (indicator_id, title, slug, summary, content, academic_year, semester,
              work_date, cover_source, cover_ref, video_url, tags, is_featured, status, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...common, t],
    })
    workId = Number(res.lastInsertRowid)
  }

  // รูปและไฟล์: เขียนทับทั้งชุดตามที่ส่งมา (ลำดับตามที่ครูจัดไว้)
  const images = parseRows(str(f, 'images', 60000))
  await db.execute({ sql: 'DELETE FROM work_images WHERE work_id = ?', args: [workId] })
  for (const [i, im] of images.entries()) {
    await db.execute({
      sql: `INSERT INTO work_images (work_id, source, ref, caption, sort_order, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [workId, im.source, im.ref, im.caption, i, t],
    })
  }

  const files = parseRows(str(f, 'files', 60000))
  await db.execute({ sql: 'DELETE FROM work_files WHERE work_id = ?', args: [workId] })
  for (const [i, fl] of files.entries()) {
    await db.execute({
      sql: `INSERT INTO work_files (work_id, source, ref, original_name, sort_order, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [workId, fl.source, fl.ref, fl.name, i, t],
    })
  }

  await logAction(id ? 'แก้ไขผลงาน' : 'เพิ่มผลงาน', 'works', workId, title)
  revalidatePath('/', 'layout')
  redirect(`/admin/works/${workId}?saved=1`)
}

export async function deleteWork(id: number): Promise<void> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE works SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบผลงาน', 'works', id)
  revalidatePath('/', 'layout')
  redirect('/admin/works?deleted=1')
}
