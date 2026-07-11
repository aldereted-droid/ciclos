import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { buildNotifications } from '@/features/notifications/lib/notification-rules'
import type { Period } from '@/features/cycle-tracking/types'

// El cron no tiene sesion de usuario: necesita leer las mujeres y los
// dispositivos de TODAS las cuentas, asi que va con la service role key.
// Esta clave salta el RLS: por eso esta ruta esta protegida con CRON_SECRET
// y nunca debe llamarse desde el navegador.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface WomanRow {
  id: string
  user_id: string
  name: string
  cycle_length: number
  period_length: number
  periods: Period[]
}

interface SubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@ciclos.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const supabase = adminClient()

  const { data: women, error } = await supabase
    .from('women')
    .select('id, user_id, name, cycle_length, period_length, periods(*)')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Los dispositivos se agrupan por usuario para no consultarlos por cada mujer.
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')

  const subsByUser = new Map<string, SubscriptionRow[]>()
  for (const sub of (subs ?? []) as SubscriptionRow[]) {
    const list = subsByUser.get(sub.user_id) ?? []
    list.push(sub)
    subsByUser.set(sub.user_id, list)
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const woman of (women ?? []) as WomanRow[]) {
    const pending = buildNotifications(
      woman.name,
      woman.periods ?? [],
      woman.cycle_length,
      woman.period_length
    )
    if (pending.length === 0) continue

    const devices = subsByUser.get(woman.user_id) ?? []
    if (devices.length === 0) continue

    for (const notification of pending) {
      // El UNIQUE (woman_id, type, sent_on) es el que garantiza que un aviso
      // salga UNA sola vez por dia, aunque el cron se ejecute de mas.
      const { error: dupError } = await supabase.from('notifications').insert({
        user_id: woman.user_id,
        woman_id: woman.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
      })

      if (dupError) {
        // 23505 = ya se envio hoy. No es un error: es el anti-duplicado haciendo su trabajo.
        if (dupError.code === '23505') skipped++
        else failed++
        continue
      }

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        data: { url: `/cycles/${woman.id}` },
        tag: `${woman.id}-${notification.type}`,
      })

      for (const device of devices) {
        try {
          await webpush.sendNotification(
            {
              endpoint: device.endpoint,
              keys: { p256dh: device.p256dh, auth: device.auth },
            },
            payload
          )
          sent++
        } catch (err: unknown) {
          failed++
          const status = (err as { statusCode?: number }).statusCode

          // 404/410 = el dispositivo ya no existe. Apple ademas falla sin
          // statusCode, asi que tambien limpiamos cuando no viene ninguno.
          const isGone = status === 404 || status === 410 || status === undefined
          if (isGone) {
            await supabase.from('push_subscriptions').delete().eq('id', device.id)
          }
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    women: women?.length ?? 0,
    sent,
    skipped,
    failed,
  })
}
