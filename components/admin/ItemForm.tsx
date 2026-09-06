import Link from 'next/link'
import { Field, Card, inputClass, areaClass } from '@/components/admin/Field'
import DriveInput from '@/components/admin/DriveInput'
import MediaRows, { type MediaRow } from '@/components/admin/MediaRows'
import FileRows, { type FileRow } from '@/components/admin/FileRows'
import SavedFlag from '@/components/admin/SavedFlag'
import type { MediaSource } from '@/lib/media'

export interface ItemFormProps {
  heading: string
  backHref: string
  backLabel: string
  action: (f: FormData) => Promise<void>
  saved?: boolean
  error?: string
  deleteSlot?: React.ReactNode
  /** ช่องเฉพาะของแต่ละประเภท (รางวัล / การพัฒนาตนเอง) */
  mainFields: React.ReactNode
  coverName: string
  coverLabel: string
  coverSource?: MediaSource | null
  coverRef?: string | null
  summary?: string
  content?: string | null
  note?: string
  videoUrl?: string
  linkUrl?: string
  linkLabel?: string
  images: MediaRow[]
  files: FileRow[]
}

export default function ItemForm(p: ItemFormProps) {
  return (
    <form action={p.action} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">{p.heading}</h1>
          <Link href={p.backHref} className="text-[13px] text-ink-muted hover:text-primary-deep">← {p.backLabel}</Link>
        </div>
        <div className="flex items-center gap-3">
          <SavedFlag show={!!p.saved} />
          {p.deleteSlot}
          <button type="submit" className="btn btn-primary">บันทึก</button>
        </div>
      </div>

      {p.error && (
        <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">
          กรุณากรอกชื่อรายการ
        </p>
      )}

      <Card title="ข้อมูลหลัก">{p.mainFields}</Card>

      <Card title="รายละเอียดเพิ่มเติม">
        <div className="flex flex-col gap-4">
          <Field label="สรุปย่อ"><textarea name="summary" rows={2} defaultValue={p.summary ?? ''} className={areaClass} /></Field>
          <Field label="รายละเอียด" hint="ใส่แท็ก HTML อย่างง่ายได้ เช่น <p> <ul> <li> <b>">
            <textarea name="content" rows={8} defaultValue={p.content ?? ''} className={areaClass} />
          </Field>
          <Field label="หมายเหตุ"><input name="note" defaultValue={p.note ?? ''} className={inputClass} /></Field>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="ลิงก์วิดีโอ YouTube"><input name="video_url" defaultValue={p.videoUrl ?? ''} className={inputClass} /></Field>
            <Field label="ลิงก์ที่เกี่ยวข้อง"><input name="link_url" defaultValue={p.linkUrl ?? ''} className={inputClass} /></Field>
            <Field label="ข้อความบนปุ่มลิงก์"><input name="link_label" defaultValue={p.linkLabel ?? ''} className={inputClass} /></Field>
          </div>
        </div>
      </Card>

      <Card title="รูปภาพ">
        <div className="flex flex-col gap-5">
          <DriveInput name={p.coverName} label={p.coverLabel} defaultSource={p.coverSource} defaultRef={p.coverRef} />
          <MediaRows name="images" label="รูปเพิ่มเติมในแกลเลอรี" initial={p.images} />
        </div>
      </Card>

      <Card title="ไฟล์แนบ"><FileRows name="files" initial={p.files} /></Card>

      <div className="flex justify-end gap-3">
        <Link href={p.backHref} className="btn btn-ghost">ยกเลิก</Link>
        <button type="submit" className="btn btn-primary">บันทึก</button>
      </div>
    </form>
  )
}
