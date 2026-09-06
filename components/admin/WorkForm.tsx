import Link from 'next/link'
import { Field, Card, inputClass, areaClass } from '@/components/admin/Field'
import DriveInput from '@/components/admin/DriveInput'
import MediaRows, { type MediaRow } from '@/components/admin/MediaRows'
import FileRows, { type FileRow } from '@/components/admin/FileRows'
import SavedFlag from '@/components/admin/SavedFlag'
import { currentAcademicYear } from '@/lib/theme'
import type { Work, Indicator } from '@/lib/types'

export default function WorkForm({
  work, indicators, images, files, action, saved, error, deleteSlot,
}: {
  work?: Work | null
  indicators: Indicator[]
  images: MediaRow[]
  files: FileRow[]
  action: (f: FormData) => Promise<void>
  saved?: boolean
  error?: string
  deleteSlot?: React.ReactNode
}) {
  const y = currentAcademicYear()
  const years = Array.from({ length: 8 }, (_, i) => y + 1 - i)

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">{work ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}</h1>
          <Link href="/admin/works" className="text-[13px] text-ink-muted hover:text-primary-deep">← กลับรายการผลงาน</Link>
        </div>
        <div className="flex items-center gap-3">
          <SavedFlag show={!!saved} />
          {deleteSlot}
          <button type="submit" className="btn btn-primary">บันทึก</button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">
          {error === 'title' ? 'กรุณากรอกชื่อผลงาน' : 'กรุณาเลือกตัวชี้วัดให้ถูกต้อง'}
        </p>
      )}

      <Card title="ข้อมูลผลงาน">
        <div className="flex flex-col gap-4">
          <Field label="ชื่อผลงาน" required>
            <input name="title" required defaultValue={work?.title ?? ''} className={inputClass} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="ตัวชี้วัด" required>
              <select name="indicator_id" required defaultValue={work?.indicator_id ?? ''} className={inputClass}>
                <option value="">— เลือกตัวชี้วัด —</option>
                {indicators.map((i) => (
                  <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                ))}
              </select>
            </Field>
            <Field label="สถานะ">
              <select name="status" defaultValue={work?.status ?? 'published'} className={inputClass}>
                <option value="published">เผยแพร่</option>
                <option value="draft">ฉบับร่าง (ยังไม่แสดงบนเว็บ)</option>
              </select>
            </Field>
            <Field label="ปีการศึกษา">
              <select name="academic_year" defaultValue={work?.academic_year ?? y} className={inputClass}>
                {years.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="ภาคเรียน">
              <select name="semester" defaultValue={work?.semester ?? 1} className={inputClass}>
                <option value={1}>ภาคเรียนที่ 1</option>
                <option value={2}>ภาคเรียนที่ 2</option>
              </select>
            </Field>
            <Field label="วันที่จัดทำ">
              <input name="work_date" type="date" defaultValue={work?.work_date ?? ''} className={inputClass} />
            </Field>
            <Field label="แท็ก" hint="คั่นด้วยเครื่องหมายจุลภาค เช่น สื่อการสอน, วิทยาการคำนวณ">
              <input name="tags" defaultValue={work?.tags ?? ''} className={inputClass} />
            </Field>
          </div>
          <Field label="สรุปย่อ" hint="แสดงบนการ์ดผลงานและใต้ชื่อเรื่อง">
            <textarea name="summary" rows={2} defaultValue={work?.summary ?? ''} className={areaClass} />
          </Field>
          <Field label="รายละเอียด" hint="ใส่แท็ก HTML อย่างง่ายได้ เช่น <p> <ul> <li> <b>">
            <textarea name="content" rows={10} defaultValue={work?.content ?? ''} className={areaClass} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="ลิงก์วิดีโอ YouTube">
              <input name="video_url" defaultValue={work?.video_url ?? ''} className={inputClass} />
            </Field>
            <Field label="ที่อยู่หน้าเว็บ (slug)" hint="เว้นว่างไว้ ระบบจะสร้างจากชื่อผลงานให้เอง">
              <input name="slug" defaultValue={work?.slug ?? ''} className={inputClass} />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-[13.5px] font-semibold cursor-pointer">
            <input type="checkbox" name="is_featured" value="1" defaultChecked={work?.is_featured === 1}
              className="w-4 h-4 accent-[color:var(--primary)]" />
            ปักหมุดเป็นผลงานเด่น
          </label>
        </div>
      </Card>

      <Card title="รูปภาพ">
        <div className="flex flex-col gap-5">
          <DriveInput name="cover" label="รูปหน้าปก" defaultSource={work?.cover_source} defaultRef={work?.cover_ref}
            hint="ถ้าไม่ใส่ ระบบจะใช้รูปแรกในแกลเลอรีแทน" />
          <MediaRows name="images" label="รูปในแกลเลอรี" initial={images} />
        </div>
      </Card>

      <Card title="ไฟล์แนบ">
        <FileRows name="files" initial={files} />
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/admin/works" className="btn btn-ghost">ยกเลิก</Link>
        <button type="submit" className="btn btn-primary">บันทึกผลงาน</button>
      </div>
    </form>
  )
}
