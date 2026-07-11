import { analyzeRegularity, type RegularityLevel } from '../lib/regularity'
import type { Period } from '../types'

const LEVEL_STYLE: Record<Exclude<RegularityLevel, 'sin-datos'>, { label: string; className: string }> = {
  regular: { label: 'Regular', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'poco-regular': {
    label: 'Poco regular',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  irregular: { label: 'Irregular', className: 'bg-red-50 text-red-700 border-red-200' },
}

export function RegularityPanel({ periods }: { periods: Period[] }) {
  const analysis = analyzeRegularity(periods)

  if (analysis.level === 'sin-datos' && analysis.cyclesMeasured === 0) {
    return null
  }

  const style = analysis.level !== 'sin-datos' ? LEVEL_STYLE[analysis.level] : null

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900">Regularidad del ciclo</h2>
        {style && (
          <span className={`rounded-full border px-3 py-1 text-sm font-medium ${style.className}`}>
            {style.label}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Ciclos medidos</p>
          <p className="text-lg font-semibold text-gray-900">{analysis.cyclesMeasured}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Promedio</p>
          <p className="text-lg font-semibold text-gray-900">
            {analysis.averageCycle ?? '—'}
            {analysis.averageCycle ? <span className="text-sm font-normal"> d</span> : null}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Mas corto</p>
          <p className="text-lg font-semibold text-gray-900">
            {analysis.shortestCycle ?? '—'}
            {analysis.shortestCycle ? <span className="text-sm font-normal"> d</span> : null}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Mas largo</p>
          <p className="text-lg font-semibold text-gray-900">
            {analysis.longestCycle ?? '—'}
            {analysis.longestCycle ? <span className="text-sm font-normal"> d</span> : null}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {analysis.flags.map((flag) => (
          <li
            key={flag.message}
            className={`rounded-lg p-3 text-sm ${
              flag.severity === 'atencion'
                ? 'bg-amber-50 text-amber-900'
                : 'bg-gray-50 text-gray-700'
            }`}
          >
            {flag.message}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-gray-500">
        Esto describe lo que muestran los datos cargados. No es un diagnostico.
      </p>
    </div>
  )
}
