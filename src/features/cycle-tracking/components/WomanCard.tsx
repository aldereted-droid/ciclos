import Link from 'next/link'
import { calculateCycleState } from '../lib/cycle-calculator'
import { PHASE_CONTENT } from '../lib/phase-content'
import { PhaseBadge } from './PhaseBadge'
import type { WomanWithPeriods } from '../types'

function nextPeriodLabel(days: number | null): string {
  if (days === null) return ''
  if (days === 0) return 'Periodo esperado hoy'
  if (days < 0) return `Atrasado ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
  return `Proximo periodo en ${days} ${days === 1 ? 'dia' : 'dias'}`
}

export function WomanCard({ woman }: { woman: WomanWithPeriods }) {
  const state = calculateCycleState(woman.periods, woman.cycle_length, woman.period_length)
  const info = state.phase ? PHASE_CONTENT[state.phase] : null
  const progress =
    state.currentDay && state.status === 'ok'
      ? Math.min((state.currentDay / state.effectiveCycleLength) * 100, 100)
      : 0

  return (
    <Link
      href={`/cycles/${woman.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-lg font-semibold text-gray-900">{woman.name}</h3>
        <PhaseBadge state={state} />
      </div>

      {state.status === 'ok' && state.currentDay ? (
        <p className="mt-2 text-sm text-gray-600">
          Dia <span className="font-semibold text-gray-900">{state.currentDay}</span> de{' '}
          {state.effectiveCycleLength}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          {state.status === 'atrasado' && state.currentDay
            ? `Dia ${state.currentDay} — se esperaba el periodo el dia ${state.effectiveCycleLength}`
            : 'Registra un periodo para calcular la fase'}
        </p>
      )}

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${info ? info.color.dot : 'bg-gray-300'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{nextPeriodLabel(state.daysUntilNextPeriod)}</span>
        {state.isAverageFromHistory && (
          <span title="Calculado con el historial real de periodos">
            Promedio real: {state.effectiveCycleLength}d
          </span>
        )}
      </div>

      {info && <p className="mt-3 line-clamp-2 text-sm text-gray-600">{info.mood}</p>}
    </Link>
  )
}
