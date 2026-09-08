import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { getAwards } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import { imageUrl, IMG } from '@/lib/media'

export default async function AwardsAdmin({
  searchParams,
}: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { deleted } = await searchParams
  const rows = await getAwards()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">รางวัลและเกียรติคุณ</h1>
          <p className="text-[13px] text-ink-muted">{rows.length} รายการ</p>
        </div>
        <div className="flex items-center gap-3">
          {deleted === '1' && <span className="chip !text-[12px]" style={{ background: '#E8F6EE', color: '#2E7D4F', borderColor: '#B6E3C8' }}>✓ ลบแล้ว</span>}
          <Link href="/admin/awards/new" className="btn btn-primary">+ เพิ่มรางวัล</Link>
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead>
              <tr className="bg-[color:var(--divider)] text-left">
                <th className="px-3 py-2.5 w-12 font-bold">#</th>
                <th className="px-3 py-2.5 w-20 font-bold">รูป</th>
                <th className="px-3 py-2.5 font-bold">ชื่อรางวัล</th>
                <th className="px-3 py-2.5 w-28 font-bold">ระดับ</th>
                <th className="px-3 py-2.5 w-32 font-bold">วันที่ได้รับ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-10 text-center text-ink-muted">ยังไม่มีรางวัล</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="border-t border-[color:var(--divider)] hover:bg-[color:var(--divider)]/40">
                  <td className="px-3 py-2.5 text-ink-faint">{i + 1}</td>
                  <td className="px-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl({ source: r.image_source, ref: r.image_ref }, IMG.thumb)} alt=""
                      className="w-14 h-11 rounded-lg object-cover bg-[color:var(--divider)]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/awards/${r.id}`} className="font-semibold hover:text-primary-deep hover:underline">{r.title}</Link>
                    <span className="block text-[11.5px] text-ink-faint">{r.awarder}</span>
                  </td>
                  <td className="px-3 py-2.5"><span className="chip chip-accent !text-[11px]">{r.level}</span></td>
                  <td className="px-3 py-2.5 text-ink-muted">{thaiDate(r.award_date) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
