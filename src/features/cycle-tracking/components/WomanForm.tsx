'use client'

import { useActionState } from 'react'
import { createWoman, type ActionResult } from '../services/actions'
import { DEFAULT_CYCLE_LENGTH, DEFAULT_PERIOD_LENGTH } from '../lib/cycle-calculator'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>
}

export function WomanForm() {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(createWoman, {})
  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Nombre
        </label>
        <input id="name" name="name" required maxLength={80} className={inputClass} />
        <FieldError errors={state.fieldErrors?.name} />
      </div>

      <div>
        <label htmlFor="lastPeriodStart" className="text-sm font-medium text-gray-700">
          Inicio del ultimo periodo
        </label>
        <input
          id="lastPeriodStart"
          name="lastPeriodStart"
          type="date"
          required
          max={today}
          className={inputClass}
        />
        <FieldError errors={state.fieldErrors?.lastPeriodStart} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="cycleLength" className="text-sm font-medium text-gray-700">
            Duracion del ciclo
          </label>
          <input
            id="cycleLength"
            name="cycleLength"
            type="number"
            min={21}
            max={40}
            defaultValue={DEFAULT_CYCLE_LENGTH}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">
            Estimado. Se ajusta solo con el historial.
          </p>
          <FieldError errors={state.fieldErrors?.cycleLength} />
        </div>

        <div>
          <label htmlFor="periodLength" className="text-sm font-medium text-gray-700">
            Duracion del periodo
          </label>
          <input
            id="periodLength"
            name="periodLength"
            type="number"
            min={2}
            max={10}
            defaultValue={DEFAULT_PERIOD_LENGTH}
            required
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">Dias de sangrado.</p>
          <FieldError errors={state.fieldErrors?.periodLength} />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Notas <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea id="notes" name="notes" rows={2} maxLength={500} className={inputClass} />
        <FieldError errors={state.fieldErrors?.notes} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar registro'}
      </button>
    </form>
  )
}
