'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateWoman, deleteWoman, type ActionResult } from '../services/actions'
import type { Woman } from '../types'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <p className="mt-1 text-xs text-red-600">{errors[0]}</p>
}

export function WomanEditForm({ woman }: { woman: Woman }) {
  const router = useRouter()
  const [isDeleting, startDelete] = useTransition()

  // updateWoman necesita el id; lo fijamos antes de pasarlo a useActionState.
  const updateWithId = updateWoman.bind(null, woman.id)
  const [state, formAction, isSaving] = useActionState<ActionResult, FormData>(updateWithId, {})

  function handleDelete() {
    const confirmed = window.confirm(
      `Eliminar a ${woman.name}? Se borra tambien todo su historial de periodos. No se puede deshacer.`
    )
    if (!confirmed) return
    startDelete(async () => {
      await deleteWoman(woman.id)
    })
  }

  return (
    <div className="space-y-8">
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
          <input
            id="name"
            name="name"
            defaultValue={woman.name}
            required
            maxLength={80}
            className={inputClass}
          />
          <FieldError errors={state.fieldErrors?.name} />
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
              defaultValue={woman.cycle_length}
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">
              Solo se usa hasta tener 2 periodos cargados.
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
              defaultValue={woman.period_length}
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
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            defaultValue={woman.notes ?? ''}
            className={inputClass}
          />
          <FieldError errors={state.fieldErrors?.notes} />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/cycles/${woman.id}`)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-900">Eliminar registro</h2>
        <p className="mt-1 text-sm text-red-700">
          Se borra {woman.name} y todo su historial de periodos. No se puede deshacer.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
        </button>
      </div>
    </div>
  )
}
