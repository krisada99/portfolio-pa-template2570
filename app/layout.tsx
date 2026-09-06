import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import { getProfile, getSetting } from '@/lib/queries'
import { isSiteTheme } from '@/lib/theme'

/**
 * ทุกหน้าต้องดึงข้อมูลสดจากฐานข้อมูลเสมอ
 * ถ้าปล่อยให้ Next prerender เป็น static ข้อมูลจะค้างตั้งแต่ตอน build
 * → ครูแก้ข้อมูลในหลังบ้านแล้วหน้าเว็บไม่เปลี่ยนจนกว่าจะ deploy ใหม่
 */
export const dynamic = 'force-dynamic'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sarabun',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile()
  const name = profile?.full_name ?? 'แฟ้มสะสมผลงานครู'
  return {
    title: { default: `แฟ้มสะสมผลงาน ${name}`, template: `%s · ${profile?.nickname || 'ครู'}` },
    description: `แฟ้มสะสมผลงานครู ตามเกณฑ์ วPA (ว9/2564) — ${name} ${profile?.school ?? ''}`.trim(),
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getSetting('theme')
  return (
    <html lang="th" data-theme={isSiteTheme(theme) ? theme : 'royal'} className={sarabun.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
