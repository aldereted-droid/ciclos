import type { Period } from '../types'

/**
 * Analisis de regularidad del ciclo.
 *
 * IMPORTANTE: esto NO diagnostica nada. Solo describe lo que muestran los datos
 * y sugiere consultar a un profesional cuando el patron se sale de lo habitual.
 * Los umbrales son los que usa la literatura clinica comun (FIGO/ACOG):
 *  - Ciclo normal: 21-35 dias
 *  - Variacion normal entre ciclos: hasta ~7-9 dias
 */

export type RegularityLevel = 'regular' | 'poco-regular' | 'irregular' | 'sin-datos'

export interface RegularityFlag {
  /** 'info' describe; 'atencion' sugiere consultar. Nunca diagnostica. */
  severity: 'info' | 'atencion'
  message: string
}

export interface RegularityAnalysis {
  level: RegularityLevel
  /** Cantidad de ciclos completos medidos (intervalos entre periodos). */
  cyclesMeasured: number
  shortestCycle: number | null
  longestCycle: number | null
  /** Diferencia entre el ciclo mas largo y el mas corto: la medida clave. */
  variationDays: number | null
  averageCycle: number | null
  flags: RegularityFlag[]
}

const MIN_PLAUSIBLE_INTERVAL = 15
const MAX_PLAUSIBLE_INTERVAL = 60

/** Umbrales clinicos habituales. */
const NORMAL_CYCLE_MIN = 21
const NORMAL_CYCLE_MAX = 35
const REGULAR_VARIATION_MAX = 7
const IRREGULAR_VARIATION_MIN = 9

/** Intervalos en dias entre inicios de periodos consecutivos, del mas viejo al mas nuevo. */
export function cycleIntervals(periods: Period[]): number[] {
  const sorted = [...periods].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const intervals: number[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    const from = Date.parse(`${sorted[i].start_date}T00:00:00Z`)
    const to = Date.parse(`${sorted[i + 1].start_date}T00:00:00Z`)
    const gap = Math.round((to - from) / 86_400_000)
    if (gap >= MIN_PLAUSIBLE_INTERVAL && gap <= MAX_PLAUSIBLE_INTERVAL) {
      intervals.push(gap)
    }
  }
  return intervals
}

export function analyzeRegularity(periods: Period[]): RegularityAnalysis {
  const intervals = cycleIntervals(periods)

  const empty: RegularityAnalysis = {
    level: 'sin-datos',
    cyclesMeasured: intervals.length,
    shortestCycle: null,
    longestCycle: null,
    variationDays: null,
    averageCycle: null,
    flags: [],
  }

  // Con un solo intervalo no hay variacion que medir: no opinamos sobre regularidad.
  if (intervals.length === 0) return empty
  if (intervals.length === 1) {
    return {
      ...empty,
      shortestCycle: intervals[0],
      longestCycle: intervals[0],
      averageCycle: intervals[0],
      flags: [
        {
          severity: 'info',
          message:
            'Con un solo ciclo medido todavia no se puede evaluar la regularidad. Carga mas periodos.',
        },
      ],
    }
  }

  const shortest = Math.min(...intervals)
  const longest = Math.max(...intervals)
  const variation = longest - shortest
  const average = Math.round(intervals.reduce((sum, n) => sum + n, 0) / intervals.length)

  const level: RegularityLevel =
    variation <= REGULAR_VARIATION_MAX
      ? 'regular'
      : variation >= IRREGULAR_VARIATION_MIN
        ? 'irregular'
        : 'poco-regular'

  const flags: RegularityFlag[] = []

  if (level === 'regular') {
    flags.push({
      severity: 'info',
      message: `Ciclo regular: varia ${variation} ${variation === 1 ? 'dia' : 'dias'} entre el mas corto y el mas largo. Las predicciones van a ser confiables.`,
    })
  } else {
    flags.push({
      severity: 'atencion',
      message: `Sus ciclos varian ${variation} dias (del mas corto de ${shortest} al mas largo de ${longest}). Una variacion mayor a ${REGULAR_VARIATION_MAX} dias hace que las predicciones sean orientativas. Si se mantiene asi, conviene comentarlo con un profesional.`,
    })
  }

  if (shortest < NORMAL_CYCLE_MIN) {
    flags.push({
      severity: 'atencion',
      message: `Registramos un ciclo de ${shortest} dias. Los ciclos menores a ${NORMAL_CYCLE_MIN} dias se salen del rango habitual: vale la pena consultarlo.`,
    })
  }

  if (longest > NORMAL_CYCLE_MAX) {
    flags.push({
      severity: 'atencion',
      message: `Registramos un ciclo de ${longest} dias. Los ciclos mayores a ${NORMAL_CYCLE_MAX} dias se salen del rango habitual: vale la pena consultarlo.`,
    })
  }

  if (intervals.length < 3) {
    flags.push({
      severity: 'info',
      message: 'Con 3 o mas ciclos medidos el analisis gana precision.',
    })
  }

  return {
    level,
    cyclesMeasured: intervals.length,
    shortestCycle: shortest,
    longestCycle: longest,
    variationDays: variation,
    averageCycle: average,
    flags,
  }
}
