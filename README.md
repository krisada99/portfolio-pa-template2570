# แฟ้มสะสมผลงานครู วPA — เวอร์ชัน Netlify

เขียนใหม่จากเทมเพลต PHP เพื่อให้รันบน **Netlify ได้ฟรีทั้งหมด**

```
หน้าเว็บ + หลังบ้าน   →  Netlify (static + Functions)
ฐานข้อมูล             →  Turso (libSQL — SQLite ที่ทำเป็นบริการ)
รูปภาพ + ไฟล์เอกสาร   →  Google Drive (แนบเป็นลิงก์ ไม่ต้องอัปโหลด)
```

> **สถานะ: เฟส 1–2 เสร็จแล้ว**
> เฟส 1 โครงฐานข้อมูล + โมเดลสื่อ + ตัวย้ายข้อมูล
> เฟส 2 หน้าบ้านครบทุกหน้า (Next.js 15 App Router + Tailwind v4)
> เฟส 3 หลังบ้านครบทุกส่วน (ล็อกอิน + CRUD + แนบลิงก์ Google Drive)
> เฟส 4 ตัวติดตั้ง + คู่มือขึ้น Netlify — **ครบทุกเฟสแล้ว**

## รันบนเครื่อง

```bash
npm install
npm run db:local                                    # สร้าง db/local.sqlite จาก schema + seed
node scripts/create-admin.mjs admin รหัสผ่าน "ชื่อครู"   # สร้างบัญชีผู้ดูแล
npm run dev                                         # http://localhost:3100
```

ต้องมี `.env.local` ที่มี `TURSO_DATABASE_URL` และ `AUTH_SECRET`
สร้าง AUTH_SECRET ใหม่ด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

## หลังบ้าน (`/admin`)

| เส้นทาง | หน้า |
|---|---|
| `/login` | เข้าสู่ระบบ — บัญชีเดียว, ผิด 5 ครั้งล็อก 15 นาที |
| `/admin` | ภาพรวม + ผลงานล่าสุด |
| `/admin/profile` | โปรไฟล์ครู + รูปจาก Drive + เลือกจุดโฟกัสรูป |
| `/admin/works` | ผลงาน — เพิ่ม/แก้/ลบ, แกลเลอรีหลายรูป, ไฟล์แนบ |
| `/admin/pa` | ข้อตกลง PA — ตอนที่ 1, 15 ตัวชี้วัด, ประเด็นท้าทาย |
| `/admin/self-dev` | การพัฒนาตนเอง |
| `/admin/awards` | รางวัลและเกียรติคุณ |
| `/admin/settings` | ธีมสี + เปลี่ยนรหัสผ่าน |

### ความปลอดภัย

- JWT เก็บใน cookie แบบ `HttpOnly` + `Secure` + `SameSite=Strict`
- `middleware.ts` กันคนที่ยังไม่ล็อกอินออกจาก `/admin` ทั้งหมด
- **ทุก Server Action เรียก `requireAdmin()` เป็นบรรทัดแรกเสมอ** — middleware เป็นแค่ด่านสะดวก
  ไม่ใช่ระบบความปลอดภัยหลัก เพราะ Server Action ยิงตรงเข้ามาได้โดยไม่ผ่านหน้าจอ
- บันทึกความพยายามล็อกอินทุกครั้งใน `login_attempts` และการแก้ข้อมูลใน `activity_log`
- เปรียบเทียบรหัสผ่านเสมอแม้ไม่พบบัญชี เพื่อไม่ให้เดาได้จากเวลาตอบกลับว่ามีชื่อผู้ใช้นั้นจริงไหม
- รหัสผ่านที่ hash จาก PHP (`$2y$...`) ใช้ต่อได้เลย — ย้ายบัญชีเดิมมาไม่ต้องตั้งรหัสใหม่

## หน้าที่มีแล้ว

| เส้นทาง | หน้า |
|---|---|
| `/` | หน้าแรก — hero, ตัวเลขสรุป, 3 ด้าน 15 ตัวชี้วัด, ผลงานล่าสุด |
| `/pa` | ข้อตกลง PA (เลือกปีงบประมาณได้) — ตอนที่ 1, ตอนที่ 2, ประเด็นท้าทาย |
| `/development` | การพัฒนาตนเอง (เลือกปีได้) + รางวัลและเกียรติคุณ |
| `/about` | ประวัติครู — ข้อมูลทั่วไป, วุฒิการศึกษา, เส้นทางรับราชการ |
| `/contact` | ช่องทางติดต่อ |
| `/indicator/[id]` | ตัวชี้วัดรายตัว + ผลงานของตัวชี้วัด + ก่อนหน้า/ถัดไป |
| `/work/[slug]` | รายละเอียดผลงาน — แกลเลอรี, เนื้อหา, วิดีโอ, ไฟล์แนบ, ผลงานเกี่ยวข้อง |
| `/award/[id]` | รายละเอียดรางวัล |
| `/training/[id]` | รายละเอียดการพัฒนาตนเอง |

