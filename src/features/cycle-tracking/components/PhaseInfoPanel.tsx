import { PHASE_CONTENT, PHASE_ORDER, MEDICAL_DISCLAIMER } from '../lib/phase-content'
import type { CyclePhase } from '../types'

function PhaseSection({ phase, isCurrent }: { phase: CyclePhase; isCurrent: boolean }) {
  const info = PHASE_CONTENT[phase]

  return (
    <div
      className={`rounded-xl border p-5 ${
        isCurrent ? `${info.color.bg} ${info.color.border}` : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${info.color.dot}`} />
        <h3 className={`font-semibold ${isCurrent ? info.color.text : 'text-gray-900'}`}>
          {info.label}
        </h3>
        {isCurrent && (
          <span className={`rounded-full bg-white px-2 py-0.5 text-xs font-bold ${info.color.text}`}>
            AHORA
          </span>
        )}
      </div>

      <p className="mt-1 text-sm italic text-gray-500">{info.tagline}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Hormonas</p>
      <p className="text-sm text-gray-700">{info.hormones}</p>

      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Estado de animo</p>
      <p className="text-sm text-gray-700">{info.mood}</p>

      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Energia</p>
      <p className="text-sm text-gray-700">{info.energy}</p>

      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Sintomas frecuentes</p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {info.symptoms.map((symptom) => (
          <li
            key={symptom}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
          >
            {symptom}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">Que ayuda</p>
      <ul className="mt-1 space-y-1">
        {info.tips.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-gray-700">
            <span className="text-gray-400">-</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PhaseInfoPanel({ currentPhase }: { currentPhase: CyclePhase | null }) {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PHASE_ORDER.map((phase) => (
          <PhaseSection key={phase} phase={phase} isCurrent={phase === currentPhase} />
        ))}
      </div>

      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
        <strong>Aviso:</strong> {MEDICAL_DISCLAIMER}
      </p>
    </div>
  )
}
