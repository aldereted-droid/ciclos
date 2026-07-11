import Link from 'next/link'
import { getWomenWithPeriods } from '@/features/cycle-tracking/services/womenService'
import { WomanCard } from '@/features/cycle-tracking/components/WomanCard'

export const metadata = {
  title: 'Ciclos',
}

export default async function CyclesPage() {
  const women = await getWomenWithPeriods()

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ciclos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Fase actual de cada persona registrada, calculada con su historial.
          </p>
        </div>
        <Link
          href="/cycles/new"
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Agregar registro
        </Link>
      </header>

      {women.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="font-medium text-gray-900">Todavia no hay registros</p>
          <p className="mt-1 text-sm text-gray-600">
            Agrega el primero para ver en que fase del ciclo se encuentra.
          </p>
          <Link
            href="/cycles/new"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Agregar registro
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {women.map((woman) => (
            <WomanCard key={woman.id} woman={woman} />
          ))}
        </div>
      )}
    </div>
  )
}
