// Helper para disparar eventos del Meta Pixel de gounuri.com desde el cliente.
// Si el Pixel no está cargado (sin NEXT_PUBLIC_META_PIXEL_ID, bloqueador de
// anuncios, etc.) no hace nada y nunca rompe el flujo.
// Eventos usados:
//  - Lead: se creó la cuenta (form de /registro OK, falta confirmar el mail).
//  - CompleteRegistration: el usuario confirmó la cuenta y llegó al
//    onboarding (cubre mail y Google). Se manda una sola vez por navegador.

type Fbq = (...args: unknown[]) => void

export function trackPixel(event: string, params?: Record<string, unknown>) {
  try {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq
    if (typeof fbq === 'function') fbq('track', event, params)
  } catch {
    // el tracking nunca debe romper la app
  }
}

export function trackPixelOnce(event: string, params?: Record<string, unknown>) {
  try {
    const key = `gounuri_px_${event}`
    if (window.localStorage.getItem(key)) return
    window.localStorage.setItem(key, '1')
  } catch {
    // sin localStorage: se manda igual
  }
  trackPixel(event, params)
}
