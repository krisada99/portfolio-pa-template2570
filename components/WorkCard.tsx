import Link from 'next/link'
import type { Work } from '@/lib/types'
import { imageUrl, IMG } from '@/lib/media'
import { domainTheme, thaiDate } from '@/lib/theme'

export default function WorkCard({ work }: { work: Work }) {
  const t = domainTheme(work.domain_code)
  return (
    <Link href={`/work/${work.slug}`} className="card card-hover overflow-hidden flex flex-col group">
      <div className="relative h-[180px] bg-[color:var(--divider)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl({ source: work.cover_source, ref: work.cover_ref }, IMG.card)}
          alt={work.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <span className="absolute top-3 left-3 chip chip-glass !text-[11px]">
          {t.icon} ตัวชี้วัด {work.indicator_code}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-[15px] leading-snug line-2">{work.title}</h3>
        {work.summary && <p className="mt-1.5 text-[13px] text-ink-muted line-2">{work.summary}</p>}
        <div className="mt-auto pt-3 flex items-center justify-between text-[11.5px] text-ink-faint">
          <span>📅 {thaiDate(work.work_date) || `ปีการศึกษา ${work.academic_year}`}</span>
          <span>👁 {work.view_count}</span>
        </div>
      </div>
    </Link>
  )
}
