import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * ด่านแรก — กันคนที่ยังไม่ล็อกอินออกจาก /admin ทั้งหมด
 *
 * หมายเหตุสำคัญ: middleware เป็นแค่ด่านแรกเพื่อความสะดวก (เด้งไปหน้าล็อกอิน)
 * ไม่ใช่ระบบความปลอดภัยหลัก — ทุก Server Action ที่เขียนข้อมูล
 * ต้องเรียก requireAdmin() ของตัวเองเสมอ
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('vpa_session')?.value
  let ok = false
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET))
      ok = true
    } catch { ok = false }
  }
  if (!ok) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
