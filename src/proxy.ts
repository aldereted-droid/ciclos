import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * El middleware NO debe tocar los archivos de la PWA.
     *
     * manifest.json y sw.js se piden SIN cookies de sesion: si el middleware
     * los ve como "ruta privada" los redirige al login (307) y el navegador
     * nunca recibe el archivo. Consecuencia: no aparece la opcion de instalar
     * la app, y en iOS el registro del service worker falla directamente.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
