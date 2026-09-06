'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one, all } from '@/lib/db'
import { str, int, num, date, pick, media } from '@/lib/form'

const STATUS = ['draft', 'in_progress', 'evaluated'] as const

export async function saveAgreement(id: number, f: FormData): Promise<void> {
  await requireAdmin()

  const fiscalYear = int(f, 'fiscal_year')
  if (fiscalYear < 2500 || fiscalYear > 2700) {
    redirect(id ? `/admin/pa/${id}?error=year` : '/admin/pa/new?error=year')
  }
  // ปีงบประมาณห้ามซ้ำ — หน้าเว็บดึงข้อตกลงด้วยปี ถ้าซ้ำจะได้ผลลัพธ์กำกวม
  const dup = await one<{ id: number }>(
    'SELECT id FROM pa_agreements WHERE fiscal_year = ? AND id <> ? AND deleted_at IS NULL',
    [fiscalYear, id])
  if (dup) redirect(id ? `/admin/pa/${id}?error=dup` : '/admin/pa/new?error=dup')

  const pdf = media(f, 'pdf')
  const t = now()
  const args = [
    fiscalYear, int(f, 'round', 1), date(f, 'period_start'), date(f, 'period_end'),
    str(f, 'position', 100), str(f, 'academic_standing', 100), str(f, 'school', 200),
    str(f, 'affiliation', 200), str(f, 'subject_group', 200),
    num(f, 'teaching_hours'), num(f, 'support_hours'),
    pick(f, 'status', STATUS, 'draft'),
    pdf.source, pdf.ref, str(f, 'pdf_name', 200), str(f, 'note', 400), t,
  ]

  let agId = id
  if (id) {
    await db.execute({
      sql: `UPDATE pa_agreements SET fiscal_year=?, round=?, period_start=?, period_end=?,
              position=?, academic_standing=?, school=?, affiliation=?, subject_group=?,
              teaching_hours=?, support_hours=?, status=?, pdf_source=?, pdf_ref=?, pdf_name=?,
              note=?, updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO pa_agreements (fiscal_year, round, period_start, period_end, position,
              academic_standing, school, affiliation, subject_group, teaching_hours, support_hours,
              status, pdf_source, pdf_ref, pdf_name, note, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
    agId = Number(res.lastInsertRowid)
  }

  // ตอนที่ 2 — เขียนทับทั้ง 15 ตัวชี้วัด เก็บเฉพาะแถวที่กรอกงานที่จะปฏิบัติไว้
  const indicators = await all<{ id: number }>('SELECT id FROM indicators ORDER BY id')
  await db.execute({ sql: 'DELETE FROM pa_details WHERE agreement_id = ?', args: [agId] })
  let order = 0
  for (const ind of indicators) {
    const task = str(f, `task_${ind.id}`, 1000)
    if (!task) continue
    await db.execute({
      sql: `INSERT INTO pa_details (agreement_id, indicator_id, task_description,
              expected_quantity, expected_quality, sort_order, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [agId, ind.id, task, str(f, `qty_${ind.id}`, 500),
             str(f, `qual_${ind.id}`, 500), order++, t, t],
    })
  }

  // ประเด็นท้าทาย — มีได้ข้อเดียวต่อข้อตกลง
  const topic = str(f, 'topic', 255)
  await db.execute({ sql: 'DELETE FROM pa_challenges WHERE agreement_id = ?', args: [agId] })
  if (topic) {
    await db.execute({
      sql: `INSERT INTO pa_challenges (agreement_id, topic, problem_statement, method,
              expected_outcome, updated_at, created_at) VALUES (?,?,?,?,?,?,?)`,
      args: [agId, topic, str(f, 'problem_statement', 2000), str(f, 'method', 2000),
             str(f, 'expected_outcome', 2000), t, t],
    })
  }

  await logAction(id ? 'แก้ไขข้อตกลง PA' : 'เพิ่มข้อตกลง PA', 'pa_agreements', agId, String(fiscalYear))
  revalidatePath('/', 'layout')
  redirect(`/admin/pa/${agId}?saved=1`)
}

export async function deleteAgreement(id: number): Promise<void> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE pa_agreements SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบข้อตกลง PA', 'pa_agreements', id)
  revalidatePath('/', 'layout')
  redirect('/admin/pa?deleted=1')
}
