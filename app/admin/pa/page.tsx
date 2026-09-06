import Link from 'next/link'
import { all } from '@/lib/db'
import { thaiDate } from '@/lib/theme'

interface Row {
  id: number; fiscal_year: number; round: number; status: string
  period_start: string | null; period_end: string | null; details: number
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'ร่าง', in_progress: 'กำลังดำเนินการ', evaluated: 'ประเมินแล้ว',
}

export default async function PaAdmin({
  searchParams,
}: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams
  const rows = await all<Row>(
    `SELECT a.id, a.fiscal_year, a.round, a.status, a.period_start, a.period_end,
            (SELECT COUNT(*) FROM pa_details d WHERE d.agreement_id = a.id) AS details
     FROM pa_agreements a WHERE a.deleted_at IS NULL ORDER BY a.fiscal_year DESC`)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">ข้อตกลงในการพัฒนางาน (PA)</h1>
          <p className="text-[13px] text-ink-muted">{rows.length} ปีงบประมาณ</p>
        </div>
        <div className="flex items-center gap-3">
          {deleted === '1' && <span className="chip !text-[12px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>✓ ลบแล้ว</span>}
          <Link href="/admin/pa/new" className="btn btn-primary">+ เพิ่มปีงบประมาณ</Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[color:var(--divider)] text-left">
              <th className="px-3 py-2.5 w-12 font-bold">#</th>
              <th className="px-3 py-2.5 font-bold">ปีงบประมาณ</th>
              <th className="px-3 py-2.5 w-56 font-bold">ช่วงข้อตกลง</th>
              <th className="px-3 py-2.5 w-28 font-bold">ตัวชี้วัดที่กรอก</th>
              <th className="px-3 py-2.5 w-36 font-bold">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-ink-muted">
                ยังไม่มีข้อตกลง — <Link href="/admin/pa/new" className="text-primary-deep font-bold hover:underline">เพิ่มปีแรก</Link>
              </td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id} className="border-t border-[color:var(--divider)] hover:bg-[color:var(--divider)]/40">
                <td className="px-3 py-2.5 text-ink-faint">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/admin/pa/${r.id}`} className="font-bold text-[14px] hover:text-primary-deep hover:underline">
                    ปีงบประมาณ {r.fiscal_year}
                  </Link>
                  <span className="block text-[11.5px] text-ink-faint">รอบที่ {r.round}</span>
                </td>
                <td className="px-3 py-2.5 text-ink-muted">
                  {thaiDate(r.period_start)} – {thaiDate(r.period_end)}
                </td>
                <td className="px-3 py-2.5">{r.details} / 15</td>
                <td className="px-3 py-2.5"><span className="chip !text-[11px]">{STATUS_LABEL[r.status] ?? r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
