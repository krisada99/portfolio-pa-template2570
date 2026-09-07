import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin, logAction, hashPassword, verifyPassword } from '@/lib/auth'
import { db, one, now } from '@/lib/db'
import { getSetting } from '@/lib/queries'
import { str, pick } from '@/lib/form'
import { Card, Field, inputClass } from '@/components/admin/Field'
import SavedFlag from '@/components/admin/SavedFlag'
import { VALID_THEMES } from '@/lib/theme'

const THEME_LABEL: Record<string, { name: string; c1: string; c2: string }> = {
  royal: { name: 'น้ำเงิน (Royal Blue)', c1: '#1E3A8A', c2: '#0EA5E9' },
  emerald: { name: 'เขียวมรกต (Emerald)', c1: '#074F38', c2: '#12A06F' },
  maroon: { name: 'แดงเลือดหมู (Maroon)', c1: '#6B1430', c2: '#C0355F' },
}

export default async function SettingsAdmin({
  searchParams,
}: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { saved, error } = await searchParams
  const theme = (await getSetting('theme')) ?? 'royal'

  async function saveTheme(f: FormData) {
    'use server'
    await requireAdmin()
    const v = pick(f, 'theme', VALID_THEMES, 'royal')
    await db.execute({
      sql: `INSERT INTO site_settings (key, value, updated_at) VALUES ('theme', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [v, now()],
    })
    await logAction('เปลี่ยนธีมสี', 'site_settings', 0, v)
    revalidatePath('/', 'layout')
    redirect('/admin/settings?saved=theme')
  }

  async function changePassword(f: FormData) {
    'use server'
    const session = await requireAdmin()
    const current = str(f, 'current', 200)
    const next = str(f, 'next', 200)
    const confirm = str(f, 'confirm', 200)

    if (next.length < 8) redirect('/admin/settings?error=' + encodeURIComponent('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร'))
    if (next !== confirm) redirect('/admin/settings?error=' + encodeURIComponent('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'))

    const user = await one<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ?', [session.uid])
    if (!user || !(await verifyPassword(current, user.password_hash))) {
      redirect('/admin/settings?error=' + encodeURIComponent('รหัสผ่านปัจจุบันไม่ถูกต้อง'))
    }

    await db.execute({
      sql: 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
      args: [await hashPassword(next), now(), session.uid],
    })
    await logAction('เปลี่ยนรหัสผ่าน', 'users', session.uid)
    redirect('/admin/settings?saved=password')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold">ตั้งค่า</h1>
          <p className="text-[13px] text-ink-muted">ธีมสีของเว็บและรหัสผ่านผู้ดูแล</p>
        </div>
        <SavedFlag show={!!saved} />
      </div>

      {error && (
        <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">{error}</p>
      )}

      <form action={saveTheme}>
        <Card title="ธีมสีของเว็บ">
          <div className="grid sm:grid-cols-3 gap-4">
            {VALID_THEMES.map((t) => {
              const info = THEME_LABEL[t]!
              return (
                <label key={t} className="cursor-pointer">
                  <input type="radio" name="theme" value={t} defaultChecked={theme === t} className="peer sr-only" />
                  <span className="block rounded-2xl border-2 border-[color:var(--border)] overflow-hidden
                                   peer-checked:border-[color:var(--primary)] transition">
                    <span className="block h-16" style={{ background: `linear-gradient(135deg,${info.c1},${info.c2})` }} />
                    <span className="block px-3.5 py-2.5 text-[13px] font-bold bg-white">{info.name}</span>
                  </span>
                </label>
              )
            })}
          </div>
          <button type="submit" className="btn btn-primary mt-4">บันทึกธีม</button>
        </Card>
      </form>

      <form action={changePassword}>
        <Card title="เปลี่ยนรหัสผ่าน">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="รหัสผ่านปัจจุบัน" required>
              <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
            </Field>
            <Field label="รหัสผ่านใหม่" required hint="อย่างน้อย 8 ตัวอักษร">
              <input name="next" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </Field>
            <Field label="ยืนยันรหัสผ่านใหม่" required>
              <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </Field>
          </div>
          <button type="submit" className="btn btn-primary mt-4">เปลี่ยนรหัสผ่าน</button>
        </Card>
      </form>

      <Card title="ถ้าลืมรหัสผ่าน">
        <p className="text-[13.5px] text-ink-soft leading-relaxed">
          รันคำสั่งนี้ในเครื่องที่มีโค้ดของเว็บ (ต้องตั้งค่า <code className="px-1.5 py-0.5 rounded bg-[color:var(--divider)] text-[12px]">TURSO_DATABASE_URL</code> ให้ตรงกับฐานข้อมูลจริง)
        </p>
        <pre className="mt-2.5 p-3.5 rounded-xl bg-[color:var(--divider)] text-[12.5px] overflow-x-auto">
node scripts/create-admin.mjs admin รหัสผ่านใหม่ &quot;ชื่อ-สกุล&quot;</pre>
      </Card>
    </div>
  )
}
