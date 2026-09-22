import Link from 'next/link'
import { imageUrl, imageSrcSet, fileUrl, driveEmbedUrl, IMG } from '@/lib/media'
import { REPORT_KINDS } from '@/lib/queries'
import type { OnePageReport, ReportKind } from '@/lib/types'

/**
 * การ์ด "รายงานหน้าเดียว" หนึ่งใบ — แปลงมาจาก partials/report-card.php ของเว็บ PHP
 *
 * พรีวิวกินเต็มความกว้างการ์ด และดูได้ทั้งบนคอมและมือถือ
 *   • ไฟล์รูป → แสดงรูปเต็มความกว้าง เลื่อนขึ้น-ลงดูส่วนที่เหลือได้
 *   • ไฟล์ PDF บน Drive → ฝังตัวอ่านของ Google (ใช้ได้ทุกอุปกรณ์ · เปิดหลายหน้าได้)
 *
 * ต่างจากเว็บ PHP ตรงที่ไม่ได้ใช้ PDF.js วาดเอง เพราะไฟล์อยู่คนละโดเมน (Drive)
 * เบราว์เซอร์จึงอ่านไฟล์มาวาดลง canvas ไม่ได้ (ติด CORS) — ใช้ตัวอ่านของ Google แทน
 */
export default function ReportCard({
  kind, row, year, canEdit = false,
}: {
  kind: ReportKind
  row: OnePageReport | null
  year: number
  canEdit?: boolean
}) {
  const meta = REPORT_KINDS[kind]
  const gold = meta.tone === 'gold'
  const title = row && row.title ? row.title : meta.title
  const isImg = row?.file_kind === 'image'
  const media = { source: row?.file_source ?? null, ref: row?.file_ref ?? null }
  const href = row ? fileUrl(media) : null
  const embed = row && !isImg && row.file_source === 'drive' && row.file_ref
    ? driveEmbedUrl(row.file_ref)
    : null

  return (
    <article className="report-card">
      {/* หัวการ์ด */}
      <header className={`report-head ${gold ? 'is-gold' : 'is-primary'}`}>
        <span className="report-ico" aria-hidden="true">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="report-kicker">{meta.short}</p>
          <h3 className="report-title">{title}</h3>
        </div>
        <span className="report-year">ปีงบฯ {year}</span>
      </header>

      {!row || !href ? (
        /* ยังไม่มีไฟล์ */
        <div className="report-empty">
          <span className="text-[40px] leading-none">🗂️</span>
          <p className="mt-3 text-[13.5px] font-bold text-ink-soft">ยังไม่ได้เพิ่มรายงานของปีนี้</p>
          <p className="mt-1 text-[12px] text-ink-muted">เลือกปีงบประมาณอื่น หรือกลับมาดูใหม่ภายหลัง</p>
          {canEdit && (
            <Link href="/admin/pa" className="btn btn-primary btn-sm mt-4">📎 เพิ่มรายงาน</Link>
          )}
        </div>
      ) : (
        <>
          {/* พรีวิว */}
          <div className="report-view">
            {isImg ? (
              <div className="report-scroll">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="report-page"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                  src={imageUrl(media, IMG.full)}
                  srcSet={imageSrcSet(media)}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  alt={title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : embed ? (
              <iframe
                className="report-embed"
                src={embed}
                title={title}
                loading="lazy"
                allow="autoplay"
              />
            ) : (
              /* PDF ที่ไม่ได้อยู่บน Drive — ฝังตรง ๆ ไม่ได้ทุกอุปกรณ์ จึงให้กดเปิดแทน */
              <div className="report-empty">
                <span className="text-[40px] leading-none">📕</span>
                <p className="mt-3 text-[13.5px] font-bold text-ink-soft">ไฟล์ PDF</p>
                <p className="mt-1 text-[12px] text-ink-muted">กดปุ่ม “ดูเต็ม” ด้านล่างเพื่อเปิดอ่าน</p>
              </div>
            )}

            {isImg && (
              <>
                <span className="report-fade" aria-hidden="true" />
                <span className="report-hint">↕ เลื่อนเพื่อดูทั้งฉบับ</span>
              </>
            )}
          </div>

          {/* ท้ายการ์ด */}
          <footer className="report-foot">
            {row.note && <p className="report-note">{row.note}</p>}

            <div className="report-meta">
              <span className="report-tag">{isImg ? '🖼️ รูปภาพ' : '📕 PDF'}</span>
              <span>{row.file_source === 'drive' ? 'เก็บใน Google Drive' : 'ไฟล์ในระบบ'}</span>
            </div>

            <div className="report-actions">
              <a href={href} target="_blank" rel="noopener noreferrer"
                 className="btn btn-primary btn-sm flex-1">👀 ดูเต็ม</a>
              <a href={href} target="_blank" rel="noopener noreferrer"
                 className="btn btn-ghost btn-sm flex-1">⬇️ ดาวน์โหลด</a>
            </div>
          </footer>
        </>
      )}
    </article>
  )
}
