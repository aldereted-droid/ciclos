import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PHASE_CONTENT, PHASE_ORDER } from '@/features/cycle-tracking/lib/phase-content'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si ya inicio sesion no tiene sentido mostrarle la portada.
  if (user) redirect('/cycles')

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900">Ciclos</h1>
      <p className="mt-4 text-lg text-gray-600">
        Sabe en que fase del ciclo esta cada persona que registres, y que esperar de esa fase:
        energia, animo y sintomas frecuentes.
      </p>
      <p className="mt-3 text-gray-600">
        No asume que todos los ciclos duran 28 dias. Aprende la duracion real de cada mujer a
        partir de su historial y ajusta las predicciones sola.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/signup"
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Entrar
        </Link>
      </div>

      <section className="mt-16">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          Las 4 fases
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PHASE_ORDER.map((phase) => {
            const info = PHASE_CONTENT[phase]
            return (
              <div
                key={phase}
                className={`rounded-xl border p-4 ${info.color.bg} ${info.color.border}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${info.color.dot}`} />
                  <h3 className={`font-semibold ${info.color.text}`}>{info.label}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-600">{info.tagline}</p>
              </div>
            )
          })}
        </div>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-gray-500">
        Informacion educativa. Cada mujer vive su ciclo de forma distinta. No sustituye consejo
        medico ni sirve como metodo anticonceptivo.
      </p>
    </main>
  )
}
