import { notFound } from 'next/navigation'
import { one } from '@/lib/db'
import { getDomains, getIndicators, getPaDetails, getPaChallenge } from '@/lib/queries'
import type { Agreement } from '@/lib/types'
import PaForm from '@/components/admin/PaForm'
import DeleteButton from '@/components/admin/DeleteButton'
import { saveAgreement, deleteAgreement } from '../actions'

export default async function EditAgreement({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params
  const { saved, error } = await searchParams
  const agId = Number(id)
  const agreement = await one<Agreement>(
    'SELECT * FROM pa_agreements WHERE id = ? AND deleted_at IS NULL', [agId])
  if (!agreement) notFound()

  const [domains, indicators, details, challenge] = await Promise.all([
    getDomains(), getIndicators(), getPaDetails(agId), getPaChallenge(agId),
  ])
  async function update(f: FormData) { 'use server'; await saveAgreement(agId, f) }
  async function remove() { 'use server'; await deleteAgreement(agId) }

  return (
    <PaForm
      agreement={agreement} domains={domains} indicators={indicators}
      details={details} challenge={challenge}
      action={update} saved={saved === '1'} error={error}
      deleteSlot={<DeleteButton action={remove} label="ลบข้อตกลง" confirmText={`ปีงบประมาณ ${agreement.fiscal_year}`} />}
    />
  )
}