ทุกหน้าตั้ง `dynamic = 'force-dynamic'` ใน `app/layout.tsx` เพื่อให้ดึงข้อมูลสดเสมอ
ถ้าปล่อยให้ prerender เป็น static ข้อมูลจะค้างตั้งแต่ตอน build ครูแก้แล้วหน้าเว็บไม่เปลี่ยน

---

## โมเดลสื่อ: `source` + `ref`

หัวใจของเวอร์ชันนี้ ทุกที่ที่เคยเก็บ path ของไฟล์ เปลี่ยนเป็นเก็บ 2 คอลัมน์คู่กัน

| `source` | `ref` เก็บอะไร | ใช้ตอนไหน |
|---|---|---|
| `drive` | Google Drive **FILE ID** | รูปและเอกสารที่ครูแนบเอง |
| `static` | path ใต้ `/public` | รูปตัวอย่างที่มากับเทมเพลต |

**เก็บ ID ไม่เก็บ URL เต็ม** เพราะ `lh3.googleusercontent.com` เป็น endpoint ที่ Google
ไม่ได้ประกาศรองรับ (Google เคยปิด `drive.google.com/uc?export=view` มาแล้ว ตอนนี้คืน 403)
ถ้าวันหนึ่งรูปแบบเปลี่ยน แก้ที่ [`src/lib/media.ts`](src/lib/media.ts) ไฟล์เดียว
ฐานข้อมูลของลูกค้าทุกคนไม่ต้องแตะเลย

**ห้ามประกอบ URL ของ Google เองที่อื่นเด็ดขาด** ให้เรียกผ่าน `imageUrl()` / `fileUrl()` เท่านั้น

### ไม่มีคอลัมน์ thumbnail แล้ว
ย่อขนาดที่ปลายทางแทน — `drive` ต่อท้าย `=w400` · `static` ผ่าน Netlify Image CDN

### `avatar_focus_x` / `avatar_focus_y`
รูปโปรไฟล์จาก Drive เราแก้ไฟล์ต้นทางไม่ได้ เครื่องมือครอบตัดแบบเดิมจึงใช้ไม่ได้
แทนที่ด้วยการเก็บ "จุดโฟกัส" 0–100% แล้วใช้ CSS `object-position` — ครูเลื่อนกรอบ
ให้เห็นหน้าตัวเองพอดีได้เหมือนเดิม โดยไม่ต้องสร้างไฟล์ใหม่

---

## โครงไฟล์

```
db/schema.sql        19 ตาราง · 13 ดัชนี  (ทดสอบสร้างจริงผ่านแล้ว)
db/seed-core.sql     3 ด้าน + 15 ตัวชี้วัด ตามเกณฑ์ ว9/2564 · ธีม · โปรไฟล์เปล่า
db/seed-demo.sql     ข้อมูลตัวอย่าง 30 ผลงาน · 85 รูป (ชี้ไป public/media/seed/)
src/lib/media.ts     ที่เดียวที่ประกอบ URL ของรูปและไฟล์
scripts/export-from-php.php   ย้ายข้อมูลจากเทมเพลต PHP เดิม
scripts/media.test.mjs        เทสต์ตัวแยก Drive ID (13 เคส)
public/media/        รูปตัวอย่าง
```

## เริ่มใช้งาน

```bash
# ทดสอบบนเครื่องด้วย SQLite ธรรมดาก่อน (ยังไม่ต้องสมัคร Turso)
npm run db:local

# หรือขึ้น Turso จริง
turso db create portfolio
export TURSO_DB=portfolio
npm run db:schema && npm run db:seed && npm run db:demo
```

## ย้ายข้อมูลจากเว็บ PHP เดิม

```bash
# จากเทมเพลต SQLite
php scripts/export-from-php.php \
  --sqlite=../portfolio-website-sqlite/database/portfolio.sqlite \
  --uploads=../portfolio-website-sqlite/uploads \
  --out=db/migrated.sql --copy

# จากเว็บตัวจริงที่ใช้ MySQL
php scripts/export-from-php.php \
  --config=../portfolio-website/config/config.php \
  --uploads=../portfolio-website/uploads \
  --out=db/migrated.sql --copy
```

`--copy` จะคัดลอกรูปเดิมมาไว้ใน `public/media/` ให้ด้วย เว็บใหม่จะแสดงผลได้ทันที
โดยยังไม่ต้องย้ายอะไรขึ้น Google Drive แล้วค่อยทยอยเปลี่ยนทีละรูปเป็นลิงก์ Drive ภายหลัง
(สคริปต์นี้**อ่านอย่างเดียว** ไม่แตะฐานข้อมูลหรือไฟล์ต้นทาง)

## เทสต์

```bash
npm run test:media
```

---

## สิ่งที่ต้องตัดสินใจก่อนเริ่มเฟส 2

**เลือกเฟรมเวิร์ก** — Phase 1 ใช้ได้กับทั้งสองแบบ ยังไม่ต้องรีบ

| | Next.js บน Netlify | Vite + React + Netlify Functions |
|---|---|---|
| โค้ดที่ต้องเขียน | น้อยกว่า (server component อ่าน DB ได้ตรง ๆ) | ต้องเขียน API ทุกเส้นทางเอง |
| SEO / โหลดครั้งแรก | ดีกว่า (render ฝั่งเซิร์ฟเวอร์) | ต้องทำเพิ่ม |
| ความเรียบง่าย | ผูกกับ adapter ของ Netlify | ตรงไปตรงมากว่า |

