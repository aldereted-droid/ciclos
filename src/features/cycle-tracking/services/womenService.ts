import { createClient } from '@/lib/supabase/server'
import type { WomanWithPeriods } from '../types'

/**
 * Trae las mujeres del usuario logueado con su historial de periodos.
 * RLS se encarga de filtrar por user_id: no hace falta (ni conviene) filtrarlo aca.
 */
export async function getWomenWithPeriods(): Promise<WomanWithPeriods[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('women')
    .select('*, periods(*)')
    .order('created_at', { ascending: false })
    .order('start_date', { referencedTable: 'periods', ascending: false })

  if (error) throw new Error(`No se pudieron cargar los registros: ${error.message}`)
  return (data ?? []) as WomanWithPeriods[]
}

/** El detalle si trae los registros diarios: son la base de los patrones personalizados. */
export async function getWomanWithPeriods(id: string): Promise<WomanWithPeriods | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('women')
    .select('*, periods(*), daily_logs(*)')
    .eq('id', id)
    .order('start_date', { referencedTable: 'periods', ascending: false })
    .order('log_date', { referencedTable: 'daily_logs', ascending: false })
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el registro: ${error.message}`)
  return data as WomanWithPeriods | null
}
