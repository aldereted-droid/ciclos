'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const credentialsSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
})

export interface AuthResult {
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

export async function login(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  // Mensaje generico a proposito: no revelamos si el email existe o no.
  if (error) return { error: 'Email o contrasena incorrectos' }

  revalidatePath('/', 'layout')
  redirect('/cycles')
}

export async function signup(_prev: AuthResult, formData: FormData): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/cycles`,
    },
  })

  if (error) return { error: error.message }

  // Si el proyecto exige confirmar el email no hay sesion todavia.
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
