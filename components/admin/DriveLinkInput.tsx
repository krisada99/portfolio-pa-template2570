'use client'

import { useState } from 'react'
import { extractDriveId, type MediaSource } from '@/lib/media'

/**
 * ช่องแนบไฟล์ (ไม่ใช่รูป) จาก Google Drive — ครูวางลิงก์แชร์ ระบบดึง FILE ID ให้เอง
 * ส่งออก 2 ช่องเหมือน DriveInput: <name>_source และ <name>_ref
 */
export default function DriveLinkInput({
  name, id, defaultSource, defaultRef, placeholder = 'วางลิงก์แชร์จาก Google Drive ที่นี่',
}: {
  name: string; id?: string
  defaultSource?: MediaSource | null; defaultRef?: string | null
  placeholder?: string
}) {
  const wasStatic = defaultSource === 'static' && !!defaultRef
  const [raw, setRaw] = useState(wasStatic ? '' : (defaultRef ?? ''))

  const fileId = extractDriveId(raw)
  const invalid = raw.trim() !== '' && !fileId

  return (
    <>
      <input type="hidden" name={`${name}_source`} value={fileId ? 'drive' : ''} />
      <input type="hidden" name={`${name}_ref`} value={fileId ?? ''} />
      <input className={`inp${invalid ? ' is-invalid' : ''}`} id={id} value={raw} placeholder={placeholder}
        onChange={(e) => setRaw(e.target.value)} />
      <span className="field-error">{invalid ? 'ไม่พบรหัสไฟล์ในลิงก์นี้ — ก๊อบลิงก์จากปุ่ม “แชร์” ใน Google Drive มาวางอีกครั้ง' : ''}</span>
      {fileId && (
        <p className="text-[11.5px] text-primary-deep mt-1.5">
          อ่านรหัสไฟล์ได้แล้ว · <span className="font-mono break-all">{fileId}</span>
        </p>
      )}
    </>
  )
}
