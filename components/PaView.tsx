import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAgreements, getAgreement, getPaDetails, getPaChallenge, getDomains } from '@/lib/queries'
import { domainTheme, thaiDate } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import SectionHead from '@/components/SectionHead'
import YearTabs from '@/components/YearTabs'

/**
 * เนื้อหาหน้าข้อตกลง PA — แยกเป็นคอมโพเนนต์เพื่อให้ใช้ได้ทั้ง /pa และ /pa/[year]
 * เดิมอ่านปีจาก ?year= ซึ่งทำให้ Next ปิดแคชทั้งหน้า ต้องสร้างใหม่ทุกครั้งที่มีคนกด
 * เปลี่ยนมารับปีเป็นส่วนหนึ่งของที่อยู่แทน หน้าจึงถูกสร้างล่วงหน้าและเสิร์ฟจาก CDN ได้
 */
export default async function PaView({ year }: { year?: number }) {
  const agreements = await getAgreements()
  if (agreements.length === 0) {
    return (
      <div className="max-w-[820px] mx-auto px-4 py-20 text-center">
        <div className="card p-10">
          <p className="text-[15px] text-ink-muted">ยังไม่มีข้อตกลงในการพัฒนางานในระบบ</p>
        </div>
      </div>
    )
  }

  const years = agreements.map((a) => a.fiscal_year)
  const wanted = year || years[0]!
  const cur = (await getAgreement(wanted)) ?? agreements[0]!
  if (!cur) notFound()

  const [details, challenge, domains] = await Promise.all([
    getPaDetails(cur.id), getPaChallenge(cur.id), getDomains(),
  ])
  const pdf = fileUrl({ source: cur.pdf_source, ref: cur.pdf_ref })

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <span className="chip chip-glass">📋 ว9/2564</span>
          <h1 className="mt-3 text-[26px] md:text-[36px] font-extrabold">
            ข้อตกลงในการพัฒนางาน <span className="text-[color:var(--gold)]">ปีงบประมาณ {cur.fiscal_year}</span>
          </h1>
          <p className="mt-1.5 text-[14px] text-white/80">
            {thaiDate(cur.period_start)} – {thaiDate(cur.period_end)} · รอบที่ {cur.round}
          </p>
        </div>
      </section>

      <div className="max-w-[1240px] mx-auto px-4 md:px-10 -mt-8 relative pb-6">
        <div className="card p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="chip">📄 ตอนที่ 1</span>
              <h2 className="mt-2 text-[19px] font-extrabold">ข้อมูลผู้จัดทำข้อตกลง</h2>
            </div>
            <YearTabs years={years} current={cur.fiscal_year} hrefFor={(y) => `/pa/${y}`} />
          </div>

          <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 text-[13.5px]">
            {[
              ['ตำแหน่ง', cur.position],
              ['วิทยฐานะ', cur.academic_standing],
              ['สถานศึกษา', cur.school],
              ['สังกัด', cur.affiliation],
              ['กลุ่มสาระการเรียนรู้', cur.subject_group],
              ['ชั่วโมงสอน', cur.teaching_hours ? `${cur.teaching_hours} ชม./สัปดาห์` : ''],
              ['ชั่วโมงสนับสนุน', cur.support_hours ? `${cur.support_hours} ชม./สัปดาห์` : ''],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={String(k)} className="flex gap-3 py-2 border-b border-[color:var(--divider)]">
                <dt className="w-[140px] shrink-0 text-ink-muted">{k}</dt>
                <dd className="font-semibold flex-1">{v}</dd>
              </div>
            ))}
          </dl>

          {pdf && (
            <a href={pdf} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4">
              📎 {cur.pdf_name || 'เปิดไฟล์ข้อตกลง'}
            </a>
          )}
        </div>
      </div>

      {/* ---------------- ตอนที่ 2 : งานที่จะปฏิบัติ ---------------- */}
      <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-8">
        <SectionHead chip="📝 ตอนที่ 2" title="งานที่จะปฏิบัติ ตาม" accent="15 ตัวชี้วัด" />
        {domains.map((d) => {
          const t = domainTheme(d.code)
          const rows = details.filter((x) => Number(x.domain_code) === d.code)
          if (rows.length === 0) return null
          return (
            <div key={d.id} className="mb-7">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-9 h-9 rounded-xl grid place-items-center text-lg text-white shrink-0"
                      style={{ background: t.grad }}>{t.icon}</span>
                <h3 className="font-extrabold text-[15.5px]">ด้านที่ {d.code} · {d.name}</h3>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] min-w-[720px]">
                    <thead>
                      <tr className="bg-[color:var(--divider)] text-left">
                        <th className="px-3 py-2.5 w-12 font-bold">#</th>
                        <th className="px-3 py-2.5 w-24 font-bold">ตัวชี้วัด</th>
                        <th className="px-3 py-2.5 font-bold">งานที่จะปฏิบัติ</th>
                        <th className="px-3 py-2.5 w-[22%] font-bold">เชิงปริมาณ</th>
                        <th className="px-3 py-2.5 w-[22%] font-bold">เชิงคุณภาพ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, n) => (
                        <tr key={r.id} className="border-t border-[color:var(--divider)] align-top">
                          <td className="px-3 py-3 text-ink-faint">{n + 1}</td>
                          <td className="px-3 py-3">
                            <Link href={`/indicator/${r.indicator_id}`}
                              className={`chip ${t.chip} !text-[11px] hover:opacity-80`}>{r.indicator_code}</Link>
                          </td>
                          <td className="px-3 py-3 font-semibold">{r.task_description}</td>
                          <td className="px-3 py-3 text-ink-muted">{r.expected_quantity || '—'}</td>
                          <td className="px-3 py-3 text-ink-muted">{r.expected_quality || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ---------------- ประเด็นท้าทาย ---------------- */}
      {challenge && (
        <section className="max-w-[1240px] mx-auto px-4 md:px-10 pt-6">
          <SectionHead chip="🎯 ตอนที่ 2 (ส่วนที่ 2)" title="ประเด็น" accent="ท้าทาย" />
          <div className="card p-5 md:p-6">
            <h3 className="font-extrabold text-[17px]">{challenge.topic}</h3>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              {[
                ['สภาพปัญหา', challenge.problem_statement, '🔍'],
                ['วิธีการดำเนินการ', challenge.method, '⚙️'],
                ['ผลลัพธ์ที่คาดหวัง', challenge.expected_outcome, '🌟'],
              ].map(([k, v, icon]) => (
                <div key={String(k)} className="rounded-2xl p-4" style={{ background: 'var(--primary-soft)' }}>
                  <p className="text-[12px] font-extrabold text-primary-deep">{icon} {k}</p>
                  <p className="mt-1.5 text-[13px] text-ink-soft leading-relaxed">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
