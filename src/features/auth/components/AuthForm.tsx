'use client'

import { useActionState } from 'react'
import { login, signup, type AuthResult } from '../services/actions'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const action = mode === 'login' ? login : signup
  const [state, formAction, isPending] = useActionState<AuthResult, FormData>(action, {})

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Contrasena
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={8}
          className={inputClass}
        />
        {state.fieldErrors?.password ? (
          <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password[0]}</p>
        ) : (
          mode === 'signup' && (
            <p className="mt-1 text-xs text-gray-500">
              Minimo 8 caracteres, con mayuscula, minuscula, numero y simbolo.
            </p>
          )
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>
    </form>
  )
}
