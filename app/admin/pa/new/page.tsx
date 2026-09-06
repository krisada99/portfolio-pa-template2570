import { getDomains, getIndicators } from '@/lib/queries'
import PaForm from '@/components/admin/PaForm'
import { saveAgreement } from '../actions'

export default async function NewAgreement({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const [domains, indicators] = await Promise.all([getDomains(), getIndicators()])
  async function create(f: FormData) { 'use server'; await saveAgreement(0, f) }
  return <PaForm domains={domains} indicators={indicators} details={[]} action={create} error={error} />
}
