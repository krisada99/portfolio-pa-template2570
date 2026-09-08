import { getProfile } from '@/lib/queries'

export const metadata = { title: 'ติดต่อ' }

export default async function ContactPage() {
  const profile = await getProfile()
  const items = [
    { icon: '📧', label: 'อีเมล', value: profile?.email, href: profile?.email ? `mailto:${profile.email}` : null },
    { icon: '📞', label: 'โทรศัพท์', value: profile?.phone, href: profile?.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}` : null },
    { icon: '💬', label: 'Line ID', value: profile?.line_id, href: null },
    { icon: '🏫', label: 'โรงเรียน', value: profile?.school, href: null },
  ].filter((i) => i.value)

  return (
    <>
      <section className="relative overflow-hidden text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="absolute inset-0 dots opacity-25" />
        <div className="relative max-w-[1240px] mx-auto px-4 md:px-10 py-10 md:py-12">
          <span className="chip chip-glass">✉️ ติดต่อ</span>
          <h1 className="mt-3 text-[26px] md:text-[36px] font-extrabold">ช่องทางการติดต่อ</h1>
        </div>
      </section>

      <div className="max-w-[820px] mx-auto px-4 md:px-10 -mt-8 relative">
        {items.length === 0 ? (
          <div className="card-soft p-8 text-center text-ink-muted">ยังไม่ได้กรอกข้อมูลติดต่อ</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((i) => {
              const inner = (
                <div className="card-pop p-5 flex items-center gap-4 h-full">
                  <span className="w-12 h-12 rounded-2xl grid place-items-center text-xl shrink-0"
                        style={{ background: 'var(--primary-soft)' }}>{i.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink-muted font-semibold">{i.label}</p>
                    <p className="font-bold text-[14.5px] break-words">{i.value}</p>
                  </div>
                </div>
              )
              return i.href
                ? <a key={i.label} href={i.href}>{inner}</a>
                : <div key={i.label}>{inner}</div>
            })}
          </div>
        )}
      </div>
    </>
  )
}
