import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
  /** Presente cuando el navegador rota la suscripcion por su cuenta. */
  oldEndpoint: z.string().url().optional(),
})

/**
 * Registra el dispositivo del usuario logueado.
 *
 * Usamos el cliente con la SESION del usuario (no la service role key): asi el
 * user_id sale del token verificado y no de lo que mande el navegador. Nadie
 * puede registrar un dispositivo a nombre de otro.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const parsed = subscribeSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Suscripcion invalida' }, { status: 400 })
  }

  const { subscription, oldEndpoint } = parsed.data

  if (oldEndpoint) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', oldEndpoint)
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: request.headers.get('user-agent') ?? null,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { endpoint } = await request.json()
  if (typeof endpoint !== 'string') {
    return NextResponse.json({ error: 'Endpoint invalido' }, { status: 400 })
  }

  // RLS ya limita el borrado a las filas del propio usuario.
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
