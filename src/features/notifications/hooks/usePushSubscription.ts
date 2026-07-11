'use client'

import { useState, useEffect, useCallback } from 'react'

/** La VAPID key viaja en base64url; el navegador la exige como Uint8Array.
 *  Se construye sobre un ArrayBuffer explicito: pushManager.subscribe rechaza
 *  el Uint8Array generico (podria estar respaldado por un SharedArrayBuffer). */
function urlBase64ToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export interface PushSubscriptionState {
  isSupported: boolean
  /** iOS solo permite push si la app fue INSTALADA en la pantalla de inicio. */
  needsInstallFirst: boolean
  permission: NotificationPermission | 'unsupported'
  isSubscribed: boolean
  loading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushSubscription(): PushSubscriptionState {
  const [isSupported, setIsSupported] = useState(false)
  const [needsInstallFirst, setNeedsInstallFirst] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'unsupported'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setIsSupported(supported)

    if (!supported) {
      // En iOS, Safari en pestaña normal no expone PushManager: hay que
      // instalar la app primero. Lo detectamos para explicarlo en vez de
      // decir "tu navegador no sirve".
      const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        // Safari en iOS expone esta propiedad no estandar.
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
      setNeedsInstallFirst(isIos && !isStandalone)
      setLoading(false)
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setIsSubscribed(Boolean(subscription))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const subscribe = useCallback(async () => {
    if (!isSupported) return
    setLoading(true)
    setError(null)

    try {
      const granted = await Notification.requestPermission()
      setPermission(granted)

      if (granted !== 'granted') {
        setError('No diste permiso para las notificaciones.')
        setLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!response.ok) throw new Error('El servidor rechazo la suscripcion')

      setIsSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar')
    }

    setLoading(false)
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar')
    }

    setLoading(false)
  }, [])

  return {
    isSupported,
    needsInstallFirst,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  }
}
