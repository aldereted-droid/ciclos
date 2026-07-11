import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWomanWithPeriods } from '@/features/cycle-tracking/services/womenService'
import { WomanEditForm } from '@/features/cycle-tracking/components/WomanEditForm'

export const metadata = { title: 'Editar registro' }

export default async function EditWomanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const woman = await getWomanWithPeriods(id)
  if (!woman) notFound()

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link
        href={`/cycles/${woman.id}`}
        className="text-sm text-gray-500 transition hover:text-gray-900"
      >
        &larr; Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Editar {woman.name}</h1>
      <p className="mt-1 text-sm text-gray-600">
        Los periodos se gestionan desde el detalle, no desde aca.
      </p>

      <div className="mt-8">
        <WomanEditForm woman={woman} />
      </div>
    </div>
  )
}
