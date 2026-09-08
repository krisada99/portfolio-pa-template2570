'use client'

import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from './Modal'
import { extractDriveId, imageUrl, fileUrl, IMG, type MediaSource } from '@/lib/media'
import { toastSuccess, toastError, toastInfo, alertError, fireConfetti } from '@/lib/ui'
import { currentAcademicYear } from '@/lib/theme'
import { getWorkForEdit, saveWork, type ImageRow, type FileRow } from '@/app/admin/indicator/[id]/actions'
import type { DomainGroup } from './PaDetailModal'

interface Draft {
  id: number; title: string; indicator_id: number; work_date: string
  academic_year: number; semester: string; status: string
  summary: string; content: string; video_url: string; tags: string
  is_featured: boolean
  images: ImageRow[]; files: FileRow[]
  existing: boolean
}

const today = () => new Date().toISOString().slice(0, 10)

const blank = (indicatorId: number): Draft => ({
  id: 0, title: '', indicator_id: indicatorId, work_date: today(),
  academic_year: currentAcademicYear(), semester: '1', status: 'published',
  summary: '', content: '', video_url: '', tags: '', is_featured: false,
  images: [], files: [], existing: false,
})

interface Api { add: () => void; edit: (workId: number) => void }
const Ctx = createContext<Api | null>(null)

export const useWorkModal = () => {
  const api = useContext(Ctx)
  if (!api) throw new Error('ต้องอยู่ใน <WorkModalProvider>')
  return api
}

/**
 * โมดัลเพิ่ม/แก้ไขผลงาน — ยกมาจาก modalWork ของ admin/indicator.php
 *
 * ต่างจากเว็บ PHP ตรงเดียว: รูปและไฟล์แนบใช้ "วางลิงก์ Google Drive" แทนการอัปโหลด
 * เพราะเวอร์ชันนี้รันบน Netlify ที่ไม่มีที่เก็บไฟล์ถาวร ส่วนอื่นเหมือนกันหมด
 */
