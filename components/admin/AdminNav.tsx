'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'ภาพรวม', icon: '📊' },
  { href: '/admin/profile', label: 'โปรไฟล์ครู', icon: '👤' },
  { href: '/admin/works', label: 'ผลงาน', icon: '📁' },
  { href: '/admin/pa', label: 'ข้อตกลง PA', icon: '📋' },
  { href: '/admin/self-dev', label: 'การพัฒนาตนเอง', icon: '🌱' },
  { href: '/admin/awards', label: 'รางวัล', icon: '🏆' },
  { href: '/admin/settings', label: 'ตั้งค่า', icon: '⚙️' },
]

export default function AdminNav() {
  const path = usePathname()
  const on = (h: string) => (h === '/admin' ? path === '/admin' : path.startsWith(h))
  return (
    <nav className="w-[210px] shrink-0 hidden lg:flex flex-col gap-1 sticky top-[84px]">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-bold transition ${
            on(n.href) ? 'text-white' : 'text-ink-soft hover:bg-white'
          }`}
          style={on(n.href) ? { background: 'var(--grad)' } : undefined}>
          <span>{n.icon}</span>{n.label}
        </Link>
      ))}
    </nav>
  )
}
