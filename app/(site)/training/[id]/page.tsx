import { notFound } from 'next/navigation'
import { getSelfDev, getItemImages, getItemFiles } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import ItemDetail from '@/components/ItemDetail'
import type { GalleryItem } from '@/components/Gallery'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await getSelfDev(Number(id))
  return { title: s?.title ?? 'ไม่พบรายการ' }
}

export default async function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getSelfDev(Number(id))
  if (!item) notFound()

  const [imgs, files] = await Promise.all([
    getItemImages('self_dev', item.id), getItemFiles('self_dev', item.id),
  ])

  const images: GalleryItem[] = [
    ...(item.certificate_ref
      ? [{ id: 0, source: item.certificate_source ?? 'drive', ref: item.certificate_ref, caption: 'เกียรติบัตร' }]
      : []),
    ...imgs.map((i) => ({ id: i.id, source: i.source, ref: i.ref, caption: i.caption })),
  ]

  const period = item.start_date === item.end_date || !item.end_date
    ? thaiDate(item.start_date)
    : `${thaiDate(item.start_date)} – ${thaiDate(item.end_date)}`

  return (
    <ItemDetail
      backHref="/development" backLabel="การพัฒนาตนเอง"
      chip={`🌱 ${item.type}`}
      title={item.title}
      gradient="linear-gradient(135deg,var(--d3-deep),var(--d3))"
      meta={[
        ['ประเภท', item.type],
        ['หน่วยงาน', item.organizer],
        ['ช่วงเวลา', period],
        ['จำนวนชั่วโมง', item.hours ? `${item.hours} ชั่วโมง` : ''],
        ['ปีงบประมาณ', String(item.fiscal_year)],
      ]}
      summary={item.summary}
      content={item.content}
      note={item.note}
      videoUrl={item.video_url}
      linkUrl={item.link_url}
      linkLabel={item.link_label}
      images={images}
      files={files}
    />
  )
}
