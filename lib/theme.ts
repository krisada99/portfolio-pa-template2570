/** สีและไอคอนประจำ 3 ด้านของ วPA — ใช้ทั้งเว็บให้ตรงกัน */
export interface DomainTheme {
  icon: string; chip: string; solid: string; soft: string; deep: string; grad: string
}

const THEMES: Record<number, DomainTheme> = {
  1: { icon: '📚', chip: 'chip-d1', solid: 'var(--d1)', soft: 'var(--d1-soft)', deep: 'var(--d1-deep)',
       grad: 'linear-gradient(135deg,var(--d1-deep),var(--d1))' },
  2: { icon: '🤝', chip: 'chip-d2', solid: 'var(--d2)', soft: 'var(--d2-soft)', deep: 'var(--d2-deep)',
       // ด้าน 2 เป็นสีเหลือง ถ้าใช้เหลืองสดเป็นพื้นแล้ววางตัวหนังสือขาว จะได้ contrast แค่ 1.96:1
       // (เกณฑ์ WCAG AA ต้อง 4.5:1) จึงใช้เฉดทองเข้มเป็นพื้นแทน — วัดได้ 4.8–6.9:1
       // ส่วนเหลืองสดยังใช้เป็นสีเน้นบนพื้นขาวได้ตามปกติ (chip-d2)
       grad: 'linear-gradient(135deg,#5A4406,#8F6D00)' },
  3: { icon: '🌱', chip: 'chip-d3', solid: 'var(--d3)', soft: 'var(--d3-soft)', deep: 'var(--d3-deep)',
       grad: 'linear-gradient(135deg,var(--d3-deep),var(--d3))' },
}

export const domainTheme = (code: number | undefined | null): DomainTheme =>
  THEMES[Number(code)] ?? THEMES[1]!

export const VALID_THEMES = ['royal', 'emerald', 'maroon'] as const
export type SiteTheme = (typeof VALID_THEMES)[number]
export const isSiteTheme = (v: unknown): v is SiteTheme =>
  typeof v === 'string' && (VALID_THEMES as readonly string[]).includes(v)

/** พ.ศ. ปีการศึกษาปัจจุบัน (เปลี่ยนปีในเดือนพฤษภาคม) */
export function currentAcademicYear(d = new Date()): number {
  const be = d.getFullYear() + 543
  return d.getMonth() + 1 >= 5 ? be : be - 1
}

/**
 * วันที่แบบไทย — ตรงกับ thai_date($date, $short) ของเว็บ PHP
 *   short = true  → 5 มิ.ย. 2569
 *   short = false → 5 มิถุนายน 2569
 * ไม่มีวันที่คืน '—' เหมือนกัน
 */
const TH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const TH_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                 'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

export function thaiDate(value: string | null | undefined, short = true): string {
  if (!value || value === '0000-00-00') return '—'
  const d = new Date(String(value).slice(0, 10) + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return '—'
  const m = (short ? TH_SHORT : TH_FULL)[d.getMonth()]
  return `${d.getDate()} ${m} ${d.getFullYear() + 543}`
}
