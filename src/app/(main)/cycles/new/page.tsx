import Link from 'next/link'
import { WomanForm } from '@/features/cycle-tracking/components/WomanForm'

export const metadata = {
  title: 'Nuevo registro',
}

export default function NewWomanPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <Link href="/cycles" className="text-sm text-gray-500 transition hover:text-gray-900">
        &larr; Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Nuevo registro</h1>
      <p className="mt-1 text-sm text-gray-600">
        Con la fecha del ultimo periodo ya se puede calcular la fase actual.
      </p>

      <div className="mt-8">
        <WomanForm />
      </div>
    </div>
  )
}