export function WorkModalProvider({
  indicatorId, indicatorLabel, groups, children, openEdit, openNew,
}: {
  indicatorId: number
  indicatorLabel: string
  groups: DomainGroup[]
  children: React.ReactNode
  openEdit?: number
  openNew?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [d, setD] = useState<Draft>(blank(indicatorId))
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const add = () => { setD(blank(indicatorId)); setErr(''); setOpen(true) }

  const edit = async (workId: number) => {
    setD(blank(indicatorId)); setErr(''); setOpen(true); setLoading(true)
    try {
      const w = await getWorkForEdit(workId)
      if (!w) { alertError('ไม่พบผลงานที่ต้องการแก้ไข'); setOpen(false); return }
      setD({
        id: w.id, title: w.title, indicator_id: w.indicator_id, work_date: w.work_date,
        academic_year: w.academic_year, semester: String(w.semester), status: w.status,
        summary: w.summary, content: w.content, video_url: w.video_url, tags: w.tags,
        is_featured: w.is_featured === 1, images: w.images, files: w.files, existing: true,
      })
    } catch {
      alertError('โหลดข้อมูลผลงานไม่สำเร็จ')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  // เปิดโมดัลอัตโนมัติเมื่อมาจากลิงก์ ?new=1 หรือ ?edit=<id> เหมือนเว็บ PHP
  useEffect(() => {
    if (openNew) add()
    else if (openEdit) void edit(openEdit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNew, openEdit])

  async function submit(f: FormData) {
    setBusy(true)
    try {
      const isNew = !d.id
      const movedTo = d.indicator_id
      const r = await saveWork(f)
      if (!r.ok) { setErr(r.error); toastError(r.error); return }
      if (isNew) fireConfetti()
      toastSuccess(isNew ? 'เพิ่มผลงานสำเร็จ!' : 'บันทึกผลงานสำเร็จ!')
      setOpen(false)
      if (movedTo !== indicatorId) {
        toastInfo('ผลงานถูกย้ายไปตัวชี้วัดอื่นแล้ว')
        setTimeout(() => router.push(`/admin/indicator/${movedTo}`), 900)
        return
      }
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={{ add, edit }}>
      {children}

      <Modal open={open} onClose={() => setOpen(false)}
        title={d.existing ? '✏️ แก้ไขผลงาน' : '✏️ เพิ่มผลงานใหม่'}>
        <form action={submit} autoComplete="off">
          <input type="hidden" name="id" value={d.id} />
          <input type="hidden" name="images" value={JSON.stringify(d.images)} />
          <input type="hidden" name="files" value={JSON.stringify(d.files)} />

          <div className="modal-body">
            {loading ? (
              <p className="py-16 text-center text-ink-muted text-[13px]">
                <span className="spin inline-block mr-1">⏳</span> กำลังโหลด…
              </p>
            ) : (
              <>
                <p className="text-[12px] text-ink-soft bg-sunny-soft/60 border border-sunny/40 rounded-xl px-3.5 py-2.5 mb-5">
                  🔒 ผลงานนี้จะถูกบันทึกในตัวชี้วัด <b className="text-ink">{indicatorLabel}</b>
                  {' '}(เปลี่ยนตัวชี้วัดได้จากช่องด้านล่างถ้าต้องการย้าย)
                </p>

                <div className="mb-4">
                  <label className="lbl req" htmlFor="w_title">ชื่อผลงาน</label>
                  <input className="inp" id="w_title" name="title" required maxLength={255}
                    placeholder="เช่น สื่อ AR “ระบบสุริยะ” สแกนเล่นได้จริงในห้องเรียน"
                    value={d.title} onChange={(e) => set('title', e.target.value)} />
                  <span className="field-error">{err}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl req" htmlFor="w_indicator">ตัวชี้วัด (วPA)</label>
                    <select className="inp" id="w_indicator" name="indicator_id" required
                      value={d.indicator_id} onChange={(e) => set('indicator_id', Number(e.target.value))}>
                      {groups.map((g) => (
                        <optgroup key={g.code} label={`ด้านที่ ${g.code} ${g.name}`}>
                          {g.indicators.map((i) => (
                            <option key={i.id} value={i.id}>{i.code} {i.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="w_date">วันที่จัดทำ</label>
                    <input className="inp" id="w_date" name="work_date" type="date"
                      value={d.work_date} onChange={(e) => set('work_date', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="lbl req" htmlFor="w_year">ปีการศึกษา (พ.ศ.)</label>
                    <input className="inp" id="w_year" name="academic_year" type="number" required min={2500} max={2700}
                      value={d.academic_year} onChange={(e) => set('academic_year', Number(e.target.value))} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="w_sem">ภาคเรียน</label>
                    <select className="inp" id="w_sem" name="semester"
                      value={d.semester} onChange={(e) => set('semester', e.target.value)}>
                      <option value="1">1</option><option value="2">2</option><option value="3">ฤดูร้อน</option>
                    </select>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="w_status">สถานะ</label>
                    <select className="inp" id="w_status" name="status"
                      value={d.status} onChange={(e) => set('status', e.target.value)}>
                      <option value="published">เผยแพร่</option><option value="draft">ฉบับร่าง</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="lbl" htmlFor="w_summary">บทสรุปย่อ (แสดงบนการ์ด)</label>
                  <textarea className="inp" id="w_summary" name="summary" maxLength={500} rows={2}
                    placeholder="สรุปสั้น ๆ ไม่เกิน 2 บรรทัด"
                    value={d.summary} onChange={(e) => set('summary', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="mb-4">
                  <label className="lbl" htmlFor="w_content">
                    รายละเอียด (รองรับ HTML พื้นฐาน: &lt;h3&gt; &lt;p&gt; &lt;ul&gt; &lt;b&gt;)
                  </label>
                  <textarea className="inp font-mono text-[12.5px]" id="w_content" name="content" rows={9}
                    placeholder="<h3>🎯 วัตถุประสงค์</h3><p>…</p><h3>🛠️ ขั้นตอนดำเนินการ</h3><p>…</p><h3>🌟 ผลที่เกิดกับผู้เรียน</h3><p>…</p>"
                    value={d.content} onChange={(e) => set('content', e.target.value)} />
                  <span className="field-error"></span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="lbl" htmlFor="w_video">ลิงก์วิดีโอ YouTube</label>
                    <input className="inp" id="w_video" name="video_url" type="url"
                      placeholder="https://www.youtube.com/watch?v=…"
                      value={d.video_url} onChange={(e) => set('video_url', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                  <div>
                    <label className="lbl" htmlFor="w_tags">แท็ก (คั่นด้วยจุลภาค)</label>
                    <input className="inp" id="w_tags" name="tags" maxLength={255} placeholder="AR, สื่อนวัตกรรม, ป.5"
                      value={d.tags} onChange={(e) => set('tags', e.target.value)} />
                    <span className="field-error"></span>
                  </div>
                </div>

                <label className="flex items-center gap-3 mb-6 cursor-pointer rounded-2xl border-2 border-[color:var(--border)] bg-sunny-soft/30 px-4 py-3 hover:border-sunny transition-colors">
                  <input type="checkbox" id="w_featured" name="is_featured" value="1"
                    className="w-5 h-5 accent-[color:var(--primary)] shrink-0"
                    checked={d.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
                  <span className="text-[13px] font-semibold">
                    ⭐ ตั้งเป็นผลงานเด่น <span className="text-ink-muted font-normal">(แสดงป้ายบนการ์ด)</span>
                  </span>
                </label>

                <ImageSection rows={d.images} onChange={(rows) => set('images', rows)} />
                <FileSection rows={d.files} onChange={(rows) => set('files', rows)} />
              </>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary" disabled={busy || loading}>
              {busy ? 'กำลังบันทึก…' : '💾 บันทึก'}
            </button>
          </div>
        </form>
      </Modal>
    </Ctx.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  รูปภาพ — ลากที่ ⠿ เพื่อจัดลำดับ · รูปแรก = ภาพปก                    */
/* ------------------------------------------------------------------ */

function ImageSection({ rows, onChange }: { rows: ImageRow[]; onChange: (r: ImageRow[]) => void }) {
  const [paste, setPaste] = useState('')
  const [drag, setDrag] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const id = extractDriveId(paste)
  const invalid = paste.trim() !== '' && !id

  const add = () => {
    if (!id) return
    onChange([...rows, { source: 'drive' as MediaSource, ref: id, caption: '' }])
    setPaste('')
  }

  /**
   * ลากจัดลำดับด้วย pointer event (ไม่ใช่ HTML5 drag-and-drop)
   * เพราะแบบ pointer ใช้ได้ทั้งเมาส์และนิ้วบนมือถือ ส่วน drag-and-drop ของ HTML ไม่รองรับการแตะ
   */
  function startDrag(from: number, e: React.PointerEvent) {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag(from)
    let cur = from

    const move = (ev: PointerEvent) => {
      const kids = Array.from(box.current?.children ?? []) as HTMLElement[]
      const over = kids.findIndex((k) => {
        const r = k.getBoundingClientRect()
        return ev.clientY >= r.top && ev.clientY <= r.bottom
      })
      if (over < 0 || over === cur) return
      const c = [...rowsRef.current]
      const [item] = c.splice(cur, 1)
      c.splice(over, 0, item!)
      cur = over
      setDrag(over)
      onChange(c)
    }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      setDrag(null)
      if (cur !== from) toastSuccess('จัดลำดับรูปภาพเรียบร้อย · รูปแรกเป็นภาพปก')
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  // ให้ตัวจัดการ pointermove เห็นลำดับล่าสุดเสมอ (closure จับค่าเก่าไว้ไม่ได้)
  const rowsRef = useRef(rows)
  rowsRef.current = rows

  return (
    <div className="mb-5">
      <span className="lbl">รูปภาพประกอบ (วางลิงก์แชร์จาก Google Drive · เพิ่มได้หลายรูป)</span>

      <div className="dropzone">
        <div className="text-4xl float">🖼️</div>
        <p className="text-[13.5px] font-bold mt-1">วางลิงก์แชร์รูปจาก Google Drive แล้วกดเพิ่ม</p>
        <p className="text-[11.5px] text-ink-muted mt-0.5">เพิ่มได้ทีละรูป · รูปแรกจะกลายเป็นภาพปก</p>
        <div className="mt-3 flex gap-2 max-w-[520px] mx-auto">
          <input value={paste} onChange={(e) => setPaste(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            placeholder="https://drive.google.com/file/d/…/view"
            className={`inp !py-2 !text-[12.5px]${invalid ? ' is-invalid' : ''}`} />
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={add} disabled={!id}>+ เพิ่มรูป</button>
        </div>
        {invalid && <p className="text-[11.5px] text-coral-deep mt-2">ไม่พบรหัสไฟล์ในลิงก์นี้ — ก๊อบลิงก์จากปุ่ม “แชร์” ใน Google Drive มาวางอีกครั้ง</p>}
      </div>

      <div className="mt-4">
        <h4 className="font-bold text-[14px] mb-2 flex flex-wrap items-baseline gap-x-2">
          🖼️ รูปภาพในผลงานนี้
          <span className="text-[11.5px] font-normal text-ink-muted">(ลากที่ ⠿ เพื่อจัดลำดับ · รูปแรก = ภาพปก)</span>
        </h4>
        <div ref={box}>
          {rows.length === 0
            ? <p className="text-[12.5px] text-ink-muted">ยังไม่มีรูปภาพ</p>
            : rows.map((img, i) => (
              <div key={`${img.ref}-${i}`} className={`img-row${drag === i ? ' sortable-ghost' : ''}`}>
                <span onPointerDown={(e) => startDrag(i, e)}
                  className="cursor-grab select-none touch-none w-8 h-8 rounded-lg bg-[color:var(--divider)] grid place-items-center text-ink-faint text-lg shrink-0"
                  title="ลากเพื่อจัดลำดับ">⠿</span>
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(img, IMG.thumb)} alt=""
                    className="w-16 h-12 object-cover rounded-xl border border-[color:var(--border)]" />
                  {i === 0 && <span className="absolute -top-1.5 -left-1.5 chip chip-grad !px-1.5 !py-0.5 !text-[9px]">ปก</span>}
                </span>
                <input className="inp !py-1.5 !text-[12px] !min-h-[38px] flex-1" placeholder="คำบรรยายภาพ (alt)"
                  value={img.caption}
                  onChange={(e) => onChange(rows.map((r, k) => (k === i ? { ...r, caption: e.target.value } : r)))} />
                <button type="button" className="icon-btn del shrink-0" title="ลบรูปนี้" aria-label="ลบรูปนี้"
                  onClick={() => onChange(rows.filter((_, k) => k !== i))}>🗑️</button>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ไฟล์แนบ                                                            */
/* ------------------------------------------------------------------ */

function FileSection({ rows, onChange }: { rows: FileRow[]; onChange: (r: FileRow[]) => void }) {
  const [paste, setPaste] = useState('')
  const [name, setName] = useState('')
  const id = extractDriveId(paste)
  const ready = !!id && name.trim() !== ''

  const add = () => {
    if (!ready) return
    onChange([...rows, { source: 'drive' as MediaSource, ref: id!, original_name: name.trim() }])
    setPaste(''); setName('')
  }

  return (
    <div className="mb-2">
      <span className="lbl">ไฟล์แนบ (วางลิงก์แชร์จาก Google Drive · pdf, docx, xlsx, pptx, zip)</span>

      <div className="dropzone !py-5">
        <div className="text-3xl">📎</div>
        <p className="text-[13.5px] font-bold mt-1">วางลิงก์แชร์ไฟล์จาก Google Drive แล้วกดเพิ่ม</p>
        <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2 max-w-[620px] mx-auto">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อไฟล์ที่จะแสดง"
            className="inp !py-2 !text-[12.5px]" />
          <input value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="วางลิงก์ Drive"
            className="inp !py-2 !text-[12.5px]" />
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={add} disabled={!ready}>+ เพิ่มไฟล์</button>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-bold text-[14px] mb-2">📎 ไฟล์แนบในผลงานนี้</h4>
        {rows.length === 0
          ? <p className="text-[12.5px] text-ink-muted">ยังไม่มีไฟล์แนบ</p>
          : rows.map((f, i) => (
            <div key={`${f.ref}-${i}`} className="img-row !cursor-default">
              <span className="w-10 h-10 rounded-xl grad-soft grid place-items-center text-lg shrink-0">📄</span>
              <a href={fileUrl(f) ?? '#'} target="_blank" rel="noreferrer"
                className="flex-1 min-w-0 text-[12.5px] font-bold truncate hover:text-primary-deep">{f.original_name}</a>
              <span className="chip chip-glass !text-[10.5px] shrink-0">Drive</span>
              <button type="button" className="icon-btn del shrink-0" title="ลบไฟล์" aria-label="ลบไฟล์"
                onClick={() => onChange(rows.filter((_, k) => k !== i))}>🗑️</button>
            </div>
          ))}
      </div>
    </div>
  )
}

/** ปุ่ม “+ เพิ่มผลงานใหม่” — วางกี่จุดก็ได้ ใช้โมดัลกล่องเดียวกัน */
export function NewWorkButton({ className, children }: { className: string; children: React.ReactNode }) {
  const { add } = useWorkModal()
  return <button type="button" className={className} onClick={add}>{children}</button>
}
