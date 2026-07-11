'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { womanSchema, womanUpdateSchema, periodSchema, dailyLogSchema } from '../lib/schemas'

export interface ActionResult {
  error?: string
  message?: string
  /** Errores por campo, para pintarlos al lado del input. */
  fieldErrors?: Record<string, string[]>
}

async function requireUserId(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')
  return data.user.id
}

export async function createWoman(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = womanSchema.safeParse({
    name: formData.get('name'),
    cycleLength: formData.get('cycleLength'),
    periodLength: formData.get('periodLength'),
    lastPeriodStart: formData.get('lastPeriodStart'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const userId = await requireUserId()
  const supabase = await createClient()

  const { data: woman, error } = await supabase
    .from('women')
    .insert({
      user_id: userId,
      name: parsed.data.name,
      cycle_length: parsed.data.cycleLength,
      period_length: parsed.data.periodLength,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: `No se pudo crear el registro: ${error.message}` }

  // El primer periodo arranca el historial; sin el no hay fase que calcular.
  const { error: periodError } = await supabase
    .from('periods')
    .insert({ woman_id: woman.id, start_date: parsed.data.lastPeriodStart })

  if (periodError) {
    // Sin periodo el registro es inutil: no dejamos una fila huerfana a medias.
    await supabase.from('women').delete().eq('id', woman.id)
    return { error: `No se pudo guardar el periodo: ${periodError.message}` }
  }

  revalidatePath('/cycles')
  redirect(`/cycles/${woman.id}`)
}

export async function updateWoman(
  womanId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = womanUpdateSchema.safeParse({
    name: formData.get('name'),
    cycleLength: formData.get('cycleLength'),
    periodLength: formData.get('periodLength'),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('women')
    .update({
      name: parsed.data.name,
      cycle_length: parsed.data.cycleLength,
      period_length: parsed.data.periodLength,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', womanId)

  if (error) return { error: `No se pudo actualizar: ${error.message}` }

  revalidatePath('/cycles')
  revalidatePath(`/cycles/${womanId}`)
  return {}
}

/** Registra un periodo nuevo. Se SUMA al historial, no pisa el anterior. */
export async function addPeriod(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = periodSchema.safeParse({
    womanId: formData.get('womanId'),
    startDate: formData.get('startDate'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase
    .from('periods')
    .insert({ woman_id: parsed.data.womanId, start_date: parsed.data.startDate })

  if (error) {
    // 23505 = unique violation: ese periodo ya estaba cargado.
    if (error.code === '23505') {
      return { fieldErrors: { startDate: ['Ese periodo ya esta registrado'] } }
    }
    return { error: `No se pudo registrar el periodo: ${error.message}` }
  }

  revalidatePath('/cycles')
  revalidatePath(`/cycles/${parsed.data.womanId}`)
  return {}
}

export async function deletePeriod(periodId: string, womanId: string): Promise<ActionResult> {
  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase.from('periods').delete().eq('id', periodId)
  if (error) return { error: `No se pudo eliminar el periodo: ${error.message}` }

  revalidatePath('/cycles')
  revalidatePath(`/cycles/${womanId}`)
  return {}
}

/**
 * Guarda como se sintio en un dia concreto. Si ya habia un registro de ese dia
 * lo actualiza (upsert): no acumula duplicados del mismo dia.
 */
export async function saveDailyLog(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = dailyLogSchema.safeParse({
    womanId: formData.get('womanId'),
    logDate: formData.get('logDate'),
    // Un select vacio llega como '' y no debe convertirse en 0.
    mood: formData.get('mood') || undefined,
    energy: formData.get('energy') || undefined,
    symptoms: formData.getAll('symptoms').map(String),
    notes: formData.get('notes') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase.from('daily_logs').upsert(
    {
      woman_id: parsed.data.womanId,
      log_date: parsed.data.logDate,
      mood: parsed.data.mood ?? null,
      energy: parsed.data.energy ?? null,
      symptoms: parsed.data.symptoms,
      notes: parsed.data.notes ?? null,
    },
    { onConflict: 'woman_id,log_date' }
  )

  if (error) return { error: `No se pudo guardar el registro: ${error.message}` }

  revalidatePath(`/cycles/${parsed.data.womanId}`)
  return { message: 'Registro guardado' }
}

export async function deleteDailyLog(logId: string, womanId: string): Promise<ActionResult> {
  await requireUserId()
  const supabase = await createClient()

  const { error } = await supabase.from('daily_logs').delete().eq('id', logId)
  if (error) return { error: `No se pudo eliminar: ${error.message}` }

  revalidatePath(`/cycles/${womanId}`)
  return {}
}

export async function deleteWoman(womanId: string): Promise<ActionResult> {
  await requireUserId()
  const supabase = await createClient()

  // Los periodos se borran solos por ON DELETE CASCADE.
  const { error } = await supabase.from('women').delete().eq('id', womanId)
  if (error) return { error: `No se pudo eliminar: ${error.message}` }

  revalidatePath('/cycles')
  redirect('/cycles')
}
