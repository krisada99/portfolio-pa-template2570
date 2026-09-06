import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getIndicator, getWorks, getIndicators } from '@/lib/queries'
import { domainTheme } from '@/lib/theme'
import WorkCard from '@/components/WorkCard'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ind = await getIndicator(Number(id))
  return { title: ind ? `ตัวชี้วัด ${ind.code} ${ind.name}` : 'ไม่พบตัวชี้วัด' }
}

export default async function IndicatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ind = await getIndicator(Number(id))
  if (!ind) notFound()

  const [works, allInd] = await Promise.all([
    getWorks({ indicatorId: ind.id }), getIndicators(),
  ])
  const t = domainTheme(ind.domain_code)
  const pos = allInd.findIndex((x) => x.id === ind.id)
  const prev = pos > 0 ? allInd[pos - 1] : undefined
  const next = pos >= 0 && pos < allInd.length - 1 ? allInd[pos + 1] : undefined

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: t.grad }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <nav className="text-[12px] text-white/75 mb-3" aria-label="breadcrumb">
            <Link href="/" className="hover:underline">หน้าแรก</Link>
            <span className="mx-1.5">/</span>
            <Link href="/pa" className="hover:underline">ข้อตกลง PA · ด้านที่ {ind.domain_code}</Link>
            <span className="mx-1.5">/</span>
            <span>ตัวชี้วัด {ind.code}</span>
          </nav>
          <span className="chip chip-glass">{t.icon} ด้านที่ {ind.domain_code} · {ind.domain_name}</span>
          <h1 className="mt-3 text-[24px] md:text-[34px] font-extrabold leading-tight">
            <span className="opacity-70 mr-2">{ind.code}</span>{ind.name}
          </h1>
          {ind.description && (
            <p className="mt-2 text-[14px] text-white/85 leading-relaxed max-w-[900px]">{ind.description}</p>
          )}
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 pb-10">
        <section className="pt-8 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
            <div>
              <span className="chip chip-gold">📚 หลักฐาน</span>
              <h2 className="mt-2.5 text-[24px] md:text-[32px] font-extrabold leading-tight">
                ผลงานของ<span className="grad-text">ตัวชี้วัดนี้</span>
              </h2>
            </div>
            <p className="text-[13.5px] text-ink-muted">พบ <b className="text-primary-deep">{works.length}</b> ผลงาน</p>
          </div>

          {works.length === 0 ? (
            <div className="card p-10 text-center text-ink-muted text-[14px]">ยังไม่มีผลงานในตัวชี้วัดนี้</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {works.map((w) => <WorkCard key={w.id} work={w} />)}
            </div>
          )}
        </section>

        <nav className="mt-10 grid sm:grid-cols-2 gap-4">
          {prev && (
            <Link href={`/indicator/${prev.id}`} className="card card-hover p-4 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                    style={{ background: 'var(--primary-soft)' }}>←</span>
              <span className="min-w-0">
                <span className="block text-[11.5px] text-ink-muted">ตัวชี้วัดก่อนหน้า</span>
                <span className="block font-bold text-[13.5px] line-2">{prev.code} {prev.name}</span>
              </span>
            </Link>
          )}
          {next && (
            <Link href={`/indicator/${next.id}`} className="card card-hover p-4 flex items-center gap-3 sm:col-start-2 text-right">
              <span className="min-w-0 ml-auto">
                <span className="block text-[11.5px] text-ink-muted">ตัวชี้วัดถัดไป</span>
                <span className="block font-bold text-[13.5px] line-2">{next.code} {next.name}</span>
              </span>
              <span className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                    style={{ background: 'var(--primary-soft)' }}>→</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  )
}
