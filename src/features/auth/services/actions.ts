'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const emailSchema = z.string().trim().email('Email invalido')

/** Al entrar NO exigimos complejidad: la contrasena ya existe, solo hay que
 *  compararla. Validar de mas aca solo confundiria a quien ya tiene cuenta. */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Ingresa tu contrasena'),
})

/** Al registrarse SI: estas reglas deben coincidir con las de Supabase
 *  (Auth > Providers > Email), o el usuario recibiria un error crudo del
 *  servidor en vez de un mensaje claro en el formulario. */
const signupSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .regex(/[a-z]/, 'Debe tener al menos una minuscula')
    .regex(/[A-Z]/, 'Debe tener al menos una mayuscula')
    .regex(/[0-9]/, 'Debe tener al menos un numero')
    .regex(/[^a-zA-Z0-9]/, 'Debe tener al menos un simbolo (por ejemplo: ! # $ %)'),
})

export interface AuthResult {
  error?: string
  /** Se devuelve para no vaciar el campo cuando la validacion falla. */
  email?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

export async function login(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const parsed = loginSchema.safeParse({
    email,
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { email, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  // Mensaje generico a proposito: no revelamos si el email existe o no.
  if (error) return { email, error: 'Email o contrasena incorrectos' }

  revalidatePath('/', 'layout')
  redirect('/cycles')
}

export async function signup(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '')
  const parsed = signupSchema.safeParse({
    email,
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { email, fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/cycles`,
    },
  })

  if (error) return { email, error: error.message }

  // Si el proyecto exige confirmar el email no hay sesion todavia.
  // Hoy la confirmacion esta desactivada, pero si se reactiva esto lo cubre.
  if (!data.session) {
    return { message: 'Revisa tu email para confirmar la cuenta.' }
  }

  revalidatePath('/', 'layout')
  redirect('/cycles')
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
