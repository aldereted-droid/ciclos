import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'

export const metadata = { title: 'Crear cuenta' }

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
        <p className="mt-1 text-sm text-gray-600">Tus registros son privados: solo vos los ves.</p>

        <div className="mt-6">
          <AuthForm mode="signup" />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Ya tenes cuenta?{' '}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
