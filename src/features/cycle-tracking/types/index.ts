export type CyclePhase = 'menstrual' | 'folicular' | 'ovulacion' | 'lutea'

/** Cuando la fase no se puede calcular todavia (fecha futura o sin periodos). */
export type CycleStatus = 'ok' | 'atrasado' | 'sin-datos' | 'fecha-futura'

export interface Woman {
  id: string
  user_id: string
  name: string
  /** Fallback manual. Si hay 2+ periodos se usa el promedio real del historial. */
  cycle_length: number
  period_length: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Period {
  id: string
  woman_id: string
  start_date: string
  created_at: string
}

export interface DailyLog {
  id: string
  woman_id: string
  log_date: string
  /** Escala 1-5. null = no se registro ese dia. */
  mood: number | null
  energy: number | null
  symptoms: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

/** Una mujer junto a su historial de periodos, ordenado del mas reciente al mas antiguo. */
export interface WomanWithPeriods extends Woman {
  periods: Period[]
  daily_logs?: DailyLog[]
}

export interface PhaseRange {
  phase: CyclePhase
  /** Dia del ciclo en que empieza la fase (1-indexado, inclusivo). */
  startDay: number
  /** Dia del ciclo en que termina la fase (inclusivo). */
  endDay: number
}

export interface CycleState {
  status: CycleStatus
  /** Dia actual del ciclo (1-indexado). null si no se puede calcular. */
  currentDay: number | null
  phase: CyclePhase | null
  /** Duracion usada para el calculo: promedio real si hay historial, si no la manual. */
  effectiveCycleLength: number
  /** true si effectiveCycleLength salio del historial y no del valor manual. */
  isAverageFromHistory: boolean
  /** Dias hasta el proximo periodo estimado. Negativo si esta atrasado. */
  daysUntilNextPeriod: number | null
  /** Fecha estimada del proximo periodo (ISO yyyy-mm-dd). */
  nextPeriodDate: string | null
  /** Las 4 fases con sus rangos de dias, escaladas a effectiveCycleLength. */
  phaseRanges: PhaseRange[]
}

export interface PhaseInfo {
  phase: CyclePhase
  label: string
  /** Nombre coloquial para que se entienda de un vistazo. */
  tagline: string
  hormones: string
  mood: string
  energy: string
  symptoms: string[]
  tips: string[]
  /** Clases Tailwind para el color distintivo de la fase. */
  color: {
    bg: string
    text: string
    border: string
    dot: string
  }
}
