import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/features/auth/services/actions'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/cycles" className="font-semibold text-gray-900">
            Ciclos
          </Link>

          <div className="flex items-center gap-4">
            {user?.email && <span className="text-sm text-gray-500">{user.email}</span>}
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-600 transition hover:text-gray-900"
              >
                Salir
              </button>
            </form>
          </div>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}
