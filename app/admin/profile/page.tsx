import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now } from '@/lib/db'
import { getProfile } from '@/lib/queries'
import { str, int, num, media } from '@/lib/form'
import { Field, Card, inputClass, areaClass } from '@/components/admin/Field'
import DriveInput from '@/components/admin/DriveInput'
import FocalPicker from '@/components/admin/FocalPicker'
import SavedFlag from '@/components/admin/SavedFlag'

export default async function ProfileAdmin({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams
  const p = await getProfile()

  async function save(f: FormData) {
    'use server'
    await requireAdmin()                     // ด่านตรวจ — ห้ามตัดออกเด็ดขาด
    const avatar = media(f, 'avatar')
    await db.execute({
      sql: `UPDATE teacher_profile SET
              full_name=?, nickname=?, position=?, academic_standing=?, subject_group=?,
              school=?, affiliation=?, area_office=?, email=?, phone=?, facebook=?, line_id=?,
              avatar_source=?, avatar_ref=?, avatar_focus_x=?, avatar_focus_y=?,
              motto=?, philosophy=?, bio=?, experience_years=?, teaching_hours=?, updated_at=?
            WHERE id = 1`,
      args: [
        str(f, 'full_name', 200), str(f, 'nickname', 60), str(f, 'position', 100),
        str(f, 'academic_standing', 100), str(f, 'subject_group', 200),
        str(f, 'school', 200), str(f, 'affiliation', 200), str(f, 'area_office', 200),
        str(f, 'email', 120), str(f, 'phone', 40), str(f, 'facebook', 200), str(f, 'line_id', 60),
        avatar.source, avatar.ref,
        Math.min(100, Math.max(0, int(f, 'avatar_focus_x', 50))),
        Math.min(100, Math.max(0, int(f, 'avatar_focus_y', 35))),
        str(f, 'motto', 255), str(f, 'philosophy', 500), str(f, 'bio', 4000),
        int(f, 'experience_years'), num(f, 'teaching_hours'), now(),
      ],
    })
    await logAction('อัปเดตโปรไฟล์', 'teacher_profile', 1)
    revalidatePath('/', 'layout')
  }

  return (
    <form action={save} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold">โปรไฟล์ครู</h1>
          <p className="text-[13px] text-ink-muted">ข้อมูลนี้แสดงบนหน้าแรกและหน้าประวัติ</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedFlag show={saved === '1'} />
          <button type="submit" className="btn btn-primary">บันทึก</button>
        </div>
      </div>

      <Card title="ข้อมูลหลัก">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="ชื่อ–สกุล" required>
            <input name="full_name" required defaultValue={p?.full_name ?? ''} className={inputClass} />
          </Field>
          <Field label="ชื่อเล่น (ใช้ในหัวเว็บ)">
            <input name="nickname" defaultValue={p?.nickname ?? ''} className={inputClass} />
          </Field>
          <Field label="ตำแหน่ง">
            <input name="position" defaultValue={p?.position ?? ''} className={inputClass} />
          </Field>
          <Field label="วิทยฐานะ">
            <input name="academic_standing" defaultValue={p?.academic_standing ?? ''} className={inputClass} />
          </Field>
          <Field label="กลุ่มสาระการเรียนรู้" hint="ไม่ต้องพิมพ์คำว่า “กลุ่มสาระ” ระบบเติมให้เอง">
            <input name="subject_group" defaultValue={p?.subject_group ?? ''} className={inputClass} />
          </Field>
          <Field label="โรงเรียน">
            <input name="school" defaultValue={p?.school ?? ''} className={inputClass} />
          </Field>
          <Field label="สังกัด">
            <input name="affiliation" defaultValue={p?.affiliation ?? ''} className={inputClass} />
          </Field>
          <Field label="เขตพื้นที่การศึกษา">
            <input name="area_office" defaultValue={p?.area_office ?? ''} className={inputClass} />
          </Field>
          <Field label="ประสบการณ์ (ปี)">
            <input name="experience_years" type="number" min={0} max={60}
              defaultValue={p?.experience_years ?? 0} className={inputClass} />
          </Field>
          <Field label="ชั่วโมงสอน/สัปดาห์">
            <input name="teaching_hours" type="number" step="0.5" min={0}
              defaultValue={p?.teaching_hours ?? 0} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="รูปโปรไฟล์">
        <div className="grid md:grid-cols-2 gap-5">
          <DriveInput name="avatar" label="รูปครู" defaultSource={p?.avatar_source} defaultRef={p?.avatar_ref} />
          <FocalPicker
            source={p?.avatar_source ?? null} refValue={p?.avatar_ref ?? null}
            x={p?.avatar_focus_x ?? 50} y={p?.avatar_focus_y ?? 35}
          />
        </div>
      </Card>

      <Card title="ช่องทางติดต่อ">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="อีเมล"><input name="email" type="email" defaultValue={p?.email ?? ''} className={inputClass} /></Field>
          <Field label="โทรศัพท์"><input name="phone" defaultValue={p?.phone ?? ''} className={inputClass} /></Field>
          <Field label="Facebook" hint="ใส่ชื่อเพจหรือลิงก์เต็มก็ได้">
            <input name="facebook" defaultValue={p?.facebook ?? ''} className={inputClass} />
          </Field>
          <Field label="Line ID"><input name="line_id" defaultValue={p?.line_id ?? ''} className={inputClass} /></Field>
        </div>
      </Card>

      <Card title="ข้อความแนะนำตัว">
        <div className="flex flex-col gap-4">
          <Field label="คติประจำใจ"><input name="motto" defaultValue={p?.motto ?? ''} className={inputClass} /></Field>
          <Field label="ปรัชญาการสอน">
            <textarea name="philosophy" rows={2} defaultValue={p?.philosophy ?? ''} className={areaClass} />
          </Field>
          <Field label="แนะนำตัว">
            <textarea name="bio" rows={5} defaultValue={p?.bio ?? ''} className={areaClass} />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
      </div>
    </form>
  )
}
