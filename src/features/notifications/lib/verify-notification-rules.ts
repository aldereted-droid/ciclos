/* Red de seguridad de las reglas de aviso. Correr con: npm run test:notifications */
import { buildNotifications, type NotificationType } from './notification-rules'
import type { Period } from '@/features/cycle-tracking/types'

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

const at = (iso: string) => new Date(`${iso}T00:00:00.000Z`)

/** Solo los tipos, para comparar facil. */
const types = (periods: Period[], today: string, cycle = 28, period = 5): NotificationType[] =>
  buildNotifications('Maria', periods, cycle, period, at(today)).map((n) => n.type)

// Ciclo de 28 dias que empezo el 1 de marzo -> proximo periodo el 29 de marzo.
const one = [p('2026-03-01')]

console.log('\n== Aviso de periodo ==')
check('28-mar (falta 1 dia) -> avisa manana', types(one, '2026-03-28'), ['periodo-manana'])
check('29-mar (dia esperado) -> avisa hoy', types(one, '2026-03-29'), ['periodo-hoy'])
check('27-mar (faltan 2) -> no avisa de periodo', types(one, '2026-03-27'), [])

console.log('\n== Aviso de atraso (a los 3 dias, no antes) ==')
check('1 dia de atraso -> silencio (es normal)', types(one, '2026-03-30'), [])
check('2 dias de atraso -> silencio', types(one, '2026-03-31'), [])
check('3 dias de atraso -> avisa', types(one, '2026-04-01'), ['periodo-atrasado'])
check('4 dias de atraso -> NO repite', types(one, '2026-04-02'), [])

console.log('\n== Aviso anticipado de fase lutea ==')
// Ciclo 28, periodo 5 -> lutea empieza el dia 16. Aviso 2 dias antes = dia 14.
// Dia 14 = 14 de marzo (inicio 1-mar).
check('dia 14 (2 antes de lutea) -> avisa', types(one, '2026-03-14'), ['entra-lutea'])
check('dia 13 -> todavia no', types(one, '2026-03-13'), [])
check('dia 15 -> ya paso el aviso, no repite', types(one, '2026-03-15'), [])
check('dia 16 (ya en lutea) -> no avisa', types(one, '2026-03-16'), [])

console.log('\n== El aviso se adapta al ciclo REAL, no a 28 fijos ==')
// Historial: 1-ene, 31-ene (30 dias) -> promedio 30. Lutea empieza dia 18.
// Aviso 2 dias antes = dia 16 -> 15 de febrero (inicio 31-ene).
const hist = [p('2026-01-01'), p('2026-01-31')]
check('ciclo real 30: avisa lutea el dia 16', types(hist, '2026-02-15'), ['entra-lutea'])
check('ciclo real 30: el dia 14 NO avisa (seria el error de asumir 28)', types(hist, '2026-02-13'), [])

console.log('\n== No inventar avisos sin datos ==')
check('sin periodos -> nada', types([], '2026-03-14'), [])
check('fecha futura -> nada', types([p('2026-06-01')], '2026-03-14'), [])

console.log('\n== El mensaje se entiende ==')
const msg = buildNotifications('Maria', one, 28, 5, at('2026-03-28'))[0]
check('titulo incluye el nombre', msg.title.includes('Maria'), true)
check('titulo dice que es manana', msg.title.includes('manana'), true)

console.log(`\n${'='.repeat(50)}`)
console.log(`RESULTADO: ${passed} pasaron, ${failed} fallaron`)
console.log('='.repeat(50))
if (failed > 0) process.exit(1)
