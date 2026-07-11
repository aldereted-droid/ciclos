import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWomanWithPeriods } from '@/features/cycle-tracking/services/womenService'
import { calculateCycleState } from '@/features/cycle-tracking/lib/cycle-calculator'
import { PHASE_CONTENT } from '@/features/cycle-tracking/lib/phase-content'
import { CycleTimeline } from '@/features/cycle-tracking/components/CycleTimeline'
import { PhaseInfoPanel } from '@/features/cycle-tracking/components/PhaseInfoPanel'
import { PeriodHistory } from '@/features/cycle-tracking/components/PeriodHistory'
import { PhaseBadge } from '@/features/cycle-tracking/components/PhaseBadge'
import { RegularityPanel } from '@/features/cycle-tracking/components/RegularityPanel'
import { DailyLogForm } from '@/features/cycle-tracking/components/DailyLogForm'
import { InsightsPanel } from '@/features/cycle-tracking/components/InsightsPanel'
import { CycleCalendar } from '@/features/cycle-tracking/components/CycleCalendar'

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

export default async function WomanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const woman = await getWomanWithPeriods(id)
  if (!woman) notFound()

  const state = calculateCycleState(woman.periods, woman.cycle_length, woman.period_length)
  const info = state.phase ? PHASE_CONTENT[state.phase] : null

  const logs = woman.daily_logs ?? []
  const today = new Date().toISOString().slice(0, 10)
  const logToday = logs.find((log) => log.log_date === today) ?? null

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/cycles" className="text-sm text-gray-500 transition hover:text-gray-900">
        &larr; Volver
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{woman.name}</h1>
          {woman.notes && <p className="mt-1 text-sm text-gray-600">{woman.notes}</p>}
        </div>
        <div className="flex items-center gap-3">
          <PhaseBadge state={state} />
          <Link
            href={`/cycles/${woman.id}/edit`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            Editar
          </Link>
        </div>
      </header>

      {/* Resumen del estado actual */}
      <section className={`mt-6 rounded-xl border p-6 ${info ? `${info.color.bg} ${info.color.border}` : 'border-gray-200 bg-gray-50'}`}>
        {state.status === 'sin-datos' ? (
          <p className="text-gray-700">
            No hay periodos cargados. Registra uno abajo para calcular la fase.
          </p>
        ) : state.status === 'fecha-futura' ? (
          <p className="text-gray-700">
            El periodo cargado tiene fecha futura. Corregilo para calcular la fase.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-4xl font-bold text-gray-900">Dia {state.currentDay}</span>
              <span className="text-lg text-gray-500">de {state.effectiveCycleLength}</span>
              {info && (
                <span className={`text-lg font-semibold ${info.color.text}`}>
                  · {info.label}
                </span>
              )}
            </div>

            {state.status === 'atrasado' ? (
              <p className="mt-2 font-medium text-red-700">
                El periodo esta atrasado {Math.abs(state.daysUntilNextPeriod ?? 0)} dias. Si ya
                empezo, registralo abajo.
              </p>
            ) : (
              state.nextPeriodDate && (
                <p className="mt-2 text-sm text-gray-700">
                  {state.daysUntilNextPeriod === 0
                    ? 'Periodo esperado hoy.'
                    : `Proximo periodo estimado: ${formatDate(state.nextPeriodDate)} (en ${state.daysUntilNextPeriod} dias).`}
                </p>
              )
            )}

            <p className="mt-1 text-xs text-gray-500">
              {state.isAverageFromHistory
                ? `Calculado con su ciclo promedio real (${state.effectiveCycleLength} dias) segun el historial.`
                : `Calculado con la duracion estimada (${state.effectiveCycleLength} dias). Carga otro periodo para usar su promedio real.`}
            </p>
          </>
        )}
      </section>

      {state.status !== 'sin-datos' && state.status !== 'fecha-futura' && (
        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-6 font-semibold text-gray-900">Linea de tiempo del ciclo</h2>
          <CycleTimeline state={state} />
        </section>
      )}

      {state.status !== 'sin-datos' && (
        <section className="mt-8">
          <CycleCalendar
            periods={woman.periods}
            logs={logs}
            state={state}
            cycleLength={woman.cycle_length}
            periodLength={woman.period_length}
          />
        </section>
      )}

      <section className="mt-8">
        <DailyLogForm womanId={woman.id} existingToday={logToday} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">Sus patrones reales</h2>
        <InsightsPanel
          logs={logs}
          periods={woman.periods}
          cycleLength={woman.cycle_length}
          periodLength={woman.period_length}
        />
      </section>

      <section className="mt-8">
        <RegularityPanel periods={woman.periods} />
      </section>

      <section className="mt-8">
        <PeriodHistory womanId={woman.id} periods={woman.periods} />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 font-semibold text-gray-900">Las 4 fases del ciclo</h2>
        <PhaseInfoPanel currentPhase={state.phase} />
      </section>
    </div>
  )
}
