import type { CyclePhase, CycleState, PhaseRange, Period } from '../types'

/** La fase lutea dura ~14 dias y es la mas estable entre mujeres. Por eso la
 *  ovulacion se ancla al FINAL del ciclo, no al dia 14 fijo: en un ciclo de 35
 *  dias se ovula cerca del dia 21, no del 14. */
const LUTEAL_PHASE_DAYS = 14

/** Intervalos fuera de este rango se descartan del promedio: son datos mal
 *  cargados (un periodo salteado, un typo) y arruinarian la prediccion. */
const MIN_PLAUSIBLE_INTERVAL = 15
const MAX_PLAUSIBLE_INTERVAL = 60

export const DEFAULT_CYCLE_LENGTH = 28
export const DEFAULT_PERIOD_LENGTH = 5

/** Parsea 'yyyy-mm-dd' como medianoche UTC. Usar el constructor Date() directo
 *  interpreta la fecha en la timezone local y desplaza el dia (off-by-one). */
function parseDateOnly(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Hoy, normalizado a medianoche UTC, para comparar contra fechas DATE sin hora. */
function todayUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

const MS_PER_DAY = 86_400_000

export function daysBetween(from: string, to: Date = todayUtc()): number {
  return Math.round((to.getTime() - parseDateOnly(from).getTime()) / MS_PER_DAY)
}

function addDays(from: string, days: number): string {
  const result = new Date(parseDateOnly(from).getTime() + days * MS_PER_DAY)
  return toDateOnlyString(result)
}

/** Periodos ordenados del mas reciente al mas antiguo. */
function sortByStartDesc(periods: Period[]): Period[] {
  return [...periods].sort((a, b) => b.start_date.localeCompare(a.start_date))
}

/**
 * Duracion real del ciclo, promediando los dias entre inicios consecutivos.
 * Devuelve null si no hay al menos 2 periodos con un intervalo plausible.
 */
export function averageCycleLength(periods: Period[]): number | null {
  const sorted = sortByStartDesc(periods)
  if (sorted.length < 2) return null

  const intervals: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = daysBetween(sorted[i + 1].start_date, parseDateOnly(sorted[i].start_date))
    if (gap >= MIN_PLAUSIBLE_INTERVAL && gap <= MAX_PLAUSIBLE_INTERVAL) {
      intervals.push(gap)
    }
  }
  if (intervals.length === 0) return null

  const mean = intervals.reduce((sum, n) => sum + n, 0) / intervals.length
  return Math.round(mean)
}

/**
 * Las 4 fases con sus rangos de dias, escaladas a la duracion real del ciclo.
 * Los rangos nunca se solapan ni dejan huecos: cubren 1..cycleLength completo.
 */
export function buildPhaseRanges(cycleLength: number, periodLength: number): PhaseRange[] {
  // La menstruacion no puede comerse el ciclo entero.
  const menstrualEnd = Math.min(periodLength, cycleLength - 4)

  const ovulationDay = cycleLength - LUTEAL_PHASE_DAYS
  // Ventana fertil de 3 dias centrada en la ovulacion, siempre despues del periodo.
  const ovulationStart = Math.max(ovulationDay - 1, menstrualEnd + 1)
  const ovulationEnd = Math.min(ovulationStart + 2, cycleLength)

  const follicularStart = menstrualEnd + 1
  const follicularEnd = ovulationStart - 1

  const ranges: PhaseRange[] = [
    { phase: 'menstrual', startDay: 1, endDay: menstrualEnd },
  ]

  // En ciclos muy cortos la folicular puede quedar vacia; se omite en vez de invertirse.
  if (follicularEnd >= follicularStart) {
    ranges.push({ phase: 'folicular', startDay: follicularStart, endDay: follicularEnd })
  }

  ranges.push({ phase: 'ovulacion', startDay: ovulationStart, endDay: ovulationEnd })

  if (cycleLength >= ovulationEnd + 1) {
    ranges.push({ phase: 'lutea', startDay: ovulationEnd + 1, endDay: cycleLength })
  }

  return ranges
}

export function phaseForDay(day: number, ranges: PhaseRange[]): CyclePhase | null {
  const match = ranges.find((r) => day >= r.startDay && day <= r.endDay)
  return match?.phase ?? null
}

/**
 * En que fase estaba en una fecha PASADA cualquiera. Sirve para cruzar los
 * registros diarios con la fase que estaba atravesando ese dia.
 * Devuelve null si esa fecha es anterior a todo periodo conocido.
 */
export function phaseOnDate(
  isoDate: string,
  periods: Period[],
  manualCycleLength: number = DEFAULT_CYCLE_LENGTH,
  periodLength: number = DEFAULT_PERIOD_LENGTH
): CyclePhase | null {
  // El periodo vigente es el ultimo que empezo en esa fecha o antes.
  const previous = periods
    .filter((p) => p.start_date <= isoDate)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0]

  if (!previous) return null

  const cycleLength = averageCycleLength(periods) ?? manualCycleLength
  const day = daysBetween(previous.start_date, parseDateOnly(isoDate)) + 1

  // Se paso del ciclo esperado: no sabemos en que fase estaba realmente.
  if (day < 1 || day > cycleLength) return null

  return phaseForDay(day, buildPhaseRanges(cycleLength, periodLength))
}

/**
 * Estado completo del ciclo de una mujer a partir de su historial de periodos.
 * La fase NUNCA se persiste: se deriva siempre para que no quede desactualizada.
 */
export function calculateCycleState(
  periods: Period[],
  manualCycleLength: number = DEFAULT_CYCLE_LENGTH,
  periodLength: number = DEFAULT_PERIOD_LENGTH,
  today: Date = todayUtc()
): CycleState {
  const average = averageCycleLength(periods)
  const effectiveCycleLength = average ?? manualCycleLength
  const isAverageFromHistory = average !== null
  const phaseRanges = buildPhaseRanges(effectiveCycleLength, periodLength)

  const base: Omit<CycleState, 'status'> = {
    currentDay: null,
    phase: null,
    effectiveCycleLength,
    isAverageFromHistory,
    daysUntilNextPeriod: null,
    nextPeriodDate: null,
    phaseRanges,
  }

  const sorted = sortByStartDesc(periods)
  const lastPeriod = sorted[0]
  if (!lastPeriod) {
    return { ...base, status: 'sin-datos' }
  }

  const elapsed = daysBetween(lastPeriod.start_date, today)

  // Fecha cargada a futuro: no inventamos una fase con dias negativos.
  if (elapsed < 0) {
    return { ...base, status: 'fecha-futura' }
  }

  const currentDay = elapsed + 1
  const nextPeriodDate = addDays(lastPeriod.start_date, effectiveCycleLength)
  const daysUntilNextPeriod = effectiveCycleLength - elapsed

  // Se paso de la duracion esperada sin registrar un nuevo periodo. No hacemos
  // modulo en silencio (mentiria diciendo "dia 3"): avisamos que esta atrasado.
  if (currentDay > effectiveCycleLength) {
    return {
      ...base,
      status: 'atrasado',
      currentDay,
      phase: 'lutea',
      daysUntilNextPeriod,
      nextPeriodDate,
    }
  }

  return {
    ...base,
    status: 'ok',
    currentDay,
    phase: phaseForDay(currentDay, phaseRanges),
    daysUntilNextPeriod,
    nextPeriodDate,
  }
}
