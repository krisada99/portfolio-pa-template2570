import Link from 'next/link'
import { getStats, getWorks, getAgreements, getSelfDevs, getAwards, getProfile } from '@/lib/queries'

export default async function AdminDashboard() {
  const [stats, latest, agreements, devs, awards, profile] = await Promise.all([
    getStats(), getWorks({ limit: 5 }), getAgreements(), getSelfDevs(), getAwards(), getProfile(),
  ])

  const cards = [
    { href: '/admin/works', icon: '📁', n: stats.works, label: 'ผลงาน' },
    { href: '/admin/pa', icon: '📋', n: agreements.length, label: 'ข้อตกลง PA' },
    { href: '/admin/self-dev', icon: '🌱', n: devs.length, label: 'การพัฒนาตนเอง' },
    { href: '/admin/awards', icon: '🏆', n: awards.length, label: 'รางวัล' },
  ]
  const incomplete = !profile?.school || !profile.full_name || profile.full_name === 'ชื่อ–สกุลของคุณครู'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[22px] font-extrabold">ภาพรวม</h1>
        <p className="text-[13px] text-ink-muted">สรุปข้อมูลทั้งหมดในแฟ้มผลงาน</p>
      </div>

      {incomplete && (
        <div className="card p-4 flex items-center gap-3" style={{ background: 'var(--gold-soft)', borderColor: 'var(--gold-line)' }}>
          <span className="text-xl">👋</span>
          <p className="text-[13.5px] flex-1">ยังไม่ได้กรอกข้อมูลครูให้ครบ — เริ่มจากหน้าโปรไฟล์ก่อนนะครับ</p>
          <Link href="/admin/profile" className="btn btn-gold !min-h-[36px] !text-[12.5px]">กรอกเลย</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card card-hover p-5">
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-1 text-[28px] font-extrabold grad-text leading-none">{c.n}</div>
            <div className="mt-1 text-[12.5px] text-ink-muted font-semibold">{c.label}</div>
          </Link>
        ))}
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-[16px]">ผลงานล่าสุด</h2>
          <Link href="/admin/works" className="text-[12.5px] font-bold text-primary-deep hover:underline">ดูทั้งหมด →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="text-[13.5px] text-ink-muted py-6 text-center">ยังไม่มีผลงาน — <Link href="/admin/works/new" className="text-primary-deep font-bold hover:underline">เพิ่มผลงานแรก</Link></p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-ink-muted border-b border-[color:var(--divider)]">
                <th className="py-2 w-10 font-bold">#</th>
                <th className="py-2 font-bold">ชื่อผลงาน</th>
                <th className="py-2 w-24 font-bold">ตัวชี้วัด</th>
                <th className="py-2 w-24 font-bold">ปีการศึกษา</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((w, i) => (
                <tr key={w.id} className="border-b border-[color:var(--divider)] last:border-0">
                  <td className="py-2.5 text-ink-faint">{i + 1}</td>
                  <td className="py-2.5">
                    <Link href={`/admin/works/${w.id}`} className="font-semibold hover:text-primary-deep hover:underline">{w.title}</Link>
                  </td>
                  <td className="py-2.5">{w.indicator_code}</td>
                  <td className="py-2.5">{w.academic_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
