'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now } from '@/lib/db'
import { str, int, date, pick, media } from '@/lib/form'
import type { MediaSource } from '@/lib/media'

type Entity = 'award' | 'self_dev'
interface RowIn { source?: unknown; ref?: unknown; caption?: unknown; original_name?: unknown }

function parseRows(raw: string) {
  let data: unknown
  try { data = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(data)) return []
  return data.flatMap((r: RowIn) => {
    const ref = String(r.ref ?? '').trim()
    if (!ref || ref.length > 200) return []
    return [{
      source: (r.source === 'static' ? 'static' : 'drive') as MediaSource,
      ref,
      caption: String(r.caption ?? '').slice(0, 255),
      name: String(r.original_name ?? '').slice(0, 255) || 'ไฟล์แนบ',
    }]
  }).slice(0, 60)
}

/** เขียนรูปและไฟล์แนบทับทั้งชุด (ใช้ร่วมกันทั้งรางวัลและการพัฒนาตนเอง) */
async function writeItemMedia(entity: Entity, id: number, f: FormData, t: string) {
  const images = parseRows(str(f, 'images', 60000))
  await db.execute({ sql: 'DELETE FROM item_images WHERE entity_type = ? AND entity_id = ?', args: [entity, id] })
  for (const [i, im] of images.entries()) {
    await db.execute({
      sql: `INSERT INTO item_images (entity_type, entity_id, source, ref, caption, sort_order, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [entity, id, im.source, im.ref, im.caption, i, t],
    })
  }
  const files = parseRows(str(f, 'files', 60000))
  await db.execute({ sql: 'DELETE FROM item_files WHERE entity_type = ? AND entity_id = ?', args: [entity, id] })
  for (const [i, fl] of files.entries()) {
    await db.execute({
      sql: `INSERT INTO item_files (entity_type, entity_id, source, ref, original_name, sort_order, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [entity, id, fl.source, fl.ref, fl.name, i, t],
    })
  }
}

/* ---------------- การพัฒนาตนเอง ---------------- */

const DEV_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'PLC', 'วิทยากร'] as const

export async function saveSelfDev(id: number, f: FormData): Promise<void> {
  await requireAdmin()
  const title = str(f, 'title', 255)
  if (!title) redirect(id ? `/admin/self-dev/${id}?error=title` : '/admin/self-dev/new?error=title')

  const cert = media(f, 'cert')
  const t = now()
  const args = [
    title, str(f, 'organizer', 200), pick(f, 'type', DEV_TYPES, 'อบรม'),
    date(f, 'start_date'), date(f, 'end_date'), int(f, 'hours'),
    int(f, 'fiscal_year', new Date().getFullYear() + 544),
    cert.source, cert.ref, str(f, 'note', 400), str(f, 'summary', 400),
    str(f, 'content', 20000), str(f, 'video_url', 500),
    str(f, 'link_url', 500), str(f, 'link_label', 120), t,
  ]

  let rowId = id
  if (id) {
    await db.execute({
      sql: `UPDATE self_developments SET title=?, organizer=?, type=?, start_date=?, end_date=?,
              hours=?, fiscal_year=?, certificate_source=?, certificate_ref=?, note=?, summary=?,
              content=?, video_url=?, link_url=?, link_label=?, updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO self_developments (title, organizer, type, start_date, end_date, hours,
              fiscal_year, certificate_source, certificate_ref, note, summary, content,
              video_url, link_url, link_label, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
    rowId = Number(res.lastInsertRowid)
  }

  await writeItemMedia('self_dev', rowId, f, t)
  await logAction(id ? 'แก้ไขการพัฒนาตนเอง' : 'เพิ่มการพัฒนาตนเอง', 'self_developments', rowId, title)
  revalidatePath('/', 'layout')
  redirect(`/admin/self-dev/${rowId}?saved=1`)
}

export async function deleteSelfDev(id: number): Promise<void> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE self_developments SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบการพัฒนาตนเอง', 'self_developments', id)
  revalidatePath('/', 'layout')
  redirect('/admin/self-dev?deleted=1')
}

/* ---------------- รางวัล ---------------- */

const LEVELS = ['โรงเรียน', 'เขตพื้นที่', 'จังหวัด', 'ภาค', 'ชาติ', 'นานาชาติ'] as const

export async function saveAward(id: number, f: FormData): Promise<void> {
  await requireAdmin()
  const title = str(f, 'title', 255)
  if (!title) redirect(id ? `/admin/awards/${id}?error=title` : '/admin/awards/new?error=title')

  const img = media(f, 'image')
  const t = now()
  const args = [
    title, str(f, 'awarder', 200), pick(f, 'level', LEVELS, 'โรงเรียน'),
    date(f, 'award_date'), img.source, img.ref, str(f, 'note', 400),
    str(f, 'summary', 400), str(f, 'content', 20000), str(f, 'video_url', 500),
    str(f, 'link_url', 500), str(f, 'link_label', 120), t,
  ]

  let rowId = id
  if (id) {
    await db.execute({
      sql: `UPDATE awards SET title=?, awarder=?, level=?, award_date=?, image_source=?, image_ref=?,
              note=?, summary=?, content=?, video_url=?, link_url=?, link_label=?, updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO awards (title, awarder, level, award_date, image_source, image_ref, note,
              summary, content, video_url, link_url, link_label, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
    rowId = Number(res.lastInsertRowid)
  }

  await writeItemMedia('award', rowId, f, t)
  await logAction(id ? 'แก้ไขรางวัล' : 'เพิ่มรางวัล', 'awards', rowId, title)
  revalidatePath('/', 'layout')
  redirect(`/admin/awards/${rowId}?saved=1`)
}

export async function deleteAward(id: number): Promise<void> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE awards SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบรางวัล', 'awards', id)
  revalidatePath('/', 'layout')
  redirect('/admin/awards?deleted=1')
}
