// Config central del sitio — un solo lugar para URLs y datos de planes.
//
// IMPORTANTE: los precios y límites deben coincidir con la fuente de verdad
// del Panel Admin (`Panel Admin/src/lib/plans.ts`). Si se cambian allá,
// actualizar acá también.

export const PANEL_URL =
  process.env.NEXT_PUBLIC_PANEL_URL ?? 'https://panel.gounuri.com'

// El registro y el onboarding ahora viven en gounuri.com
export const REGISTRO_URL = '/registro'
// "Crear mi tienda" (2026-08-26, pedido de ARam) -- mismo /registro que
// "Probar Gratis" (REGISTRO_URL, NO se toca) pero con ?intent=pago: /registro
// lee ese query param y guarda una cookie corta (gounuri_intent=pago, 1hs)
// que sobrevive a la confirmación de mail y al ida-y-vuelta de OAuth. Cuando
// esa cookie está presente, /api/auth/confirmar y /auth/callback mandan a
// /perfil/plan (elegís plan y pagás, recién ahí se genera la tienda) en vez
// de al onboarding de prueba gratis de siempre. Ver /registro/page.tsx,
// /api/auth/confirmar/route.ts y /auth/callback/route.ts.
export const REGISTRO_PAGO_URL = '/registro?intent=pago'
export const LOGIN_URL = '/login'

export const TRIAL_DAYS = 7

// ── Tienda placeholder (2026-08-18) ─────────────────────────────────────────
// Cuando alguien elige un plan pago desde la página de precios pública sin
// tener tienda todavía (/api/ir-a-plan), se crea un tenant mínimo con este
// nombre exacto como "sentinel" — así se puede pagar ya mismo reusando
// /perfil/plan (que no necesita nombre/template real, ver
// /api/finalizar-tienda) y recién completar el nombre/template/dominio real
// en /onboarding después de pagar. Cualquier endpoint que vaya a modificar
// nombre/slug/template de un tenant existente debe chequear este sentinel
// antes de tocar nada, para no pisar jamás una tienda ya en uso real.
export const PLACEHOLDER_TENANT_NAME = '(pendiente)'

export type Plan = {
  id: 'mini' | 'standard' | 'premium'
  nombre: string
  precioARS: number
  descripcion: string
  destacado?: boolean
  features: string[]
}

export function formatPrecio(precioARS: number): string {
  return `$${precioARS.toLocaleString('es-AR')}`
}

// ── Descuento por pago adelantado (2026-08-12) ──────────────────────────────
// Debe coincidir con TERM_DISCOUNTS de Panel Admin/src/lib/plans.ts — acá solo
// se usa para el copy de la página de precios, el cobro real se elige recién
// al pagar desde el Panel Admin.
export const TERM_DISCOUNTS_PCT: Record<6 | 12, number> = { 6: 10, 12: 20 }

// ── Plan Personalizado / Signature (2026-08-12) ─────────────────────────────
// No tiene precio fijo ni se cobra por acá — es "contactanos" para catálogos
// grandes, ecosistemas a medida o necesidades fuera de los planes de arriba.
// El precio se evalúa caso por caso.
export const CONTACTO_EMAIL = 'info@gounuri.com'
export const CONTACTO_WHATSAPP_NUM = '541131351972' // sin +, formato wa.me

export function whatsappUrl(mensaje?: string): string {
  return `https://wa.me/${CONTACTO_WHATSAPP_NUM}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
}

// Límites recalibrados 2026-08-12 contra el uso real de tiendas en
// producción — deben coincidir siempre con Panel Admin/src/lib/plans.ts.
export const PLANES: Plan[] = [
  {
    id: 'mini',
    nombre: 'Mini',
    // TEMP TEST 2026-08-25: bajado de 9_900 a 20 para probar el cobro real
    // de Mercado Pago con el tenant Test/TEST2 sin gastar plata de verdad.
    // REVERTIR A 9_900 apenas termine la prueba (y mantener sincronizado con
    // Panel Admin/src/lib/plans.ts, mismo cambio temporal hecho ahí).
    precioARS: 20,
    descripcion: 'Para empezar a vender online sin vueltas.',
    features: [
      'Hasta 50 productos',
      '300 MB de almacenamiento',
      '15.000 visitas por mes',
      'Pedidos ilimitados, sin comisión por venta',
      'Pagos con MercadoPago y transferencia',
      'Personalización de logo y colores',
    ],
  },
  {
    id: 'standard',
    nombre: 'Business',
    precioARS: 34_900,
    descripcion: 'Para tiendas en crecimiento.',
    destacado: true,
    features: [
      'Hasta 300 productos',
      '1 GB de almacenamiento',
      '75.000 visitas por mes',
      'Todo lo del plan Mini',
      'Precios mayoristas y minoristas',
      'Etiquetas de envío en PDF',
      'Emails transaccionales con tu marca',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precioARS: 74_900,
    descripcion: 'Para marcas establecidas que quieren todo.',
    features: [
      'Hasta 600 productos',
      '3 GB de almacenamiento',
      '300.000 visitas por mes',
      'Todo lo del plan Business',
      'Modo sin stock y pedidos por encargo',
      'Cuentas y roles para tu equipo',
      'Soporte prioritario',
    ],
  },
]
