import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin, logout } from '@/lib/auth'
import { getProfile } from '@/lib/queries'
import AdminNav from '@/components/admin/AdminNav'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ระบบหลังบ้าน' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const profile = await getProfile()

  async function doLogout() {
    'use server'
    await logout()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 rainbow-edge text-white" style={{ background: 'var(--grad-hero)' }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[64px] flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 grid place-items-center text-lg">🛠️</span>
            <span className="leading-tight">
              <span className="block font-extrabold text-[14px]">ระบบหลังบ้าน</span>
              <span className="block text-[11px] text-white/70">แฟ้มผลงาน{profile?.nickname || 'ครู'}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank"
              className="hidden sm:inline-flex chip chip-glass !text-[12px]">↗ ดูหน้าเว็บ</Link>
            <span className="hidden md:block text-[12.5px] text-white/80">{session.name}</span>
            <form action={doLogout}>
              <button type="submit" className="chip chip-glass !text-[12px] cursor-pointer">ออกจากระบบ</button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 py-6 flex gap-6 items-start">
        <AdminNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="footer-bar rainbow-top mt-4">
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 py-4 text-center text-[12px] text-white/75">
          ระบบหลังบ้าน · แฟ้มสะสมผลงานครู ตามเกณฑ์ วPA ว9/2564
        </div>
      </footer>
    </div>
  )
}
