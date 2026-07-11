import { buildInsights } from '../lib/insights'
import { PHASE_CONTENT } from '../lib/phase-content'
import type { DailyLog, Period } from '../types'

function Bar({ value, label }: { value: number | null; label: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">
          {value !== null ? `${value} / 5` : '—'}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        {value !== null && (
          <div
            className="h-full rounded-full bg-gray-900"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

export function InsightsPanel({
  logs,
  periods,
  cycleLength,
  periodLength,
}: {
  logs: DailyLog[]
  periods: Period[]
  cycleLength: number
  periodLength: number
}) {
  const insights = buildInsights(logs, periods, cycleLength, periodLength)

  if (insights.totalLogs === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <p className="font-medium text-gray-900">Todavia no hay patrones</p>
        <p className="mt-1 text-sm text-gray-600">
          Registra como se siente cada dia. Con unos pocos registros por fase, la app empieza a
          mostrar sus patrones reales en vez de informacion generica.
        </p>
      </div>
    )
  }

  const hardest = insights.hardestPhase ? PHASE_CONTENT[insights.hardestPhase] : null
  const best = insights.bestPhase ? PHASE_CONTENT[insights.bestPhase] : null

  return (
    <div>
      {hardest && best && hardest.phase !== best.phase && (
        <p className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Segun sus propios registros, su animo es mas bajo en{' '}
          <strong className={hardest.color.text}>{hardest.label}</strong> y mas alto en{' '}
          <strong className={best.color.text}>{best.label}</strong>.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {insights.byPhase.map((insight) => {
          const info = PHASE_CONTENT[insight.phase]

          return (
            <div
              key={insight.phase}
              className={`rounded-xl border p-4 ${
                insight.hasEnoughData ? `${info.color.bg} ${info.color.border}` : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${info.color.dot}`} />
                  <h3 className="text-sm font-semibold text-gray-900">{info.label}</h3>
                </div>
                <span className="text-xs text-gray-500">
                  {insight.logCount} {insight.logCount === 1 ? 'dia' : 'dias'}
                </span>
              </div>

              {insight.hasEnoughData ? (
                <>
                  <div className="mt-3 space-y-2">
                    <Bar value={insight.averageMood} label="Animo promedio" />
                    <Bar value={insight.averageEnergy} label="Energia promedio" />
                  </div>

                  {insight.topSymptoms.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        Sus sintomas mas frecuentes
                      </p>
                      <ul className="mt-1 space-y-1">
                        {insight.topSymptoms.map((s) => (
                          <li key={s.symptom} className="flex justify-between text-xs">
                            <span className="text-gray-700">{s.symptom}</span>
                            <span className="text-gray-500">
                              {Math.round(s.ratio * 100)}% de los dias
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 text-xs text-gray-500">
                  {insight.logCount === 0
                    ? 'Sin registros en esta fase todavia.'
                    : `Solo ${insight.logCount} ${insight.logCount === 1 ? 'registro' : 'registros'}. Hacen falta 3 para mostrar un patron confiable.`}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Estos numeros salen de {insights.totalLogs}{' '}
        {insights.totalLogs === 1 ? 'registro diario' : 'registros diarios'} cruzados con la fase
        que atravesaba cada dia. No mostramos promedios con menos de 3 dias por fase.
      </p>
    </div>
  )
}
