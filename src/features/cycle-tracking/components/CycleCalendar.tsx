import { phaseOnDate } from '../lib/cycle-calculator'
import { PHASE_CONTENT } from '../lib/phase-content'
import type { CycleState, DailyLog, Period } from '../types'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MS_PER_DAY = 86_400_000

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Lunes=0 ... Domingo=6, para alinear la grilla con el encabezado. */
function mondayFirstIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

interface DayCell {
  iso: string
  dayOfMonth: number
  isToday: boolean
  isPeriodDay: boolean
  isPredictedPeriod: boolean
  hasLog: boolean
  phase: ReturnType<typeof phaseOnDate>
}

function buildMonth(
  year: number,
  month: number,
  periods: Period[],
  logs: DailyLog[],
  state: CycleState,
  cycleLength: number,
  periodLength: number
): DayCell[] {
  const todayIso = toIso(new Date())
  const loggedDates = new Set(logs.map((l) => l.log_date))

  // Dias en los que estuvo menstruando: cada periodo dura period_length dias.
  const periodDays = new Set<string>()
  for (const period of periods) {
    const start = Date.parse(`${period.start_date}T00:00:00Z`)
    for (let i = 0; i < periodLength; i++) {
      periodDays.add(toIso(new Date(start + i * MS_PER_DAY)))
    }
  }

  // Proximo periodo estimado (aun no ocurrio): se dibuja punteado.
  const predictedDays = new Set<string>()
  if (state.nextPeriodDate) {
    const start = Date.parse(`${state.nextPeriodDate}T00:00:00Z`)
    for (let i = 0; i < periodLength; i++) {
      const iso = toIso(new Date(start + i * MS_PER_DAY))
      if (!periodDays.has(iso)) predictedDays.add(iso)
    }
  }

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: DayCell[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toIso(new Date(Date.UTC(year, month, day)))
    cells.push({
      iso,
      dayOfMonth: day,
      isToday: iso === todayIso,
      isPeriodDay: periodDays.has(iso),
      isPredictedPeriod: predictedDays.has(iso),
      hasLog: loggedDates.has(iso),
      phase: phaseOnDate(iso, periods, cycleLength, periodLength),
    })
  }

  return cells
}

export function CycleCalendar({
  periods,
  logs,
  state,
  cycleLength,
  periodLength,
}: {
  periods: Period[]
  logs: DailyLog[]
  state: CycleState
  cycleLength: number
  periodLength: number
}) {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  const cells = buildMonth(year, month, periods, logs, state, cycleLength, periodLength)
  const leadingBlanks = mondayFirstIndex(new Date(Date.UTC(year, month, 1)))

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="font-semibold capitalize text-gray-900">{monthLabel}</h2>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday, index) => (
          <div key={index} className="pb-1 text-center text-xs font-medium text-gray-400">
            {weekday}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {cells.map((cell) => {
          const info = cell.phase ? PHASE_CONTENT[cell.phase] : null

          return (
            <div
              key={cell.iso}
              title={info ? info.label : 'Sin datos'}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm ${
                cell.isPeriodDay
                  ? 'border-rose-300 bg-rose-100 font-semibold text-rose-800'
                  : cell.isPredictedPeriod
                    ? 'border-dashed border-rose-300 bg-white text-rose-500'
                    : info
                      ? `${info.color.bg} ${info.color.border} ${info.color.text}`
                      : 'border-gray-100 bg-white text-gray-400'
              } ${cell.isToday ? 'ring-2 ring-gray-900 ring-offset-1' : ''}`}
            >
              {cell.dayOfMonth}
              {cell.hasLog && (
                <span
                  title="Tiene registro de ese dia"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-gray-900"
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded border border-rose-300 bg-rose-100" />
          Periodo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded border border-dashed border-rose-300 bg-white" />
          Periodo estimado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded border border-violet-200 bg-violet-50" />
          Ventana fertil
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />
          Dia con registro
        </span>
      </div>
    </div>
  )
}
