import Link from 'next/link'
import { Field, Card, inputClass, areaClass } from '@/components/admin/Field'
import DriveInput from '@/components/admin/DriveInput'
import SavedFlag from '@/components/admin/SavedFlag'
import { domainTheme, currentAcademicYear } from '@/lib/theme'
import type { Agreement, PaDetail, PaChallenge, Indicator, Domain } from '@/lib/types'

const ERRORS: Record<string, string> = {
  year: 'กรุณากรอกปีงบประมาณเป็น พ.ศ. ให้ถูกต้อง',
  dup: 'มีข้อตกลงของปีงบประมาณนี้อยู่แล้ว — แก้ไขรายการเดิมแทน',
}

export default function PaForm({
  agreement, details, challenge, domains, indicators, action, saved, error, deleteSlot,
}: {
  agreement?: Agreement | null
  details: PaDetail[]
  challenge?: PaChallenge | null
  domains: Domain[]
  indicators: Indicator[]
  action: (f: FormData) => Promise<void>
  saved?: boolean
  error?: string
  deleteSlot?: React.ReactNode
}) {
  const byInd = new Map(details.map((d) => [d.indicator_id, d]))
  const fy = currentAcademicYear() + 1
  const years = Array.from({ length: 8 }, (_, i) => fy + 1 - i)

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-extrabold">
            {agreement ? `แก้ไขข้อตกลง PA ปี ${agreement.fiscal_year}` : 'เพิ่มข้อตกลง PA'}
          </h1>
          <Link href="/admin/pa" className="text-[13px] text-ink-muted hover:text-primary-deep">← กลับรายการ</Link>
        </div>
        <div className="flex items-center gap-3">
          <SavedFlag show={!!saved} />
          {deleteSlot}
          <button type="submit" className="btn btn-primary">บันทึก</button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl px-4 py-2.5 text-[13px] font-semibold bg-[#FDECEC] text-[#B3261E] border border-[#F5C2C0]">
          {ERRORS[error] ?? 'บันทึกไม่สำเร็จ'}
        </p>
      )}

      <Card title="ตอนที่ 1 · ข้อมูลผู้จัดทำข้อตกลง">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="ปีงบประมาณ (พ.ศ.)" required>
            <select name="fiscal_year" defaultValue={agreement?.fiscal_year ?? fy} className={inputClass}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="รอบที่">
            <input name="round" type="number" min={1} max={4} defaultValue={agreement?.round ?? 1} className={inputClass} />
          </Field>
          <Field label="สถานะ">
            <select name="status" defaultValue={agreement?.status ?? 'draft'} className={inputClass}>
              <option value="draft">ร่าง</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="evaluated">ประเมินแล้ว</option>
            </select>
          </Field>
          <Field label="เริ่มต้นข้อตกลง">
            <input name="period_start" type="date" defaultValue={agreement?.period_start ?? ''} className={inputClass} />
          </Field>
          <Field label="สิ้นสุดข้อตกลง">
            <input name="period_end" type="date" defaultValue={agreement?.period_end ?? ''} className={inputClass} />
          </Field>
          <Field label="ตำแหน่ง">
            <input name="position" defaultValue={agreement?.position ?? ''} className={inputClass} />
          </Field>
          <Field label="วิทยฐานะ">
            <input name="academic_standing" defaultValue={agreement?.academic_standing ?? ''} className={inputClass} />
          </Field>
          <Field label="สถานศึกษา">
            <input name="school" defaultValue={agreement?.school ?? ''} className={inputClass} />
          </Field>
          <Field label="สังกัด">
            <input name="affiliation" defaultValue={agreement?.affiliation ?? ''} className={inputClass} />
          </Field>
          <Field label="กลุ่มสาระการเรียนรู้">
            <input name="subject_group" defaultValue={agreement?.subject_group ?? ''} className={inputClass} />
          </Field>
          <Field label="ชั่วโมงสอน/สัปดาห์">
            <input name="teaching_hours" type="number" step="0.5" min={0} defaultValue={agreement?.teaching_hours ?? 0} className={inputClass} />
          </Field>
          <Field label="ชั่วโมงสนับสนุน/สัปดาห์">
            <input name="support_hours" type="number" step="0.5" min={0} defaultValue={agreement?.support_hours ?? 0} className={inputClass} />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <DriveInput name="pdf" label="ไฟล์ข้อตกลง (PDF จาก Drive)"
            defaultSource={agreement?.pdf_source} defaultRef={agreement?.pdf_ref}
            hint="วางลิงก์ไฟล์ PDF จาก Google Drive" />
          <Field label="ชื่อไฟล์ที่จะแสดง">
            <input name="pdf_name" defaultValue={agreement?.pdf_name ?? ''} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="ตอนที่ 2 · งานที่จะปฏิบัติตาม 15 ตัวชี้วัด">
        <p className="text-[12.5px] text-ink-muted mb-4">
          กรอกเฉพาะตัวชี้วัดที่มีงาน — ตัวชี้วัดที่เว้นว่างจะไม่ถูกบันทึก
        </p>
        {domains.map((d) => {
          const t = domainTheme(d.code)
          const list = indicators.filter((i) => i.domain_id === d.id)
          return (
            <div key={d.id} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-8 h-8 rounded-lg grid place-items-center text-white text-[15px] shrink-0"
                      style={{ background: t.grad }}>{t.icon}</span>
                <h3 className="font-extrabold text-[14.5px]">ด้านที่ {d.code} · {d.name}</h3>
              </div>
              <div className="flex flex-col gap-3">
                {list.map((i) => {
                  const cur = byInd.get(i.id)
                  return (
                    <div key={i.id} className="rounded-xl border border-[color:var(--border)] p-3.5">
                      <p className="text-[12.5px] font-bold mb-2">
                        <span className={`chip ${t.chip} !text-[10.5px] !px-2 !py-0.5 mr-2`}>{i.code}</span>
                        {i.name}
                      </p>
                      <textarea name={`task_${i.id}`} rows={2} placeholder="งานที่จะปฏิบัติ"
                        defaultValue={cur?.task_description ?? ''} className={areaClass} />
                      <div className="grid md:grid-cols-2 gap-3 mt-2">
                        <input name={`qty_${i.id}`} placeholder="ผลลัพธ์ที่คาดหวัง — เชิงปริมาณ"
                          defaultValue={cur?.expected_quantity ?? ''} className={inputClass} />
                        <input name={`qual_${i.id}`} placeholder="ผลลัพธ์ที่คาดหวัง — เชิงคุณภาพ"
                          defaultValue={cur?.expected_quality ?? ''} className={inputClass} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </Card>

      <Card title="ประเด็นท้าทาย">
        <div className="flex flex-col gap-4">
          <Field label="หัวข้อ" hint="เว้นว่างไว้ถ้ายังไม่มีประเด็นท้าทาย">
            <input name="topic" defaultValue={challenge?.topic ?? ''} className={inputClass} />
          </Field>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="สภาพปัญหา">
              <textarea name="problem_statement" rows={4} defaultValue={challenge?.problem_statement ?? ''} className={areaClass} />
            </Field>
            <Field label="วิธีการดำเนินการ">
              <textarea name="method" rows={4} defaultValue={challenge?.method ?? ''} className={areaClass} />
            </Field>
            <Field label="ผลลัพธ์ที่คาดหวัง">
              <textarea name="expected_outcome" rows={4} defaultValue={challenge?.expected_outcome ?? ''} className={areaClass} />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/admin/pa" className="btn btn-ghost">ยกเลิก</Link>
        <button type="submit" className="btn btn-primary">บันทึกข้อตกลง</button>
      </div>
    </form>
  )
}
