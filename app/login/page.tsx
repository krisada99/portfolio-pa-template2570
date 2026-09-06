import { redirect } from 'next/navigation'
import Link from 'next/link'
import { attemptLogin, getSession } from '@/lib/auth'
import { isFresh } from '@/lib/setup'

export const metadata = { title: 'เข้าสู่ระบบ' }
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  if (await isFresh()) redirect('/setup')      // ยังไม่มีบัญชี = ยังไม่ได้ติดตั้ง
  if (await getSession()) redirect(next && next.startsWith('/admin') ? next : '/admin')

  async function doLogin(formData: FormData) {
    'use server'
    const username = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const target = String(formData.get('next') ?? '')
    if (!username || !password) redirect('/login?error=' + encodeURIComponent('กรอกให้ครบทั้งสองช่อง'))

    const res = await attemptLogin(username, password)
    if (!res.ok) redirect('/login?error=' + encodeURIComponent(res.error ?? 'เข้าสู่ระบบไม่สำเร็จ'))
    redirect(target.startsWith('/admin') ? target : '/admin')
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-16">
      <div className="w-full max-w-[420px]">
        <div className="card overflow-hidden">
          <div className="p-6 text-white text-center" style={{ background: 'var(--grad-hero)' }}>
            <div className="text-3xl">🔐</div>
            <h1 className="mt-2 text-[20px] font-extrabold">เข้าสู่ระบบหลังบ้าน</h1>
            <p className="text-[12.5px] text-white/75">สำหรับเจ้าของแฟ้มผลงานเท่านั้น</p>
          </div>

          <form action={doLogin} className="p-6 flex flex-col gap-3.5">
            {error && (
              <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold
                            bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">{error}</p>
            )}
            <input type="hidden" name="next" value={next ?? ''} />
            <label className="block">
              <span className="block text-[12.5px] font-bold text-ink-muted mb-1">ชื่อผู้ใช้</span>
              <input name="username" required autoComplete="username" autoFocus
                className="w-full h-11 px-4 rounded-xl border border-[color:var(--border)]
                           focus:border-[color:var(--primary)] focus:outline-none text-[14px]" />
            </label>
            <label className="block">
              <span className="block text-[12.5px] font-bold text-ink-muted mb-1">รหัสผ่าน</span>
              <input name="password" type="password" required autoComplete="current-password"
                className="w-full h-11 px-4 rounded-xl border border-[color:var(--border)]
                           focus:border-[color:var(--primary)] focus:outline-none text-[14px]" />
            </label>
            <button type="submit" className="btn btn-primary w-full mt-1">เข้าสู่ระบบ</button>
            <Link href="/" className="text-center text-[13px] text-ink-muted hover:text-primary-deep mt-1">
              ← กลับหน้าเว็บ
            </Link>
          </form>
        </div>
        <p className="mt-4 text-center text-[11.5px] text-ink-faint">
          ป้อนรหัสผิดเกิน 5 ครั้ง ระบบจะล็อกชั่วคราว 15 นาที
        </p>
      </div>
    </div>
  )
}
