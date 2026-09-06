import { notFound } from 'next/navigation'
import { getAward, getItemImages, getItemFiles } from '@/lib/queries'
import ItemForm from '@/components/admin/ItemForm'
import AwardFields from '@/components/admin/AwardFields'
import DeleteButton from '@/components/admin/DeleteButton'
import { saveAward, deleteAward } from '@/lib/item-actions'

export default async function EditAward({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params
  const { saved, error } = await searchParams
  const rowId = Number(id)
  const item = await getAward(rowId)
  if (!item) notFound()

  const [images, files] = await Promise.all([
    getItemImages('award', rowId), getItemFiles('award', rowId),
  ])
  async function update(f: FormData) { 'use server'; await saveAward(rowId, f) }
  async function remove() { 'use server'; await deleteAward(rowId) }

  return (
    <ItemForm
      heading="แก้ไขรางวัล" backHref="/admin/awards" backLabel="กลับรายการ"
      action={update} saved={saved === '1'} error={error}
      deleteSlot={<DeleteButton action={remove} label="ลบรางวัล" confirmText={item.title} />}
      mainFields={<AwardFields item={item} />}
      coverName="image" coverLabel="รูปรางวัล / เกียรติบัตร"
      coverSource={item.image_source} coverRef={item.image_ref}
      summary={item.summary} content={item.content} note={item.note}
      videoUrl={item.video_url} linkUrl={item.link_url} linkLabel={item.link_label}
      images={images.map((i) => ({ source: i.source, ref: i.ref, caption: i.caption }))}
      files={files.map((f) => ({ source: f.source, ref: f.ref, original_name: f.original_name, mime_type: f.mime_type }))}
    />
  )
}
