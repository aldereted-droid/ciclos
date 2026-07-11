import { z } from 'zod'

/** Fecha 'yyyy-mm-dd' que exista de verdad y no este en el futuro. */
const pastDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha invalida')
  .refine((iso) => !Number.isNaN(Date.parse(`${iso}T00:00:00Z`)), 'Fecha invalida')
  .refine((iso) => {
    const now = new Date()
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    return Date.parse(`${iso}T00:00:00Z`) <= today.getTime()
  }, 'La fecha no puede estar en el futuro')

export const womanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'Maximo 80 caracteres'),
  // Se usa solo hasta que haya 2+ periodos; despues manda el promedio real.
  cycleLength: z.coerce
    .number()
    .int('Debe ser un numero entero')
    .min(21, 'Minimo 21 dias')
    .max(40, 'Maximo 40 dias'),
  periodLength: z.coerce
    .number()
    .int('Debe ser un numero entero')
    .min(2, 'Minimo 2 dias')
    .max(10, 'Maximo 10 dias'),
  lastPeriodStart: pastDateOnly,
  notes: z.string().trim().max(500, 'Maximo 500 caracteres').optional(),
})

/** Al editar no se toca el historial de periodos: eso tiene su propio flujo. */
export const womanUpdateSchema = womanSchema.omit({ lastPeriodStart: true })

export const periodSchema = z.object({
  womanId: z.string().uuid('Registro invalido'),
  startDate: pastDateOnly,
})

export const dailyLogSchema = z.object({
  womanId: z.string().uuid('Registro invalido'),
  logDate: pastDateOnly,
  // Escala 1-5. Vacio = no lo registro ese dia (no es lo mismo que un 1).
  mood: z.coerce.number().int().min(1).max(5).optional(),
  energy: z.coerce.number().int().min(1).max(5).optional(),
  symptoms: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  notes: z.string().trim().max(500, 'Maximo 500 caracteres').optional(),
})

export type WomanInput = z.infer<typeof womanSchema>
export type WomanUpdateInput = z.infer<typeof womanUpdateSchema>
export type PeriodInput = z.infer<typeof periodSchema>
export type DailyLogInput = z.infer<typeof dailyLogSchema>
