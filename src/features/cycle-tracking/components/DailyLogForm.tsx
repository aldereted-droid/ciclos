'use client'

import { useActionState, useState } from 'react'
import { saveDailyLog, type ActionResult } from '../services/actions'
import { TRACKABLE_SYMPTOMS } from '../lib/insights'
import type { DailyLog } from '../types'

const SCALE = [1, 2, 3, 4, 5]
const MOOD_HINT: Record<number, string> = {
  1: 'Muy bajo',
  2: 'Bajo',
  3: 'Normal',
  4: 'Bueno',
  5: 'Muy bueno',
}

function ScalePicker({
  name,
  label,
  value,
  onChange,
}: {
  name: string
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {value ? MOOD_HINT[value] : 'Sin registrar'}
        </span>
      </div>
      {/* El valor viaja en un hidden: los botones son solo la UI de seleccion. */}
      <input type="hidden" name={name} value={value ?? ''} />
      <div className="mt-1 flex gap-1.5">
        {SCALE.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label} ${n} de 5`}
            aria-pressed={value === n}
            // Volver a tocar el mismo valor lo deselecciona: "no registrado" != 1.
            onClick={() => onChange(value === n ? null : n)}
            className={`h-9 flex-1 rounded-lg border text-sm font-medium transition ${
              value === n
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DailyLogForm({
  womanId,
  existingToday,
}: {
  womanId: string
  existingToday: DailyLog | null
}) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(saveDailyLog, {})

  const [mood, setMood] = useState<number | null>(existingToday?.mood ?? null)
  const [energy, setEnergy] = useState<number | null>(existingToday?.energy ?? null)
  const [symptoms, setSymptoms] = useState<string[]>(existingToday?.symptoms ?? [])

  const today = new Date().toISOString().slice(0, 10)

  function toggleSymptom(symptom: string) {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom]
    )
  }

  return (
    <form action={formAction} className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">Como se siente hoy?</h2>
        {existingToday && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            Ya registrado hoy — se actualiza
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Cuanto mas registres, mejor conoce la app sus patrones reales.
      </p>

      <input type="hidden" name="womanId" value={womanId} />
      <input type="hidden" name="logDate" value={today} />

      {state.error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ScalePicker name="mood" label="Animo" value={mood} onChange={setMood} />
        <ScalePicker name="energy" label="Energia" value={energy} onChange={setEnergy} />
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium text-gray-700">Sintomas</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TRACKABLE_SYMPTOMS.map((symptom) => {
            const selected = symptoms.includes(symptom)
            return (
              <button
                key={symptom}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSymptom(symptom)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? 'border-rose-300 bg-rose-100 text-rose-800'
                    : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                }`}
              >
                {symptom}
              </button>
            )
          })}
        </div>
        {symptoms.map((symptom) => (
          <input key={symptom} type="hidden" name="symptoms" value={symptom} />
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Nota del dia <span className="text-gray-400">(opcional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={existingToday?.notes ?? ''}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : existingToday ? 'Actualizar registro de hoy' : 'Guardar como se siente hoy'}
      </button>
    </form>
  )
}
