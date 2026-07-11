'use client'

import { useEffect } from 'react'

/**
 * Registra el Service Worker. Sin esto no hay PWA ni notificaciones.
 * Debe estar montado en el layout: si se saca, todo deja de funcionar en silencio.
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Usar window.location.origin y no una ruta relativa: iOS rechaza el
    // registro si la peticion pasa por un redirect 307.
    const swUrl = `${window.location.origin}/sw.js`

    navigator.serviceWorker
      .register(swUrl, { scope: '/' })
      .then((registration) => {
        setInterval(() => registration.update(), 60 * 60 * 1000)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
              setTimeout(() => window.location.reload(), 1000)
            }
          })
        })
      })
      .catch((error) => console.error('[PWA] Fallo el registro:', error))
  }, [])

  return null
}
