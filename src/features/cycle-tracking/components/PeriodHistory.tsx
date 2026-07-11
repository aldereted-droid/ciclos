'use client'

import { useActionState } from 'react'
import { addPeriod, deletePeriod, type ActionResult } from '../services/actions'
import { averageCycleLength } from '../lib/cycle-calculator'
import type { Period } from '../types'

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Dias entre este periodo y el anterior: hace visible la regularidad del ciclo. */
function gapFromPrevious(periods: Period[], index: number): number | null {
  const previous = periods[index + 1]
  if (!previous) return null
  const current = Date.parse(`${periods[index].start_date}T00:00:00Z`)
  const prev = Date.parse(`${previous.start_date}T00:00:00Z`)
  return Math.round((current - prev) / 86_400_000)
}

export function PeriodHistory({
  womanId,
  periods,
}: {
  womanId: string
  periods: Period[]
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(addPeriod, {})
  const average = averageCycleLength(periods)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Historial de periodos</h2>
        <span className="text-sm text-gray-500">
          {periods.length} {periods.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {average !== null ? (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Ciclo promedio real: <strong>{average} dias</strong> — calculado con su historial.
        </p>
      ) : (
        <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Con 2 o mas periodos se calcula su ciclo promedio real y las predicciones mejoran.
        </p>
      )}

      <form action={formAction} className="mt-4 flex flex-wrap items-start gap-2">
        <input type="hidden" name="womanId" value={womanId} />
        <div className="flex-1">
          <input
            name="startDate"
            type="date"
            required
            max={today}
            aria-label="Inicio del nuevo periodo"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
          {state.fieldErrors?.startDate && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.startDate[0]}</p>
          )}
          {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Registrar periodo'}
        </button>
      </form>

      <ul className="mt-4 divide-y divide-gray-100">
        {periods.map((period, index) => {
          const gap = gapFromPrevious(periods, index)
          return (
            <li key={period.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-sm text-gray-900">{formatDate(period.start_date)}</span>
                {index === 0 && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    mas reciente
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {gap !== null && (
                  <span className="text-xs text-gray-500">{gap} dias del anterior</span>
                )}
                <button
                  type="button"
                  onClick={() => deletePeriod(period.id, womanId)}
                  aria-label={`Eliminar periodo del ${formatDate(period.start_date)}`}
                  className="text-xs text-gray-400 transition hover:text-red-600"
                >
                  Eliminar
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
