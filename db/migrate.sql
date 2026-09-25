-- =====================================================================
--  migrate.sql — อัปเดตฐานข้อมูลของเว็บที่ "ติดตั้งไปแล้ว" ให้มีของใหม่
--
--  ปลอดภัย รันซ้ำกี่ครั้งก็ได้ ข้อมูลเดิมไม่หาย
--    • CREATE TABLE IF NOT EXISTS → มีอยู่แล้วก็ข้าม
--    • ALTER TABLE ADD COLUMN     → ถ้าคอลัมน์มีอยู่แล้ว SQLite จะฟ้อง
--                                    ตัวรันใน lib/setup.ts จะกลืน error นี้ให้
--
--  วิธีรัน
--    บน Turso  : npm run db:migrate
--    ตอนใช้งาน : เปิดหน้าหลังบ้านครั้งแรกหลังอัปเดต ระบบจะรันให้เอง
-- =====================================================================

-- ---------- รายงานหน้าเดียว (แสดงบนหน้าแรก) ----------
CREATE TABLE IF NOT EXISTS one_page_reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fiscal_year INTEGER NOT NULL,
  kind        TEXT NOT NULL CHECK(kind IN ('salary','pa')),
  title       TEXT NOT NULL DEFAULT '',
  file_source TEXT CHECK(file_source IN ('drive','static')) NULL,
  file_ref    TEXT NULL,
  file_kind   TEXT NOT NULL DEFAULT 'image' CHECK(file_kind IN ('image','pdf')),
  note        TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fiscal_year, kind)
);
CREATE INDEX IF NOT EXISTS idx_reports_year ON one_page_reports(fiscal_year);

-- ---------- ลิงก์ท้ายเว็บที่แก้ข้อความได้ ----------
ALTER TABLE teacher_profile ADD COLUMN footer_link_url TEXT NOT NULL DEFAULT '';
ALTER TABLE teacher_profile ADD COLUMN footer_link_label TEXT NOT NULL DEFAULT '';

-- ---------- ลิงก์เว็บไซต์ประกอบข้อตกลง PA (ตอนที่ 3) ----------
ALTER TABLE pa_agreements ADD COLUMN link_url TEXT NOT NULL DEFAULT '';
ALTER TABLE pa_agreements ADD COLUMN link_label TEXT NOT NULL DEFAULT '';
