/* Red de seguridad del analisis de regularidad. Correr con: npm run test:regularity */
import { analyzeRegularity, cycleIntervals } from './regularity'
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

console.log('\n== Intervalos entre periodos ==')
check('3 periodos -> 2 intervalos', cycleIntervals([p('2026-01-01'), p('2026-01-29'), p('2026-02-26')]), [28, 28])
check('orden de carga no importa', cycleIntervals([p('2026-02-26'), p('2026-01-01'), p('2026-01-29')]), [28, 28])
check('intervalo absurdo se descarta', cycleIntervals([p('2025-01-01'), p('2026-01-01')]), [])

console.log('\n== Nivel de regularidad ==')
// Ciclos 28, 28 -> variacion 0
check('variacion 0 -> regular', analyzeRegularity([p('2026-01-01'), p('2026-01-29'), p('2026-02-26')]).level, 'regular')
// 28 y 33 -> variacion 5 (<=7)
check('variacion 5 -> regular', analyzeRegularity([p('2026-01-01'), p('2026-01-29'), p('2026-03-03')]).level, 'regular')
// 28 y 36 -> variacion 8 (entre 8 y 8) -> poco-regular
check('variacion 8 -> poco regular', analyzeRegularity([p('2026-01-01'), p('2026-01-29'), p('2026-03-06')]).level, 'poco-regular')
// 25 y 40 -> variacion 15 -> irregular
check('variacion 15 -> irregular', analyzeRegularity([p('2026-01-01'), p('2026-01-26'), p('2026-03-07')]).level, 'irregular')

console.log('\n== Metricas ==')
const a = analyzeRegularity([p('2026-01-01'), p('2026-01-29'), p('2026-03-03')])
check('ciclos medidos = 2', a.cyclesMeasured, 2)
check('mas corto 28', a.shortestCycle, 28)
check('mas largo 33', a.longestCycle, 33)
check('variacion 5', a.variationDays, 5)
check('promedio 31 (28 y 33 -> 30.5 redondeado)', a.averageCycle, 31)

console.log('\n== Avisos responsables ==')
// Ciclo corto: 18 dias (<21)
const corto = analyzeRegularity([p('2026-01-01'), p('2026-01-19'), p('2026-02-06')])
check('ciclo <21 dias genera aviso de atencion', corto.flags.some((f) => f.severity === 'atencion'), true)
// Ciclo largo: 45 dias (>35)
const largo = analyzeRegularity([p('2026-01-01'), p('2026-02-15'), p('2026-04-01')])
check('ciclo >35 dias genera aviso de atencion', largo.flags.some((f) => f.severity === 'atencion'), true)
// Regular no debe alarmar
const regular = analyzeRegularity([p('2026-01-01'), p('2026-01-29'), p('2026-02-26')])
check('ciclo regular NO genera alarma', regular.flags.some((f) => f.severity === 'atencion'), false)

console.log('\n== Casos borde: no opinar sin datos ==')
check('sin periodos -> sin-datos', analyzeRegularity([]).level, 'sin-datos')
check('1 periodo -> sin-datos (no hay intervalo)', analyzeRegularity([p('2026-01-01')]).level, 'sin-datos')
check('2 periodos -> sin-datos (1 solo ciclo, no hay variacion)', analyzeRegularity([p('2026-01-01'), p('2026-01-29')]).level, 'sin-datos')
check('1 solo ciclo NO alarma', analyzeRegularity([p('2026-01-01'), p('2026-01-29')]).flags.some((f) => f.severity === 'atencion'), false)

console.log(`\n${'='.repeat(50)}`)
console.log(`RESULTADO: ${passed} pasaron, ${failed} fallaron`)
console.log('='.repeat(50))
if (failed > 0) process.exit(1)
