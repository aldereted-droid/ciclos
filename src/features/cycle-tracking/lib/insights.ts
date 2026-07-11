import { phaseOnDate } from './cycle-calculator'
import { PHASE_ORDER } from './phase-content'
import type { CyclePhase, DailyLog, Period } from '../types'

/**
 * Patrones REALES de una mujer, cruzando sus registros diarios con la fase en la
 * que estaba cada dia. Esto es lo que diferencia la app de una tabla generica:
 * deja de decir "en la fase lutea suele haber irritabilidad" y pasa a decir
 * "a ella, en fase lutea, el animo le baja a 2.3 y le duele la cabeza el 80% de los dias".
 *
 * Con pocos datos NO opinamos: preferimos callar antes que inventar un patron.
 */

/** Debajo de esto, una media no es informativa: es ruido. */
const MIN_LOGS_PER_PHASE = 3
/** Un sintoma tiene que repetirse para ser un patron, no una casualidad. */
const MIN_SYMPTOM_OCCURRENCES = 2
/** Un sintoma se destaca si aparece en al menos la mitad de los dias de esa fase. */
const FREQUENT_SYMPTOM_RATIO = 0.5

export interface SymptomFrequency {
  symptom: string
  count: number
  /** Proporcion de dias de esa fase en los que aparecio (0-1). */
  ratio: number
}

export interface PhaseInsight {
  phase: CyclePhase
  logCount: number
  /** null si no hay suficientes registros para promediar. */
  averageMood: number | null
  averageEnergy: number | null
  topSymptoms: SymptomFrequency[]
  /** true si hay suficientes datos para tomarse en serio este resumen. */
  hasEnoughData: boolean
}

export interface InsightsSummary {
  totalLogs: number
  byPhase: PhaseInsight[]
  /** Fase con el animo promedio mas bajo (solo si hay datos suficientes). */
  hardestPhase: CyclePhase | null
  /** Fase con el animo promedio mas alto. */
  bestPhase: CyclePhase | null
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10
}

export function buildInsights(
  logs: DailyLog[],
  periods: Period[],
  manualCycleLength: number,
  periodLength: number
): InsightsSummary {
  // Agrupamos cada registro diario bajo la fase que ella atravesaba ese dia.
  const logsByPhase = new Map<CyclePhase, DailyLog[]>()

  for (const log of logs) {
    const phase = phaseOnDate(log.log_date, periods, manualCycleLength, periodLength)
    if (!phase) continue
    const bucket = logsByPhase.get(phase) ?? []
    bucket.push(log)
    logsByPhase.set(phase, bucket)
  }

  const byPhase: PhaseInsight[] = PHASE_ORDER.map((phase) => {
    const phaseLogs = logsByPhase.get(phase) ?? []
    const hasEnoughData = phaseLogs.length >= MIN_LOGS_PER_PHASE

    const moods = phaseLogs.map((l) => l.mood).filter((m): m is number => m !== null)
    const energies = phaseLogs.map((l) => l.energy).filter((e): e is number => e !== null)

    const counts = new Map<string, number>()
    for (const log of phaseLogs) {
      for (const symptom of log.symptoms) {
        counts.set(symptom, (counts.get(symptom) ?? 0) + 1)
      }
    }

    const topSymptoms: SymptomFrequency[] = [...counts.entries()]
      .filter(([, count]) => count >= MIN_SYMPTOM_OCCURRENCES)
      .map(([symptom, count]) => ({
        symptom,
        count,
        ratio: count / phaseLogs.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      phase,
      logCount: phaseLogs.length,
      // Sin datos suficientes devolvemos null: un promedio de 1 dia no es un patron.
      averageMood: hasEnoughData ? mean(moods) : null,
      averageEnergy: hasEnoughData ? mean(energies) : null,
      topSymptoms,
      hasEnoughData,
    }
  })

  const comparable = byPhase.filter(
    (p): p is PhaseInsight & { averageMood: number } =>
      p.hasEnoughData && p.averageMood !== null
  )

  // Solo comparamos fases si hay al menos dos con datos serios.
  const hardestPhase =
    comparable.length >= 2
      ? comparable.reduce((min, p) => (p.averageMood < min.averageMood ? p : min)).phase
      : null
  const bestPhase =
    comparable.length >= 2
      ? comparable.reduce((max, p) => (p.averageMood > max.averageMood ? p : max)).phase
      : null

  return {
    totalLogs: logs.length,
    byPhase,
    hardestPhase,
    bestPhase,
  }
}

/** Sintomas sugeridos en la UI. Union de los tipicos de todas las fases. */
export const TRACKABLE_SYMPTOMS = [
  'Colicos',
  'Dolor de cabeza',
  'Cansancio',
  'Hinchazon',
  'Senos sensibles',
  'Antojos',
  'Acne',
  'Irritabilidad',
  'Ansiedad',
  'Insomnio',
  'Dolor lumbar',
  'Nauseas',
] as const
