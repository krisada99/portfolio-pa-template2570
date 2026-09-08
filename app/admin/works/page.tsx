import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { all } from '@/lib/db'
import { getIndicators } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'

interface Row {
  id: number; title: string; academic_year: number; status: string
  work_date: string | null; indicator_code: string; images: number
}

export default async function WorksAdmin({
  searchParams,
}: { searchParams: Promise<{ ind?: string; deleted?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { ind, deleted } = await searchParams
  const indId = Number(ind) || 0
  const [rows, indicators] = await Promise.all([
    all<Row>(
      `SELECT w.id, w.title, w.academic_year, w.status, w.work_date, i.code AS indicator_code,
              (SELECT COUNT(*) FROM work_images wi WHERE wi.work_id = w.id) AS images
       FROM works w JOIN indicators i ON i.id = w.indicator_id
       WHERE w.deleted_at IS NULL ${indId ? 'AND w.indicator_id = ?' : ''}
       ORDER BY w.work_date DESC, w.id DESC`, indId ? [indId] : []),
    getIndicators(),
  ])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">ผลงาน</h1>
          <p className="text-[13px] text-ink-muted">ทั้งหมด {rows.length} รายการ</p>
        </div>
        <div className="flex items-center gap-3">
          {deleted === '1' && (
            <span className="chip !text-[12px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>
              ✓ ลบแล้ว
            </span>
          )}
          <Link href="/admin/works/new" className="btn btn-primary">+ เพิ่มผลงาน</Link>
        </div>
      </div>

      <form className="card-soft p-4 flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[240px]">
          <span className="block text-[12.5px] font-bold text-ink-muted mb-1">กรองตามตัวชี้วัด</span>
          <select name="ind" defaultValue={indId || ''}
            className="w-full h-10 px-3 rounded-xl border border-[color:var(--border)] bg-white text-[13.5px]">
            <option value="">ทุกตัวชี้วัด</option>
            {indicators.map((i) => <option key={i.id} value={i.id}>{i.code} {i.name}</option>)}
          </select>
        </label>
        <button type="submit" className="btn btn-ghost">กรอง</button>
      </form>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="bg-[color:var(--divider)] text-left">
                <th className="px-3 py-2.5 w-12 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">ชื่อผลงาน</th>
                <th className="px-3 py-2.5 w-24 font-bold">ตัวชี้วัด</th>
                <th className="px-3 py-2.5 w-24 font-bold">ปีการศึกษา</th>
                <th className="px-3 py-2.5 w-20 font-bold">รูป</th>
                <th className="px-3 py-2.5 w-28 font-bold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-ink-muted">
                  ยังไม่มีผลงาน — <Link href="/admin/works/new" className="text-primary-deep font-bold hover:underline">เพิ่มผลงานแรก</Link>
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="border-t border-[color:var(--divider)] hover:bg-[color:var(--divider)]/40">
                  <td className="px-3 py-2.5 text-ink-faint">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/works/${r.id}`} className="font-semibold hover:text-primary-deep hover:underline">{r.title}</Link>
                    <span className="block text-[11.5px] text-ink-faint">{thaiDate(r.work_date)}</span>
                  </td>
                  <td className="px-3 py-2.5">{r.indicator_code}</td>
                  <td className="px-3 py-2.5">{r.academic_year}</td>
                  <td className="px-3 py-2.5">{r.images}</td>
                  <td className="px-3 py-2.5">
                    {r.status === 'published'
                      ? <span className="chip !text-[11px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>เผยแพร่</span>
                      : <span className="chip !text-[11px]" style={{ background: 'var(--gold-soft)', color: 'var(--gold-deep)', borderColor: 'var(--gold-line)' }}>ฉบับร่าง</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
