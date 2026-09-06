import Link from 'next/link'
import { getSelfDevs } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'

export default async function SelfDevAdmin({
  searchParams,
}: { searchParams: Promise<{ deleted?: string }> }) {
  const { deleted } = await searchParams
  const rows = await getSelfDevs()
  const hours = rows.reduce((s, r) => s + Number(r.hours || 0), 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">การพัฒนาตนเอง</h1>
          <p className="text-[13px] text-ink-muted">{rows.length} รายการ · รวม {hours} ชั่วโมง</p>
        </div>
        <div className="flex items-center gap-3">
          {deleted === '1' && <span className="chip !text-[12px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>✓ ลบแล้ว</span>}
          <Link href="/admin/self-dev/new" className="btn btn-primary">+ เพิ่มรายการ</Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[700px]">
            <thead>
              <tr className="bg-[color:var(--divider)] text-left">
                <th className="px-3 py-2.5 w-12 font-bold">#</th>
                <th className="px-3 py-2.5 font-bold">รายการ</th>
                <th className="px-3 py-2.5 w-28 font-bold">ประเภท</th>
                <th className="px-3 py-2.5 w-32 font-bold">วันที่</th>
                <th className="px-3 py-2.5 w-24 font-bold">ปีงบฯ</th>
                <th className="px-3 py-2.5 w-20 font-bold text-right">ชั่วโมง</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-ink-muted">ยังไม่มีรายการ</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="border-t border-[color:var(--divider)] hover:bg-[color:var(--divider)]/40">
                  <td className="px-3 py-2.5 text-ink-faint">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/self-dev/${r.id}`} className="font-semibold hover:text-primary-deep hover:underline">{r.title}</Link>
                    <span className="block text-[11.5px] text-ink-faint">{r.organizer}</span>
                  </td>
                  <td className="px-3 py-2.5"><span className="chip !text-[11px]">{r.type}</span></td>
                  <td className="px-3 py-2.5 text-ink-muted">{thaiDate(r.start_date) || '—'}</td>
                  <td className="px-3 py-2.5">{r.fiscal_year}</td>
                  <td className="px-3 py-2.5 text-right font-bold">{r.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
