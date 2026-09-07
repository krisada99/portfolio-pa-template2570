import { requireAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { one, all } from '@/lib/db'
import { getIndicators, getWorkImages, getWorkFiles } from '@/lib/queries'
import type { Work } from '@/lib/types'
import WorkForm from '@/components/admin/WorkForm'
import DeleteButton from '@/components/admin/DeleteButton'
import { saveWork, deleteWork } from '../actions'

export default async function EditWork({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { id } = await params
  const { saved, error } = await searchParams
  const workId = Number(id)
  const work = await one<Work>('SELECT * FROM works WHERE id = ? AND deleted_at IS NULL', [workId])
  if (!work) notFound()

  const [indicators, images, files] = await Promise.all([
    getIndicators(), getWorkImages(workId), getWorkFiles(workId),
  ])

  async function update(f: FormData) {
    'use server'
    await saveWork(workId, f)
  }
  async function remove() {
    'use server'
    await deleteWork(workId)
  }

  return (
    <WorkForm
      work={work} indicators={indicators}
      images={images.map((i) => ({ source: i.source, ref: i.ref, caption: i.caption }))}
      files={files.map((f) => ({ source: f.source, ref: f.ref, original_name: f.original_name, mime_type: f.mime_type }))}
      action={update} saved={saved === '1'} error={error}
      deleteSlot={<DeleteButton action={remove} label="ลบผลงาน" confirmText={work.title} />}
    />
  )
}
