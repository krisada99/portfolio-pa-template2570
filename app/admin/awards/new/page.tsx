import { requireAdmin } from '@/lib/auth'
import ItemForm from '@/components/admin/ItemForm'
import AwardFields from '@/components/admin/AwardFields'
import { saveAward } from '@/lib/item-actions'

export default async function NewAward({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const { error } = await searchParams
  async function create(f: FormData) { 'use server'; await saveAward(0, f) }
  return (
    <ItemForm
      heading="เพิ่มรางวัล" backHref="/admin/awards" backLabel="กลับรายการ"
      action={create} error={error}
      mainFields={<AwardFields />}
      coverName="image" coverLabel="รูปรางวัล / เกียรติบัตร"
      images={[]} files={[]}
    />
  )
}
