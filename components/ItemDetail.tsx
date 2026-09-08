import Link from 'next/link'
import Gallery, { type GalleryItem } from '@/components/Gallery'
import { fileUrl } from '@/lib/media'
import type { ItemFile } from '@/lib/types'

export interface ItemDetailProps {
  backHref: string
  backLabel: string
  chip: string
  title: string
  meta: [string, string][]
  summary?: string
  content?: string | null
  note?: string
  videoUrl?: string
  linkUrl?: string
  linkLabel?: string
  images: GalleryItem[]
  files: ItemFile[]
  gradient: string
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

export default function ItemDetail(p: ItemDetailProps) {
  const yt = p.videoUrl ? youtubeId(p.videoUrl) : null
  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: p.gradient }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <nav className="text-[12px] text-white/75 mb-3">
            <Link href="/" className="hover:underline">หน้าแรก</Link>
            <span className="mx-1.5">/</span>
            <Link href={p.backHref} className="hover:underline">{p.backLabel}</Link>
          </nav>
          <span className="chip chip-glass">{p.chip}</span>
          <h1 className="mt-3 text-[24px] md:text-[34px] font-extrabold leading-tight">{p.title}</h1>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-6 md:-mt-8 pb-12 relative z-10">
        <div className="grid lg:grid-cols-[1.65fr_.85fr] gap-6 lg:gap-7 items-start">
          <div className="min-w-0">
            {p.images.length > 0 && <Gallery images={p.images} title={p.title} />}

            <div className="card-soft p-5 md:p-7 mt-6">
              <h2 className="text-[18px] font-extrabold">รายละเอียด<span className="grad-text">เพิ่มเติม</span></h2>
              {p.summary && <p className="mt-3 text-[14.5px] text-ink-soft leading-relaxed">{p.summary}</p>}
              {p.content && <div className="rich mt-4" dangerouslySetInnerHTML={{ __html: p.content }} />}
              {p.note && !p.content && <p className="mt-3 text-[14px] text-ink-soft leading-relaxed">{p.note}</p>}
              {!p.summary && !p.content && !p.note && (
                <p className="mt-3 text-[14px] text-ink-faint">ยังไม่ได้กรอกรายละเอียด</p>
              )}

              {yt && (
                <div className="mt-5 rounded-[1.2rem] overflow-hidden bg-black aspect-video">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${yt}`}
                    title={p.title} allowFullScreen
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              )}

              {p.linkUrl && (
                <a href={p.linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-5">
                  🔗 {p.linkLabel || 'เปิดลิงก์ที่เกี่ยวข้อง'}
                </a>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-5">
            <div className="card-soft p-5">
              <h2 className="font-extrabold text-[15.5px] mb-2.5">ข้อมูล</h2>
              <dl className="text-[13px]">
                {p.meta.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-2 border-b border-[color:var(--divider)] last:border-0">
                    <dt className="w-[92px] shrink-0 text-ink-muted">{k}</dt>
                    <dd className="font-semibold flex-1 text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {p.files.length > 0 && (
              <div className="card-soft p-5">
                <h2 className="font-extrabold text-[15.5px] mb-3">
                  ไฟล์แนบ <span className="text-ink-muted font-semibold">({p.files.length})</span>
                </h2>
                <div className="flex flex-col gap-2">
                  {p.files.map((f) => (
                    <a key={f.id} href={fileUrl(f) ?? '#'} target="_blank" rel="noopener noreferrer"
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
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
