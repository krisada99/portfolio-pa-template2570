import { redirect } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getProfile } from '@/lib/queries'
import { isFresh } from '@/lib/setup'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // ยังไม่ได้ติดตั้ง → พาไปหน้าติดตั้ง แทนที่จะให้ทุกหน้าพังเพราะยังไม่มีตาราง
  if (await isFresh()) redirect('/setup')
  const profile = await getProfile()
  return (
    <>
      <Header profile={profile} />
      <main>{children}</main>
      <Footer profile={profile} />
    </>
  )
}
