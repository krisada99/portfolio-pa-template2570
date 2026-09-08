import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStatus, isFresh, install } from '@/lib/setup'
import { Field, inputClass } from '@/components/admin/Field'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ติดตั้งระบบ' }

function Row({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[color:var(--divider)] last:border-0">
      <span className="w-5 shrink-0 text-center">{ok === null ? '—' : ok ? '✓' : '✕'}</span>
      <span className="flex-1 text-[13.5px]">
        {label}
        {detail && <span className="block text-[12px] text-ink-faint">{detail}</span>}
      </span>
      <span className={`text-[12.5px] font-bold shrink-0 ${
        ok === null ? 'text-ink-faint' : ok ? 'text-[#2E7D4F]' : 'text-[#C0392B]'}`}>
        {ok === null ? 'ทราบไว้' : ok ? 'พร้อม' : 'ยังไม่พร้อม'}
      </span>
    </div>
  )
}

export default async function SetupPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; done?: string }> }) {
  const { error, done } = await searchParams

  // ติดตั้งไปแล้ว = ปิดหน้านี้ถาวร ไม่ให้ใครมาติดตั้งทับ
  if (!(await isFresh())) {
    if (done === '1') {
      return (
        <div className="min-h-[80vh] grid place-items-center px-4 py-16">
          <div className="w-full max-w-[560px] card-soft overflow-hidden">
            <div className="p-7 text-white text-center" style={{ background: 'var(--grad-hero)' }}>
              <div className="text-4xl">🎉</div>
              <h1 className="mt-2 text-[22px] font-extrabold">ติดตั้งเรียบร้อยแล้ว</h1>
            </div>
            <div className="p-6 text-center">
              <p className="text-[14px] text-ink-soft">เข้าสู่ระบบหลังบ้านเพื่อเริ่มกรอกข้อมูลได้เลย</p>
              <div className="mt-5 flex gap-3 justify-center">
                <Link href="/login" className="btn btn-primary">เข้าสู่ระบบ</Link>
                <Link href="/" className="btn btn-ghost">ดูหน้าเว็บ</Link>
              </div>
            </div>
          </div>
        </div>
      )
    }
    redirect('/login')
  }

  const s = await getStatus()
  const ready = s.envDb && s.dbReachable

  async function doInstall(f: FormData) {
    'use server'
    const res = await install({
      username: String(f.get('username') ?? '').trim(),
      password: String(f.get('password') ?? ''),
      fullName: String(f.get('full_name') ?? '').trim(),
      withDemo: !!f.get('demo'),
    })
    if (!res.ok) redirect('/setup?error=' + encodeURIComponent(res.error ?? 'ติดตั้งไม่สำเร็จ'))
    redirect('/setup?done=1')
  }

  return (
    <div className="min-h-[80vh] px-4 py-12">
      <div className="max-w-[640px] mx-auto">
        <div className="card-soft overflow-hidden">
          <div className="p-6 text-white" style={{ background: 'var(--grad-hero)' }}>
            <div className="text-3xl">🚀</div>
            <h1 className="mt-1.5 text-[22px] font-extrabold">ติดตั้งแฟ้มสะสมผลงานครู</h1>
            <p className="text-[12.5px] text-white/75">ทำครั้งเดียวตอนเริ่มใช้งาน แล้วหน้านี้จะปิดตัวเองอัตโนมัติ</p>
          </div>

          <div className="p-6">
            <h2 className="font-extrabold text-[15px] mb-1">ตรวจความพร้อม</h2>
            <div className="mb-5">
              <Row ok={s.envDb} label="ตั้งค่า TURSO_DATABASE_URL แล้ว"
                detail={s.envDb ? undefined : 'ไปตั้งใน Netlify → Site settings → Environment variables'} />
              <Row ok={null} label="กุญแจเซ็นเซสชัน"
                detail={process.env.AUTH_SECRET ? 'ใช้ค่าที่ตั้งไว้ใน AUTH_SECRET' : 'ระบบจะสุ่มให้อัตโนมัติ ไม่ต้องตั้งเอง'} />
              <Row ok={s.dbReachable} label="เชื่อมต่อฐานข้อมูลได้" detail={s.error} />
              <Row ok={null} label="ตารางในฐานข้อมูล"
                detail={s.tables === 0 ? 'ยังไม่มี — ระบบจะสร้างให้ตอนกดติดตั้ง' : `พบ ${s.tables} ตาราง`} />
            </div>

            {error && (
              <p className="rounded-xl px-4 py-2.5 mb-4 text-[13px] font-semibold
                            bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">{error}</p>
            )}

            {!ready ? (
              <p className="rounded-xl px-4 py-3 text-[13.5px] bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">
                ยังตั้งค่าไม่ครบ — แก้ตามรายการด้านบนแล้ว deploy ใหม่อีกครั้ง
              </p>
            ) : (
              <form action={doInstall} className="flex flex-col gap-4">
                <h2 className="font-extrabold text-[15px]">สร้างบัญชีผู้ดูแล</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="ชื่อผู้ใช้" required hint="ใช้เข้าระบบหลังบ้าน">
                    <input name="username" required minLength={3} defaultValue="admin"
                      autoComplete="username" className={inputClass} />
                  </Field>
                  <Field label="รหัสผ่าน" required hint="อย่างน้อย 8 ตัวอักษร">
                    <input name="password" type="password" required minLength={8}
                      autoComplete="new-password" className={inputClass} />
                  </Field>
                </div>
                <Field label="ชื่อ–สกุลของคุณครู" required>
                  <input name="full_name" required className={inputClass} />
                </Field>

                <label className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[color:var(--border)] cursor-pointer">
                  <input type="checkbox" name="demo" value="1" defaultChecked
                    className="w-4 h-4 mt-0.5 accent-[color:var(--primary)]" />
                  <span className="text-[13.5px]">
                    ใส่ข้อมูลตัวอย่างมาให้ดูก่อน
                    <span className="block text-[12px] text-ink-faint">
                      ผลงาน 30 ชิ้น ข้อตกลง PA 3 ปี พร้อมรูปถ่ายจริง — ลบทิ้งทีหลังได้ในหน้าหลังบ้าน
                    </span>
                  </span>
                </label>

                <button type="submit" className="btn btn-primary w-full">ติดตั้งระบบ</button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] text-ink-faint">
          หน้านี้เปิดได้เฉพาะตอนที่ยังไม่มีบัญชีผู้ดูแล ติดตั้งเสร็จแล้วจะเข้าไม่ได้อีก
        </p>
      </div>
    </div>
  )
}
