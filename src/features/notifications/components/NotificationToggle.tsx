'use client'

import { usePushSubscription } from '../hooks/usePushSubscription'

export function NotificationToggle() {
  const {
    isSupported,
    needsInstallFirst,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
  } = usePushSubscription()

  // iOS solo permite notificaciones si la app se instalo en la pantalla de
  // inicio. Explicamos como hacerlo en vez de decir "no compatible".
  if (needsInstallFirst) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold text-gray-900">Notificaciones</h2>
        <p className="mt-1 text-sm text-gray-600">
          En iPhone hay que instalar la app primero: toca{' '}
          <strong>Compartir</strong> y despues <strong>Agregar a inicio</strong>. Abri Ciclos
          desde ese icono y vas a poder activar los avisos.
        </p>
      </div>
    )
  }

  if (!isSupported) {
    return null
  }

  const blocked = permission === 'denied'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Notificaciones</h2>
          <p className="mt-1 text-sm text-gray-600">
            Avisos cuando se acerca el periodo o empieza la fase lutea.
          </p>
        </div>

        {blocked ? (
          <span className="text-sm text-gray-500">Bloqueadas en el navegador</span>
        ) : (
          <button
            type="button"
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              isSubscribed
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {loading ? '...' : isSubscribed ? 'Desactivar' : 'Activar'}
          </button>
        )}
      </div>

      {blocked && (
        <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          Las bloqueaste antes. Para reactivarlas hay que permitirlas desde la configuracion del
          navegador (el candado en la barra de direcciones).
        </p>
      )}

      {isSubscribed && !blocked && (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
          Activadas en este dispositivo.
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>
      )}
    </div>
  )
}
