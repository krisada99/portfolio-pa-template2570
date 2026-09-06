import Link from 'next/link'
import { getSelfDevs, getSelfDevYears, getAwards } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import { imageUrl, IMG } from '@/lib/media'
import SectionHead from '@/components/SectionHead'
import YearTabs from '@/components/YearTabs'

export const metadata = { title: 'การพัฒนาตนเอง' }

const TYPE_ICON: Record<string, string> = {
  'อบรม': '📘', 'สัมมนา': '🎤', 'ศึกษาดูงาน': '🚌', 'PLC': '🤝', 'วิทยากร': '🧑‍🏫',
}

export default async function DevelopmentPage({
  searchParams,
}: { searchParams: Promise<{ year?: string }> }) {
  const { year } = await searchParams
  const years = await getSelfDevYears()
  const cur = Number(year) || years[0] || 0
  const [items, awards] = await Promise.all([
    getSelfDevs(cur || undefined), getAwards(),
  ])
  const totalHours = items.reduce((s, i) => s + Number(i.hours || 0), 0)

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <span className="chip chip-glass">🌱 ด้านที่ 3</span>
          <h1 className="mt-3 text-[26px] md:text-[36px] font-extrabold leading-tight">การพัฒนาตนเองและวิชาชีพ</h1>
          <p className="mt-1.5 text-[14px] text-white/80 leading-relaxed">
            อบรม สัมมนา ชุมชนการเรียนรู้ทางวิชาชีพ (PLC) ศึกษาดูงาน<br />
            และการเป็นวิทยากร รวมถึงรางวัลและเกียรติคุณที่ได้รับ
          </p>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-8 relative">
        <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <div className="text-[26px] font-extrabold grad-text leading-none">{items.length}</div>
              <div className="text-[12px] text-ink-muted font-semibold">รายการ</div>
            </div>
            <div>
              <div className="text-[26px] font-extrabold grad-text leading-none">{totalHours}</div>
              <div className="text-[12px] text-ink-muted font-semibold">ชั่วโมงรวม</div>
            </div>
          </div>
          <YearTabs years={years} current={cur} hrefFor={(y) => `/development?year=${y}`} />
        </div>
      </div>

      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-10">
        <SectionHead chip="📘 พัฒนาตนเอง" title="รายการ" accent={cur ? `ปีงบประมาณ ${cur}` : 'ทั้งหมด'} />
        {items.length === 0 ? (
          <div className="card p-8 text-center text-ink-muted text-[14px]">ยังไม่มีรายการในปีนี้</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[780px]">
                <thead>
                  <tr className="bg-[color:var(--divider)] text-left">
                    <th className="px-3 py-2.5 w-12 font-bold">#</th>
                    <th className="px-3 py-2.5 font-bold">รายการ</th>
                    <th className="px-3 py-2.5 w-[16%] font-bold">ประเภท</th>
                    <th className="px-3 py-2.5 w-[20%] font-bold">หน่วยงาน</th>
                    <th className="px-3 py-2.5 w-[15%] font-bold">วันที่</th>
                    <th className="px-3 py-2.5 w-20 font-bold text-right">ชั่วโมง</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, n) => (
                    <tr key={it.id} className="border-t border-[color:var(--divider)] hover:bg-[color:var(--divider)]/40">
                      <td className="px-3 py-3 text-ink-faint">{n + 1}</td>
                      <td className="px-3 py-3">
                        <Link href={`/training/${it.id}`} className="font-semibold hover:text-primary-deep hover:underline">
                          {it.title}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className="chip !text-[11px]">{TYPE_ICON[it.type] ?? '📘'} {it.type}</span>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{it.organizer || '—'}</td>
                      <td className="px-3 py-3 text-ink-muted">{thaiDate(it.start_date) || '—'}</td>
                      <td className="px-3 py-3 text-right font-bold">{it.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-14">
        <SectionHead chip="🏆 เกียรติคุณ" title="รางวัลและ" accent="เกียรติคุณ" />
        {awards.length === 0 ? (
          <div className="card p-8 text-center text-ink-muted text-[14px]">ยังไม่มีรางวัลในระบบ</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {awards.map((a) => (
              <Link key={a.id} href={`/award/${a.id}`} className="card card-hover overflow-hidden flex flex-col group">
                <div className="h-[170px] bg-[color:var(--divider)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl({ source: a.image_source, ref: a.image_ref }, IMG.card)}
                    alt={a.title} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="chip chip-gold !text-[11px] self-start">🏅 ระดับ{a.level}</span>
                  <h3 className="mt-2 font-extrabold text-[14.5px] leading-snug line-2">{a.title}</h3>
                  <p className="mt-1 text-[12.5px] text-ink-muted line-2">{a.awarder}</p>
                  <p className="mt-auto pt-3 text-[11.5px] text-ink-faint">📅 {thaiDate(a.award_date) || '—'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
