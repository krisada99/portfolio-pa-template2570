import { cache } from 'react'
import { all, one, scalar } from './db'
import type {
  Profile, Domain, Indicator, Work, WorkImage, WorkFile, Agreement,
  PaDetail, PaChallenge, SelfDev, Award, ItemImage, ItemFile, Education, CareerPath,
} from './types'

/* ---------------- โปรไฟล์ / ประวัติ ---------------- */

/**
 * โปรไฟล์ครู — คืน null ถ้าฐานข้อมูลยังไม่พร้อม
 * ต้องกันไว้ เพราะ layout เรียกใช้ทุกหน้า ถ้าโยน error ตอนยังไม่ติดตั้งเว็บจะ 500 ทั้งเว็บ
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  try { return await one<Profile>('SELECT * FROM teacher_profile WHERE id = 1') }
  catch { return null }
})

export const getEducations = () =>
  all<Education>('SELECT * FROM educations WHERE deleted_at IS NULL ORDER BY sort_order, year_th DESC')

export const getCareerPaths = () =>
  all<CareerPath>('SELECT * FROM career_paths WHERE deleted_at IS NULL ORDER BY sort_order')

export const getSetting = cache(async (key: string): Promise<string | null> => {
  try { return await scalar<string>('SELECT value FROM site_settings WHERE key = ?', [key]) }
  catch { return null }
})

/* ---------------- ด้าน / ตัวชี้วัด ---------------- */

export const getDomains = cache(() =>
  all<Domain>('SELECT * FROM domains ORDER BY code'))

export const getIndicators = cache(() =>
  all<Indicator>(`SELECT i.*, d.code AS domain_code, d.name AS domain_name
                  FROM indicators i JOIN domains d ON d.id = i.domain_id
                  ORDER BY d.code, i.sort_order`))

export const getIndicator = (id: number) =>
  one<Indicator>(`SELECT i.*, d.code AS domain_code, d.name AS domain_name
                  FROM indicators i JOIN domains d ON d.id = i.domain_id WHERE i.id = ?`, [id])

/** จำนวนผลงานของแต่ละตัวชี้วัด — ใช้โชว์ตัวเลขบนการ์ด */
export async function getWorkCountByIndicator(): Promise<Map<number, number>> {
  const rows = await all<{ indicator_id: number; n: number }>(
    `SELECT indicator_id, COUNT(*) AS n FROM works
     WHERE deleted_at IS NULL AND status = 'published' GROUP BY indicator_id`)
  return new Map(rows.map((r) => [Number(r.indicator_id), Number(r.n)]))
}

/* ---------------- ผลงาน ---------------- */

const WORK_SELECT = `SELECT w.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code
                     FROM works w
                     JOIN indicators i ON i.id = w.indicator_id
                     JOIN domains d ON d.id = i.domain_id`

export interface WorkFilter {
  indicatorId?: number
  domainCode?: number
  academicYear?: number
  q?: string
  featuredOnly?: boolean
  limit?: number
  offset?: number
}

export async function getWorks(f: WorkFilter = {}): Promise<Work[]> {
  const where: string[] = ["w.deleted_at IS NULL", "w.status = 'published'"]
  const args: (string | number)[] = []
  if (f.indicatorId) { where.push('w.indicator_id = ?'); args.push(f.indicatorId) }
  if (f.domainCode) { where.push('d.code = ?'); args.push(f.domainCode) }
  if (f.academicYear) { where.push('w.academic_year = ?'); args.push(f.academicYear) }
  if (f.featuredOnly) { where.push('w.is_featured = 1') }
  if (f.q) {
    where.push('(w.title LIKE ? OR w.summary LIKE ? OR w.tags LIKE ?)')
    const like = `%${f.q}%`; args.push(like, like, like)
  }
  let sql = `${WORK_SELECT} WHERE ${where.join(' AND ')} ORDER BY w.work_date DESC, w.id DESC`
  if (f.limit) { sql += ' LIMIT ?'; args.push(f.limit) }
  if (f.offset) { sql += ' OFFSET ?'; args.push(f.offset) }
  return all<Work>(sql, args)
}

export async function countWorks(f: WorkFilter = {}): Promise<number> {
  const where: string[] = ["w.deleted_at IS NULL", "w.status = 'published'"]
  const args: (string | number)[] = []
  if (f.indicatorId) { where.push('w.indicator_id = ?'); args.push(f.indicatorId) }
  if (f.domainCode) { where.push('d.code = ?'); args.push(f.domainCode) }
  if (f.academicYear) { where.push('w.academic_year = ?'); args.push(f.academicYear) }
  if (f.q) {
    where.push('(w.title LIKE ? OR w.summary LIKE ? OR w.tags LIKE ?)')
    const like = `%${f.q}%`; args.push(like, like, like)
  }
  const n = await scalar<number>(
    `SELECT COUNT(*) FROM works w
     JOIN indicators i ON i.id = w.indicator_id
     JOIN domains d ON d.id = i.domain_id
     WHERE ${where.join(' AND ')}`, args)
  return Number(n ?? 0)
}

