import { notFound } from 'next/navigation'
import { getAward, getItemImages, getItemFiles, getAwards } from '@/lib/queries'
import { thaiDate } from '@/lib/theme'
import ItemDetail from '@/components/ItemDetail'
import type { GalleryItem } from '@/components/Gallery'

/** สร้างหน้ารางวัลทุกใบไว้ล่วงหน้าตอน build */
export async function generateStaticParams() {
  const list = await getAwards()
  return list.map((a) => ({ id: String(a.id) }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const a = await getAward(Number(id))
  return { title: a?.title ?? 'ไม่พบรางวัล' }
}

export default async function AwardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const award = await getAward(Number(id))
  if (!award) notFound()

  const [imgs, files] = await Promise.all([
    getItemImages('award', award.id), getItemFiles('award', award.id),
  ])

  // รูปหลักของรางวัลให้มาเป็นรูปแรกของแกลเลอรีเสมอ
  const images: GalleryItem[] = [
    ...(award.image_ref
      ? [{ id: 0, source: award.image_source ?? 'drive', ref: award.image_ref, caption: award.title }]
      : []),
    ...imgs.map((i) => ({ id: i.id, source: i.source, ref: i.ref, caption: i.caption })),
  ]

  return (
    <ItemDetail
      backHref="/development" backLabel="รางวัลและเกียรติคุณ"
      chip={`🏆 ระดับ${award.level}`}
      title={award.title}
      gradient="linear-gradient(135deg,var(--d2-deep),var(--d2))"
      meta={[
        ['หน่วยงาน', award.awarder],
        ['ระดับ', award.level],
        ['วันที่ได้รับ', thaiDate(award.award_date)],
      ]}
      summary={award.summary}
      content={award.content}
      note={award.note}
      videoUrl={award.video_url}
      linkUrl={award.link_url}
      linkLabel={award.link_label}
      images={images}
      files={files}
    />
  )
}
