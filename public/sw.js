// Service Worker de Ciclos.
//
// CRITICO: NO agregar un handler de 'fetch'. Interceptar fetch rompe las PWA
// en iOS Safari (la app deja de cargar). Este SW solo hace push + limpieza.

const CACHE_NAME = 'ciclos-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  )
})

// Llega una notificacion desde el servidor.
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Ciclos', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Ciclos', {
      body: payload.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      data: payload.data || {},
      tag: payload.tag,
    })
  )
})

// Al tocar la notificacion, abrir la pantalla correspondiente.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/cycles'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(url)
          return
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// El navegador puede invalidar la suscripcion por su cuenta. Cuando pasa,
// nos re-suscribimos solos: si no, el usuario deja de recibir avisos en silencio.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(
        event.oldSubscription?.options || {
          userVisibleOnly: true,
          applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
        }
      )
      .then((newSub) =>
        fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: newSub.toJSON(),
            oldEndpoint: event.oldSubscription?.endpoint,
          }),
        })
      )
  )
})
