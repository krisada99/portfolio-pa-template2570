import { requireAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getSelfDev, getItemImages, getItemFiles } from '@/lib/queries'
import ItemForm from '@/components/admin/ItemForm'
import SelfDevFields from '@/components/admin/SelfDevFields'
import DeleteButton from '@/components/admin/DeleteButton'
import { saveSelfDev, deleteSelfDev } from '@/lib/item-actions'
import { currentAcademicYear } from '@/lib/theme'

export default async function EditSelfDev({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { id } = await params
  const { saved, error } = await searchParams
  const rowId = Number(id)
  const item = await getSelfDev(rowId)
  if (!item) notFound()

  const [images, files] = await Promise.all([
    getItemImages('self_dev', rowId), getItemFiles('self_dev', rowId),
  ])
  async function update(f: FormData) { 'use server'; await saveSelfDev(rowId, f) }
  async function remove() { 'use server'; await deleteSelfDev(rowId) }

  return (
    <ItemForm
      heading="แก้ไขการพัฒนาตนเอง" backHref="/admin/self-dev" backLabel="กลับรายการ"
      action={update} saved={saved === '1'} error={error}
      deleteSlot={<DeleteButton action={remove} label="ลบรายการ" confirmText={item.title} />}
      mainFields={<SelfDevFields item={item} fiscalYear={currentAcademicYear() + 1} />}
      coverName="cert" coverLabel="เกียรติบัตร / วุฒิบัตร"
      coverSource={item.certificate_source} coverRef={item.certificate_ref}
      summary={item.summary} content={item.content} note={item.note}
      videoUrl={item.video_url} linkUrl={item.link_url} linkLabel={item.link_label}
      images={images.map((i) => ({ source: i.source, ref: i.ref, caption: i.caption }))}
      files={files.map((f) => ({ source: f.source, ref: f.ref, original_name: f.original_name, mime_type: f.mime_type }))}
    />
  )
}
