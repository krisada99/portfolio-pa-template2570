import { getIndicators } from '@/lib/queries'
import WorkForm from '@/components/admin/WorkForm'
import { saveWork } from '../actions'

export default async function NewWork({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const indicators = await getIndicators()

  async function create(f: FormData) {
    'use server'
    await saveWork(0, f)
  }

  return <WorkForm indicators={indicators} images={[]} files={[]} action={create} error={error} />
}
