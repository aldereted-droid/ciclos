import { PHASE_CONTENT } from '../lib/phase-content'
import type { CycleState } from '../types'

const STATUS_LABEL: Record<Exclude<CycleState['status'], 'ok'>, string> = {
  atrasado: 'Periodo atrasado',
  'sin-datos': 'Sin periodos cargados',
  'fecha-futura': 'Fecha en el futuro',
}

export function PhaseBadge({ state }: { state: CycleState }) {
  if (state.status !== 'ok' || !state.phase) {
    const isLate = state.status === 'atrasado'
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
          isLate
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${isLate ? 'bg-red-500' : 'bg-gray-400'}`} />
        {STATUS_LABEL[state.status as Exclude<CycleState['status'], 'ok'>]}
      </span>
    )
  }

  const info = PHASE_CONTENT[state.phase]

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${info.color.bg} ${info.color.text} ${info.color.border}`}
    >
      <span className={`h-2 w-2 rounded-full ${info.color.dot}`} />
      {info.label}
    </span>
  )
}
