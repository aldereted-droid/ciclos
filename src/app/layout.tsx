import type { Metadata, Viewport } from 'next'
import { PWARegister } from '@/features/notifications/components/PWARegister'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Ciclos',
    template: '%s · Ciclos',
  },
  description:
    'Segui la fase del ciclo de cada persona registrada: animo, energia y sintomas.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ciclos',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#e11d48',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  )
}
