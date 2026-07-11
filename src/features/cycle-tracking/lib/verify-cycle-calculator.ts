/* Red de seguridad del motor de calculo. Correr con: npm run test:cycle */
import {
  calculateCycleState,
  averageCycleLength,
  buildPhaseRanges,
} from './cycle-calculator'
import type { Period } from '../types'

let passed = 0
let failed = 0

function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    passed++
    console.log(`  PASS  ${name}`)
  } else {
    failed++
    console.log(`  FAIL  ${name}\n        esperado: ${e}\n        recibido: ${a}`)
  }
}

const p = (start_date: string): Period => ({
  id: start_date,
  woman_id: 'w1',
  start_date,
  created_at: start_date,
})

// Fecha fija para que las pruebas sean deterministas
const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

console.log('\n== Promedio del ciclo desde historial ==')
check('3 periodos cada 28 dias -> 28', averageCycleLength([p('2026-01-01'), p('2026-01-29'), p('2026-02-26')]), 28)
check('intervalos 30 y 32 -> 31', averageCycleLength([p('2026-01-01'), p('2026-01-31'), p('2026-03-04')]), 31)
check('1 solo periodo -> null (sin promedio)', averageCycleLength([p('2026-01-01')]), null)
check('sin periodos -> null', averageCycleLength([]), null)
check('intervalo absurdo (200 dias) se descarta -> null', averageCycleLength([p('2025-01-01'), p('2026-01-01')]), null)

console.log('\n== Rangos de fase (ciclo 28, periodo 5) ==')
check('4 fases', buildPhaseRanges(28, 5).map((r) => r.phase), ['menstrual', 'folicular', 'ovulacion', 'lutea'])
check('menstrual 1-5', buildPhaseRanges(28, 5)[0], { phase: 'menstrual', startDay: 1, endDay: 5 })
check('folicular 6-12', buildPhaseRanges(28, 5)[1], { phase: 'folicular', startDay: 6, endDay: 12 })
check('ovulacion 13-15', buildPhaseRanges(28, 5)[2], { phase: 'ovulacion', startDay: 13, endDay: 15 })
check('lutea 16-28', buildPhaseRanges(28, 5)[3], { phase: 'lutea', startDay: 16, endDay: 28 })

console.log('\n== Ovulacion anclada al FINAL del ciclo (no dia 14 fijo) ==')
check('ciclo 35 -> ovula ~dia 21 (no 14)', buildPhaseRanges(35, 5)[2], { phase: 'ovulacion', startDay: 20, endDay: 22 })
const ovu21 = buildPhaseRanges(21, 5).find((r) => r.phase === 'ovulacion')
check('ciclo 21 -> ovula ~dia 7', ovu21, { phase: 'ovulacion', startDay: 6, endDay: 8 })
check('ciclo 21 corto -> la folicular se comprime y se omite', buildPhaseRanges(21, 5).map((r) => r.phase), ['menstrual', 'ovulacion', 'lutea'])
check('ciclo 21 -> sin huecos, cubre hasta el 21', buildPhaseRanges(21, 5).at(-1)!.endDay, 21)
check('rangos cubren todo el ciclo sin huecos (35)', buildPhaseRanges(35, 5).at(-1)!.endDay, 35)

console.log('\n== Fase actual segun el dia ==')
const one = [p('2026-03-01')]
check('dia 1 -> menstrual', calculateCycleState(one, 28, 5, at('2026-03-01')).phase, 'menstrual')
check('dia 1 -> currentDay 1', calculateCycleState(one, 28, 5, at('2026-03-01')).currentDay, 1)
check('dia 8 -> folicular', calculateCycleState(one, 28, 5, at('2026-03-08')).phase, 'folicular')
check('dia 14 -> ovulacion', calculateCycleState(one, 28, 5, at('2026-03-14')).phase, 'ovulacion')
check('dia 20 -> lutea', calculateCycleState(one, 28, 5, at('2026-03-20')).phase, 'lutea')
check('dia 28 -> lutea (ultimo dia)', calculateCycleState(one, 28, 5, at('2026-03-28')).currentDay, 28)

console.log('\n== Historial manda sobre el valor manual ==')
const hist = [p('2026-01-01'), p('2026-01-31'), p('2026-03-02')]
const st = calculateCycleState(hist, 28, 5, at('2026-03-10'))
check('usa promedio real (30) y no el manual (28)', st.effectiveCycleLength, 30)
check('marca que viene del historial', st.isAverageFromHistory, true)
check('con 1 solo periodo usa el manual', calculateCycleState(one, 26, 5, at('2026-03-02')).effectiveCycleLength, 26)
check('con 1 periodo NO dice que es promedio', calculateCycleState(one, 26, 5, at('2026-03-02')).isAverageFromHistory, false)

console.log('\n== Casos borde (no deben romper) ==')
check('sin periodos -> sin-datos', calculateCycleState([], 28, 5, at('2026-03-10')).status, 'sin-datos')
check('sin periodos -> phase null', calculateCycleState([], 28, 5, at('2026-03-10')).phase, null)
check('fecha futura -> fecha-futura', calculateCycleState([p('2026-05-01')], 28, 5, at('2026-03-10')).status, 'fecha-futura')
check('fecha futura -> no inventa fase', calculateCycleState([p('2026-05-01')], 28, 5, at('2026-03-10')).phase, null)
check('pasado el ciclo -> atrasado', calculateCycleState(one, 28, 5, at('2026-04-05')).status, 'atrasado')
check('atrasado NO hace modulo silencioso (dia 36, no 8)', calculateCycleState(one, 28, 5, at('2026-04-05')).currentDay, 36)
check('atrasado -> dias negativos', calculateCycleState(one, 28, 5, at('2026-04-05')).daysUntilNextPeriod, -7)
check('>90 dias sin registro no crashea', calculateCycleState(one, 28, 5, at('2026-08-01')).status, 'atrasado')

console.log('\n== Prediccion del proximo periodo ==')
const pred = calculateCycleState(one, 28, 5, at('2026-03-10'))
check('proximo periodo = inicio + 28', pred.nextPeriodDate, '2026-03-29')
check('faltan 19 dias (10-mar -> 29-mar)', pred.daysUntilNextPeriod, 19)

console.log('\n== Timezone (el bug clasico off-by-one) ==')
check('mismo dia -> dia 1, no dia 0 ni 2', calculateCycleState([p('2026-03-15')], 28, 5, at('2026-03-15')).currentDay, 1)

console.log(`\n${'='.repeat(50)}`)
console.log(`RESULTADO: ${passed} pasaron, ${failed} fallaron`)
console.log('='.repeat(50))
if (failed > 0) process.exit(1)
