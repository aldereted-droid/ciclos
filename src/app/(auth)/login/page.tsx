import Link from 'next/link'
import { AuthForm } from '@/features/auth/components/AuthForm'

export const metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
        <p className="mt-1 text-sm text-gray-600">Segui el ciclo de cada persona registrada.</p>

        <div className="mt-6">
          <AuthForm mode="login" />
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          No tenes cuenta?{' '}
          <Link href="/signup" className="font-medium text-gray-900 hover:underline">
            Crear una
          </Link>
        </p>
      </div>
    </div>
  )
}
