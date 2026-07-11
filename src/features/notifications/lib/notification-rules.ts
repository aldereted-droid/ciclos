import { calculateCycleState } from '@/features/cycle-tracking/lib/cycle-calculator'
import type { Period } from '@/features/cycle-tracking/types'

/**
 * Decide que avisos merece una mujer HOY.
 *
 * Cada regla dispara en una condicion EXACTA (ej: "faltan justo 2 dias"), no en
 * un rango. Asi el aviso sale una sola vez por ciclo aunque el cron corra todos
 * los dias, sin necesidad de llevar estado extra.
 */

export type NotificationType =
  | 'entra-lutea'
  | 'periodo-manana'
  | 'periodo-hoy'
  | 'periodo-atrasado'

export interface PendingNotification {
  type: NotificationType
  title: string
  body: string
}

/** Aviso anticipado del SPM: 2 dias antes de entrar en fase lutea. */
const LUTEAL_HEADS_UP_DAYS = 2
/** Recien a los 3 dias de atraso avisamos: 1-2 dias de corrimiento es normal. */
const LATE_ALERT_DAYS = 3

export function buildNotifications(
  womanName: string,
  periods: Period[],
  cycleLength: number,
  periodLength: number,
  today: Date = new Date()
): PendingNotification[] {
  const state = calculateCycleState(periods, cycleLength, periodLength, today)
  const notifications: PendingNotification[] = []

  // Sin periodos cargados o con fecha futura no hay nada confiable que avisar.
  if (state.status === 'sin-datos' || state.status === 'fecha-futura') {
    return notifications
  }

  const { daysUntilNextPeriod, currentDay, phase, phaseRanges, effectiveCycleLength } = state

  if (daysUntilNextPeriod === 1) {
    notifications.push({
      type: 'periodo-manana',
      title: `${womanName}: periodo esperado manana`,
      body: 'Segun su ciclo promedio, deberia empezar manana.',
    })
  }

  if (daysUntilNextPeriod === 0) {
    notifications.push({
      type: 'periodo-hoy',
      title: `${womanName}: periodo esperado hoy`,
      body: 'Si ya empezo, registralo para mantener las predicciones al dia.',
    })
  }

  if (state.status === 'atrasado' && daysUntilNextPeriod === -LATE_ALERT_DAYS) {
    notifications.push({
      type: 'periodo-atrasado',
      title: `${womanName}: periodo atrasado ${LATE_ALERT_DAYS} dias`,
      body: 'Si ya empezo, registralo. Si no, tenelo en cuenta.',
    })
  }

  // Aviso anticipado del SPM. Dispara SOLO cuando faltan exactamente 2 dias
  // para el PRIMER dia de la fase lutea. Si preguntaramos "en 2 dias estara en
  // lutea?" avisariamos varios dias seguidos (el dia 14 y tambien el 15, el 16...),
  // y la persona recibiria el mismo aviso repetido.
  if (state.status === 'ok' && currentDay !== null) {
    const lutealStart = phaseRanges.find((range) => range.phase === 'lutea')?.startDay
    if (lutealStart !== undefined && currentDay + LUTEAL_HEADS_UP_DAYS === lutealStart) {
      notifications.push({
        type: 'entra-lutea',
        title: `${womanName} entra en fase lutea en ${LUTEAL_HEADS_UP_DAYS} dias`,
        body: 'Suele bajar la energia y, hacia el final, aparecer el SPM.',
      })
    }
  }

  return notifications
}
