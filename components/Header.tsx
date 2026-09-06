'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { Profile } from '@/lib/types'
import { imageUrl, focalPosition, IMG } from '@/lib/media'

const NAV = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/pa', label: 'ข้อตกลง PA' },
  { href: '/development', label: 'การพัฒนาตนเอง' },
  { href: '/about', label: 'ประวัติครู' },
  { href: '/contact', label: 'ติดต่อ' },
]

export default function Header({ profile }: { profile: Profile | null }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))

  return (
    <header className="sticky top-0 z-50 rainbow-edge bg-white/90 backdrop-blur-md border-b border-[color:var(--divider)] no-print">
      <div className="max-w-[1240px] mx-auto px-4 md:px-10 h-[68px] flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span
            className="w-10 h-10 rounded-xl overflow-hidden shrink-0 grid place-items-center text-lg"
            style={{ background: 'var(--grad)' }}
          >
            {profile?.avatar_ref ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl({ source: profile.avatar_source, ref: profile.avatar_ref }, IMG.thumb)}
                alt=""
                className="w-full h-full object-cover"
                style={{ objectPosition: focalPosition(profile.avatar_focus_x, profile.avatar_focus_y) }}
              />
            ) : (
              <span>🎓</span>
            )}
          </span>
          <span className="leading-tight">
            <span className="block font-extrabold text-[14.5px]">
              แฟ้มผลงาน{profile?.nickname || 'ครู'}
            </span>
            <span className="block text-[11px] text-ink-muted">e-Portfolio · วPA ว9/2564</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3.5 py-2 rounded-full text-[13.5px] font-bold transition ${
                active(n.href)
                  ? 'text-white'
                  : 'text-ink-soft hover:bg-[color:var(--primary-soft)] hover:text-primary-deep'
              }`}
              style={active(n.href) ? { background: 'var(--grad)' } : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="เมนู"
          aria-expanded={open}
          className="md:hidden ml-auto w-10 h-10 rounded-xl border border-[color:var(--border)] grid place-items-center"
        >
          <span className="text-lg">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-[color:var(--divider)] bg-white px-4 py-3 flex flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`px-4 py-2.5 rounded-xl text-[14px] font-bold ${
                active(n.href) ? 'bg-[color:var(--primary-soft)] text-primary-deep' : 'text-ink-soft'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
