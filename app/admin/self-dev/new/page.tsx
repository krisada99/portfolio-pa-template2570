import ItemForm from '@/components/admin/ItemForm'
import SelfDevFields from '@/components/admin/SelfDevFields'
import { saveSelfDev } from '@/lib/item-actions'
import { currentAcademicYear } from '@/lib/theme'

export default async function NewSelfDev({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  async function create(f: FormData) { 'use server'; await saveSelfDev(0, f) }
  return (
    <ItemForm
      heading="เพิ่มการพัฒนาตนเอง" backHref="/admin/self-dev" backLabel="กลับรายการ"
      action={create} error={error}
      mainFields={<SelfDevFields fiscalYear={currentAcademicYear() + 1} />}
      coverName="cert" coverLabel="เกียรติบัตร / วุฒิบัตร"
      images={[]} files={[]}
    />
  )
}
