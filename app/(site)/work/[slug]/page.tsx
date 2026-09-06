import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkBySlug, getWorkImages, getWorkFiles, getRelatedWorks } from '@/lib/queries'
import { domainTheme, thaiDate } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import Gallery from '@/components/Gallery'
import WorkCard from '@/components/WorkCard'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const w = await getWorkBySlug(decodeURIComponent(slug))
  return { title: w?.title ?? 'ไม่พบผลงาน', description: w?.summary }
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const work = await getWorkBySlug(decodeURIComponent(slug))
  if (!work) notFound()

  const [images, files, related] = await Promise.all([
    getWorkImages(work.id), getWorkFiles(work.id), getRelatedWorks(work.indicator_id, work.id),
  ])
  const t = domainTheme(work.domain_code)
  const yt = work.video_url ? youtubeId(work.video_url) : null
  const tags = work.tags ? work.tags.split(',').map((s) => s.trim()).filter(Boolean) : []

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: t.grad }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <nav className="text-[12px] text-white/75 mb-3" aria-label="breadcrumb">
            <Link href="/" className="hover:underline">หน้าแรก</Link>
            <span className="mx-1.5">/</span>
            <Link href={`/indicator/${work.indicator_id}`} className="hover:underline">
              ตัวชี้วัด {work.indicator_code}
            </Link>
          </nav>
          <span className="chip chip-glass">{t.icon} {work.indicator_code} {work.indicator_name}</span>
          <h1 className="mt-3 text-[24px] md:text-[36px] font-extrabold leading-tight">{work.title}</h1>
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/80">
            <span>📅 {thaiDate(work.work_date) || `ปีการศึกษา ${work.academic_year}`}</span>
            <span>👁 {work.view_count} ครั้ง</span>
            <span>🖼️ {images.length} รูป</span>
            {files.length > 0 && <span>📎 {files.length} ไฟล์</span>}
          </p>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-6 md:-mt-8 pb-12">
        <div className="grid lg:grid-cols-[1.65fr_.85fr] gap-6 lg:gap-7 items-start">
          <div className="min-w-0">
            {images.length > 0 && <Gallery images={images} title={work.title} />}

            <div className="card p-5 md:p-7 mt-6">
              <h2 className="text-[18px] md:text-[20px] font-extrabold">
                รายละเอียด<span className="grad-text">ผลงาน</span>
              </h2>
              {work.summary && (
                <p className="mt-3 pl-3.5 border-l-2 text-[14.5px] text-ink-soft leading-relaxed"
                   style={{ borderColor: t.solid }}>{work.summary}</p>
              )}
              {work.content && (
                <div className="rich mt-4" dangerouslySetInnerHTML={{ __html: work.content }} />
              )}

              {yt && (
                <div className="mt-5 rounded-[1.2rem] overflow-hidden bg-black aspect-video">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${yt}`}
                    title={work.title} allowFullScreen
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              )}

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((tag) => <span key={tag} className="chip !text-[11.5px]">#{tag}</span>)}
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="card p-5">
              <h2 className="font-extrabold text-[15.5px] mb-2.5">ข้อมูลผลงาน</h2>
              <dl className="text-[13px]">
                {[
                  ['ด้าน', `ด้านที่ ${work.domain_code}`],
                  ['ตัวชี้วัด', `${work.indicator_code} ${work.indicator_name}`],
                  ['ปีการศึกษา', `${work.academic_year} · ภาคเรียนที่ ${work.semester}`],
                  ['วันที่จัดทำ', thaiDate(work.work_date) || '—'],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex gap-3 py-2 border-b border-[color:var(--divider)] last:border-0">
                    <dt className="w-[86px] shrink-0 text-ink-muted">{k}</dt>
                    <dd className="font-semibold flex-1 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {files.length > 0 && (
              <div className="card p-5">
                <h2 className="font-extrabold text-[15.5px] mb-3">
                  ไฟล์แนบ <span className="text-ink-muted font-semibold">({files.length})</span>
                </h2>
                <div className="flex flex-col gap-2">
                  {files.map((f) => {
                    const href = fileUrl(f)
                    return (
                      <a key={f.id} href={href ?? '#'} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-xl border border-[color:var(--border)] hover:border-[color:var(--primary-line)] transition">
                        <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                              style={{ background: 'var(--primary-soft)' }}>📄</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold truncate">{f.original_name}</span>
                          <span className="block text-[11px] text-ink-faint">
                            {f.source === 'drive' ? 'เปิดใน Google Drive' : 'ดาวน์โหลด'}
                          </span>
                        </span>
                        <span className="text-[13px]">↗</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="card p-5">
                <h2 className="font-extrabold text-[15.5px] mb-3">ผลงานที่เกี่ยวข้อง</h2>
                <div className="flex flex-col gap-2.5">
                  {related.map((r) => (
                    <Link key={r.id} href={`/work/${r.slug}`}
                      className="text-[13px] font-semibold leading-snug hover:text-primary-deep line-2">
                      → {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="pt-12">
            <h2 className="text-[20px] font-extrabold mb-5">ผลงานอื่นใน<span className="grad-text">ตัวชี้วัดเดียวกัน</span></h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((r) => <WorkCard key={r.id} work={r} />)}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
