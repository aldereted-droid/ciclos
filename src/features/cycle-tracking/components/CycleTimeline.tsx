import { PHASE_CONTENT } from '../lib/phase-content'
import type { CycleState } from '../types'

/** Barra con las 4 fases proporcionales al ciclo y un marcador del dia actual. */
export function CycleTimeline({ state }: { state: CycleState }) {
  const { phaseRanges, effectiveCycleLength, currentDay, status } = state

  const markerPercent =
    currentDay && status === 'ok'
      ? Math.min(((currentDay - 0.5) / effectiveCycleLength) * 100, 100)
      : null

  return (
    <div>
      <div className="relative">
        <div className="flex h-10 w-full overflow-hidden rounded-lg">
          {phaseRanges.map((range) => {
            const info = PHASE_CONTENT[range.phase]
            const days = range.endDay - range.startDay + 1
            const width = (days / effectiveCycleLength) * 100
            const isCurrent = state.phase === range.phase && status === 'ok'

            return (
              <div
                key={range.phase}
                style={{ width: `${width}%` }}
                title={`${info.label}: dias ${range.startDay}-${range.endDay}`}
                className={`flex items-center justify-center ${info.color.dot} ${
                  isCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <span className="truncate px-1 text-[10px] font-semibold text-white">
                  {days > 2 ? range.startDay : ''}
                </span>
              </div>
            )
          })}
        </div>

        {markerPercent !== null && (
          <div
            className="absolute -top-1 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${markerPercent}%` }}
          >
            <div className="h-12 w-0.5 bg-gray-900" />
            <span className="mt-1 whitespace-nowrap rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Dia {currentDay}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-x-4 gap-y-1">
        {phaseRanges.map((range) => {
          const info = PHASE_CONTENT[range.phase]
          return (
            <span key={range.phase} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`h-2 w-2 rounded-full ${info.color.dot}`} />
              {info.label} ({range.startDay}-{range.endDay})
            </span>
          )
        })}
      </div>
    </div>
  )
}
