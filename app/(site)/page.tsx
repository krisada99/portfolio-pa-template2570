import Link from 'next/link'
import { getProfile, getDomains, getIndicators, getWorkCountByIndicator, getWorks, getStats } from '@/lib/queries'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import { domainTheme, currentAcademicYear } from '@/lib/theme'
import WorkCard from '@/components/WorkCard'
import SectionHead from '@/components/SectionHead'

export default async function HomePage() {
  const [profile, domains, indicators, counts, latest, stats] = await Promise.all([
    getProfile(), getDomains(), getIndicators(), getWorkCountByIndicator(),
    getWorks({ limit: 6 }), getStats(),
  ])

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 dots opacity-25 pointer-events-none" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-12 md:py-16
                        grid md:grid-cols-[1.15fr_.85fr] gap-8 md:gap-10 items-center">
          <div>
            <span className="chip chip-glass">📘 แฟ้มสะสมผลงานครู · วPA ว9/2564</span>
            <h1 className="mt-4 text-[28px] md:text-[42px] font-extrabold leading-[1.25]">
              {profile?.full_name || 'ชื่อ–สกุลของคุณครู'}
            </h1>
            <p className="mt-2 text-[15px] md:text-[17px] font-semibold text-white/90">
              {profile?.position} {profile?.academic_standing}
            </p>
            {profile?.subject_group && (
              <p className="text-[14px] md:text-[15px] text-white/80">
                กลุ่มสาระ{profile.subject_group}
              </p>
            )}
            {profile?.motto && (
              <p className="mt-4 text-[14.5px] text-white/85 italic border-l-2 border-[color:var(--gold)] pl-3.5">
                “{profile.motto}”
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/pa" className="btn btn-gold">ดูข้อตกลง PA</Link>
              <Link href="/about" className="btn chip-glass !rounded-full !min-h-[42px] !px-5">ประวัติครู</Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[1.6rem] overflow-hidden border-4 border-white/20 shadow-2xl
                            aspect-[4/5] max-w-[300px] mx-auto bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl({ source: profile?.avatar_source ?? null, ref: profile?.avatar_ref ?? null }, IMG.avatar)}
                alt={profile?.full_name ?? ''}
                className="w-full h-full object-cover"
                style={{ objectPosition: focalPosition(profile?.avatar_focus_x, profile?.avatar_focus_y) }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- ตัวเลขสรุป ---------------- */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { n: stats.works, label: 'ผลงาน / หลักฐาน', icon: '📁' },
            { n: stats.images, label: 'ภาพกิจกรรม', icon: '🖼️' },
            { n: stats.hours, label: 'ชั่วโมงพัฒนาตนเอง', icon: '🌱' },
            { n: stats.awards, label: 'รางวัลและเกียรติคุณ', icon: '🏆' },
          ].map((s) => (
            <div key={s.label} className="card-soft p-4 md:p-5 text-center">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-1 text-[26px] md:text-[30px] font-extrabold grad-text leading-none">
                {s.n.toLocaleString('th-TH')}
              </div>
              <div className="mt-1 text-[12px] text-ink-muted font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 3 ด้าน 15 ตัวชี้วัด ---------------- */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-14">
        <SectionHead chip="📋 เกณฑ์ ว9/2564" title="3 ด้าน" accent="15 ตัวชี้วัด" />
        <div className="grid md:grid-cols-3 gap-5">
          {domains.map((d) => {
            const t = domainTheme(d.code)
            const list = indicators.filter((i) => i.domain_id === d.id)
            const total = list.reduce((s, i) => s + (counts.get(i.id) ?? 0), 0)
            return (
              <div key={d.id} className="card-soft overflow-hidden flex flex-col">
                <div className="p-5 text-white" style={{ background: t.grad }}>
                  <div className="text-2xl">{t.icon}</div>
                  <h3 className="mt-1.5 font-extrabold text-[16px] leading-snug">ด้านที่ {d.code}</h3>
                  <p className="text-[13px] text-white/85 leading-snug">{d.name}</p>
                </div>
                <ul className="p-4 flex flex-col gap-1.5 flex-1">
                  {list.map((i) => (
                    <li key={i.id}>
                      <Link href={`/indicator/${i.id}`}
                        className="flex items-start gap-2 px-2.5 py-2 rounded-xl hover:bg-[color:var(--divider)] transition">
                        <span className={`chip ${t.chip} !text-[10.5px] !px-2 !py-0.5 shrink-0`}>{i.code}</span>
                        <span className="text-[13px] leading-snug flex-1">{i.name}</span>
                        <span className="text-[11.5px] text-ink-faint shrink-0">{counts.get(i.id) ?? 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="px-5 py-3 border-t border-[color:var(--divider)] text-[12px] text-ink-muted">
                  รวม <b className="text-ink">{total}</b> ผลงาน
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------- ผลงานล่าสุด ---------------- */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-14">
        <SectionHead
          chip="📚 หลักฐาน"
          title="ผลงาน"
          accent="ล่าสุด"
          right={<span className="text-[13px] text-ink-muted">ปีการศึกษา {currentAcademicYear()}</span>}
        />
        {latest.length === 0 ? (
          <div className="card-soft p-8 text-center text-ink-muted text-[14px]">ยังไม่มีผลงานในระบบ</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {latest.map((w) => <WorkCard key={w.id} work={w} />)}
          </div>
        )}
      </section>
    </>
  )
}