export const getWorkBySlug = (slug: string) =>
  one<Work>(`${WORK_SELECT} WHERE w.slug = ? AND w.deleted_at IS NULL`, [slug])

export const getWorkImages = (workId: number) =>
  all<WorkImage>('SELECT * FROM work_images WHERE work_id = ? ORDER BY sort_order, id', [workId])

export const getWorkFiles = (workId: number) =>
  all<WorkFile>('SELECT * FROM work_files WHERE work_id = ? ORDER BY sort_order, id', [workId])

export const getAcademicYears = async () =>
  (await all<{ y: number }>(
    `SELECT DISTINCT academic_year AS y FROM works
     WHERE deleted_at IS NULL AND status = 'published' ORDER BY y DESC`)).map((r) => Number(r.y))

/** ผลงานอื่นในตัวชี้วัดเดียวกัน */
export const getRelatedWorks = (indicatorId: number, exceptId: number, limit = 4) =>
  all<Work>(`${WORK_SELECT} WHERE w.indicator_id = ? AND w.id <> ?
             AND w.deleted_at IS NULL AND w.status = 'published'
             ORDER BY w.work_date DESC LIMIT ?`, [indicatorId, exceptId, limit])

/* ---------------- ข้อตกลง PA ---------------- */

export const getAgreements = () =>
  all<Agreement>('SELECT * FROM pa_agreements WHERE deleted_at IS NULL ORDER BY fiscal_year DESC')

export const getAgreement = (fiscalYear: number) =>
  one<Agreement>('SELECT * FROM pa_agreements WHERE fiscal_year = ? AND deleted_at IS NULL', [fiscalYear])

export const getPaDetails = (agreementId: number) =>
  all<PaDetail>(`SELECT p.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code
                 FROM pa_details p
                 JOIN indicators i ON i.id = p.indicator_id
                 JOIN domains d ON d.id = i.domain_id
                 WHERE p.agreement_id = ? ORDER BY d.code, i.sort_order`, [agreementId])

export const getPaChallenge = (agreementId: number) =>
  one<PaChallenge>('SELECT * FROM pa_challenges WHERE agreement_id = ?', [agreementId])

/* ---------------- การพัฒนาตนเอง / รางวัล ---------------- */

export const getSelfDevs = (fiscalYear?: number) =>
  all<SelfDev>(
    `SELECT * FROM self_developments WHERE deleted_at IS NULL
     ${fiscalYear ? 'AND fiscal_year = ?' : ''}
     ORDER BY start_date DESC, id DESC`, fiscalYear ? [fiscalYear] : [])

export const getSelfDev = (id: number) =>
  one<SelfDev>('SELECT * FROM self_developments WHERE id = ? AND deleted_at IS NULL', [id])

export const getSelfDevYears = async () =>
  (await all<{ y: number }>(
    `SELECT DISTINCT fiscal_year AS y FROM self_developments
     WHERE deleted_at IS NULL ORDER BY y DESC`)).map((r) => Number(r.y))

export const getAwards = () =>
  all<Award>('SELECT * FROM awards WHERE deleted_at IS NULL ORDER BY award_date DESC, id DESC')

export const getAward = (id: number) =>
  one<Award>('SELECT * FROM awards WHERE id = ? AND deleted_at IS NULL', [id])

export const getItemImages = (type: 'award' | 'self_dev', id: number) =>
  all<ItemImage>(`SELECT * FROM item_images WHERE entity_type = ? AND entity_id = ?
                  ORDER BY sort_order, id`, [type, id])

export const getItemFiles = (type: 'award' | 'self_dev', id: number) =>
  all<ItemFile>(`SELECT * FROM item_files WHERE entity_type = ? AND entity_id = ?
                 ORDER BY sort_order, id`, [type, id])

/* ---------------- ตัวเลขสรุปหน้าแรก ---------------- */

/** ตัวเลขสรุป — รวมเป็นคำสั่งเดียว เพราะการวิ่งไปฐานข้อมูลแต่ละครั้งมีค่าหน่วงราว 150 ms */
export const getStats = cache(async () => {
  const r = await one<{ works: number; images: number; hours: number; awards: number }>(`
    SELECT
      (SELECT COUNT(*) FROM works WHERE deleted_at IS NULL AND status='published') AS works,
      (SELECT COUNT(*) FROM work_images)                                           AS images,
      (SELECT COALESCE(SUM(hours),0) FROM self_developments WHERE deleted_at IS NULL) AS hours,
      (SELECT COUNT(*) FROM awards WHERE deleted_at IS NULL)                       AS awards`)
  return {
    works: Number(r?.works ?? 0),
    images: Number(r?.images ?? 0),
    hours: Number(r?.hours ?? 0),
    awards: Number(r?.awards ?? 0),
  }
})
