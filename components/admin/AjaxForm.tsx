'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toastSuccess, toastError } from '@/lib/ui'

/**
 * ฟอร์มที่บันทึกแล้วขึ้น toast โดยไม่โหลดหน้าใหม่ — แทน submitForm() ของเว็บ PHP
 * action คือ server action ที่คืน { ok } กลับมา
 */
export default function AjaxForm({
  action, successMsg, className, children,
}: {
  action: (f: FormData) => Promise<{ ok: boolean; error?: string }>
  successMsg: string
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [err, setErr] = useState('')

  return (
    <form autoComplete="off" className={className} action={async (f) => {
      const r = await action(f)
      if (!r.ok) { setErr(r.error ?? ''); toastError(r.error || 'บันทึกไม่สำเร็จ'); return }
      setErr('')
      toastSuccess(successMsg)
      startTransition(() => router.refresh())
    }}>
      {children}
      {err && <p className="text-[12px] text-coral-deep mt-3">{err}</p>}
    </form>
  )
}

/** ปุ่มบันทึกที่รู้สถานะกำลังส่งของฟอร์มที่ครอบอยู่ */
export function SubmitButton({ children, className = 'btn btn-primary' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return <button type="submit" className={className} disabled={pending}>{pending ? 'กำลังบันทึก…' : children}</button>
}