สำหรับเว็บที่ต้องให้กรรมการเปิดดูและอยากให้ Google เจอ **ผมแนะนำ Next.js**

## ความปลอดภัยที่ต้องไม่ลืมในเฟส 3

หน้าเว็บทั้งหมดเป็นไฟล์นิ่งที่ใครก็ดาวน์โหลดไปอ่านได้
**ห้ามเช็กสิทธิ์ในฝั่ง React** ต้องตรวจ JWT ใน Function ทุกจุดที่เขียนข้อมูล
ลืมแม้แต่จุดเดียว = คนอื่นยิง API ตรงเข้ามาแก้ข้อมูลได้โดยไม่ต้องล็อกอิน

---

## นำขึ้น Netlify (ฟรีทั้งหมด)

### 1. สร้างฐานข้อมูลที่ Turso

สมัครที่ [turso.tech](https://turso.tech) แล้วติดตั้ง CLI

```bash
turso db create portfolio
turso db show portfolio --url          # ได้ค่า TURSO_DATABASE_URL
turso db tokens create portfolio       # ได้ค่า TURSO_AUTH_TOKEN
```

### 2. เอาโค้ดขึ้น GitHub

```bash
git init && git add . && git commit -m "แฟ้มสะสมผลงานครู วPA"
git branch -M main
git remote add origin https://github.com/<ชื่อผู้ใช้>/<repo>.git
git push -u origin main
```

### 3. เชื่อม Netlify

[app.netlify.com](https://app.netlify.com) → Add new site → Import from GitHub → เลือก repo
คำสั่ง build อ่านจาก `netlify.toml` ให้อัตโนมัติ ไม่ต้องตั้งเอง

### 4. ตั้งค่า Environment variables

Site settings → Environment variables → ใส่ 3 ค่า

| ชื่อ | ค่า |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://...` จากขั้นที่ 1 |
| `TURSO_AUTH_TOKEN` | โทเคนจากขั้นที่ 1 |
| `AUTH_SECRET` | สุ่มใหม่ ห้ามใช้ซ้ำกับเว็บอื่น |

สร้าง `AUTH_SECRET` ด้วย

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

แล้วสั่ง **Deploy site** อีกครั้งให้ค่าใหม่มีผล

### 5. ติดตั้งระบบ

เปิด `https://ชื่อเว็บของคุณ.netlify.app/setup` → กรอกบัญชีผู้ดูแล → กดติดตั้ง

หน้านี้จะสร้างตารางทั้งหมด ใส่ข้อมูลตั้งต้นตามเกณฑ์ ว9/2564 และสร้างบัญชีให้
**เสร็จแล้วหน้านี้จะปิดตัวเองถาวร** ไม่ต้องลบไฟล์เอง

> ทำขั้นตอนนี้ทันทีหลัง deploy เสร็จ — ระหว่างที่ยังไม่มีบัญชีผู้ดูแล ใครที่รู้ที่อยู่เว็บก็เข้าไปตั้งบัญชีได้

ถ้าถนัดบรรทัดคำสั่งมากกว่า ใช้แบบนี้แทนได้

```bash
npm run setup
npm run setup -- --user=admin --pass=รหัสผ่าน --name="ชื่อครู" --demo
```

### ลืมรหัสผ่าน

```bash
npm run admin:create -- admin รหัสผ่านใหม่ "ชื่อ-สกุล"
```

---

## รูปภาพและไฟล์เอกสาร

ระบบนี้ **ไม่เก็บไฟล์เอง** ทุกอย่างแนบเป็นลิงก์จาก Google Drive

1. อัปโหลดไฟล์ขึ้น Google Drive ของคุณเอง
2. คลิกขวาที่ไฟล์ → แชร์ → เปลี่ยนเป็น **"ทุกคนที่มีลิงก์"**
3. ก๊อบลิงก์มาวางในช่องของหลังบ้าน — ระบบดึงรหัสไฟล์ให้เอง

> ⚠️ ไฟล์ต้องเป็นสาธารณะถึงจะแสดงบนเว็บได้
> **อย่านำเอกสารที่มีข้อมูลส่วนตัวของนักเรียนขึ้น** เพราะใครที่ได้ลิงก์ก็เปิดดูได้
>
> `lh3.googleusercontent.com` เป็นช่องทางที่ Google ไม่ได้ประกาศรองรับอย่างเป็นทางการ
> ถ้าวันหนึ่งถูกปิด ระบบเก็บแค่ "รหัสไฟล์" ไว้ในฐานข้อมูล จึงแก้ที่
> [`lib/media.ts`](lib/media.ts) ไฟล์เดียวได้โดยไม่ต้องแตะข้อมูล

---

## สำรองข้อมูล

```bash
turso db shell portfolio .dump > backup.sql
```

รูปกับไฟล์อยู่ใน Google Drive ของคุณเองอยู่แล้ว
