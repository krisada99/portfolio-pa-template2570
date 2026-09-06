import { getProfile, getEducations, getCareerPaths } from '@/lib/queries'
import { imageUrl, focalPosition, IMG } from '@/lib/media'
import SectionHead from '@/components/SectionHead'

export const metadata = { title: 'ประวัติครู' }

export default async function AboutPage() {
  const [profile, educations, careers] = await Promise.all([
    getProfile(), getEducations(), getCareerPaths(),
  ])

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <span className="chip chip-glass">👤 เกี่ยวกับครู</span>
          <h1 className="mt-3 text-[26px] md:text-[36px] font-extrabold">ประวัติและข้อมูลส่วนตัว</h1>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-8 relative pb-4">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-6 items-start">
          <div className="card p-5 text-center">
            <div className="w-[180px] h-[180px] mx-auto rounded-2xl overflow-hidden bg-[color:var(--divider)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl({ source: profile?.avatar_source ?? null, ref: profile?.avatar_ref ?? null }, IMG.avatar)}
                alt={profile?.full_name ?? ''}
                className="w-full h-full object-cover"
                style={{ objectPosition: focalPosition(profile?.avatar_focus_x, profile?.avatar_focus_y) }}
              />
            </div>
            <h2 className="mt-4 text-[18px] font-extrabold">{profile?.full_name}</h2>
            <p className="text-[13.5px] text-ink-muted">{profile?.position} {profile?.academic_standing}</p>
            {profile?.subject_group && (
              <p className="text-[13px] text-ink-muted mt-0.5">กลุ่มสาระ{profile.subject_group}</p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {profile?.experience_years ? <span className="chip">🎯 ประสบการณ์ {profile.experience_years} ปี</span> : null}
              {profile?.teaching_hours ? <span className="chip chip-gold">⏰ สอน {profile.teaching_hours} ชม./สัปดาห์</span> : null}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="card p-5 md:p-6">
              <h3 className="font-extrabold text-[16px] mb-3">ข้อมูลทั่วไป</h3>
              <dl className="text-[13.5px]">
                {[
                  ['โรงเรียน', profile?.school],
                  ['สังกัด', profile?.affiliation],
                  ['เขตพื้นที่การศึกษา', profile?.area_office],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={String(k)} className="flex gap-3 py-2 border-b border-[color:var(--divider)] last:border-0">
                    <dt className="w-[150px] shrink-0 text-ink-muted">{k}</dt>
                    <dd className="font-semibold flex-1">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {profile?.philosophy && (
              <div className="card p-5 md:p-6 grad-soft">
                <h3 className="font-extrabold text-[16px] mb-1.5">ปรัชญาการสอน</h3>
                <p className="text-[14px] text-ink-soft leading-relaxed">{profile.philosophy}</p>
              </div>
            )}

            {profile?.bio && (
              <div className="card p-5 md:p-6">
                <h3 className="font-extrabold text-[16px] mb-2">แนะนำตัว</h3>
                <div className="rich"><p>{profile.bio}</p></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {educations.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-12">
          <SectionHead chip="🎓 การศึกษา" title="วุฒิ" accent="การศึกษา" />
          <div className="card overflow-hidden">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="bg-[color:var(--divider)] text-left">
                  <th className="px-4 py-2.5 w-14 font-bold">#</th>
                  <th className="px-4 py-2.5 w-24 font-bold">ปี พ.ศ.</th>
                  <th className="px-4 py-2.5 font-bold">วุฒิการศึกษา</th>
                  <th className="px-4 py-2.5 font-bold">สถาบัน</th>
                </tr>
              </thead>
              <tbody>
                {educations.map((e, n) => (
                  <tr key={e.id} className="border-t border-[color:var(--divider)]">
                    <td className="px-4 py-2.5 text-ink-faint">{n + 1}</td>
                    <td className="px-4 py-2.5 font-semibold">{e.year_th}</td>
                    <td className="px-4 py-2.5">{e.degree}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{e.institute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {careers.length > 0 && (
        <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-12">
          <SectionHead chip="💼 เส้นทางวิชาชีพ" title="เส้นทาง" accent="รับราชการ" />
          <div className="flex flex-col gap-3">
            {careers.map((c) => (
              <div key={c.id} className="card p-4 flex items-center gap-4">
                <span className="chip chip-gold shrink-0">{c.period}</span>
                <div className="min-w-0">
                  <p className="font-bold text-[14px]">{c.position}</p>
                  <p className="text-[13px] text-ink-muted">{c.school}</p>
                </div>
                {c.is_current === 1 && <span className="chip ml-auto shrink-0">ปัจจุบัน</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
