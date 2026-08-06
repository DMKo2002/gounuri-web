// Config central del sitio — un solo lugar para URLs y datos de planes.
//
// IMPORTANTE: los precios y límites deben coincidir con la fuente de verdad
// del Panel Admin (`Panel Admin/src/lib/plans.ts`). Si se cambian allá,
// actualizar acá también.

export const PANEL_URL =
  process.env.NEXT_PUBLIC_PANEL_URL ?? 'https://panel.gounuri.com'

// El registro y el onboarding ahora viven en gounuri.com
export const REGISTRO_URL = '/registro'
export const LOGIN_URL = '/login'

export const TRIAL_DAYS = 7

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

export const PLANES: Plan[] = [
  {
    id: 'mini',
    nombre: 'Mini',
    precioARS: 10_000,
    descripcion: 'Para empezar a vender online sin vueltas.',
    features: [
      'Hasta 50 productos',
      '200 MB de almacenamiento',
      '10.000 visitas por mes',
      'Pedidos ilimitados, sin comisión por venta',
      'Pagos con MercadoPago y transferencia',
      'Personalización de logo y colores',
    ],
  },
  {
    id: 'standard',
    nombre: 'Business',
    precioARS: 29_999,
    descripcion: 'Para tiendas en crecimiento.',
    destacado: true,
    features: [
      'Hasta 400 productos',
      '2 GB de almacenamiento',
      '50.000 visitas por mes',
      'Todo lo del plan Mini',
      'Precios mayoristas y minoristas',
      'Etiquetas de envío en PDF',
      'Emails transaccionales con tu marca',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precioARS: 79_999,
    descripcion: 'Para marcas establecidas que quieren todo.',
    features: [
      'Hasta 1.000 productos',
      '10 GB de almacenamiento',
      '200.000 visitas por mes',
      'Todo lo del plan Business',
      'Modo sin stock y pedidos por encargo',
      'Cuentas y roles para tu equipo',
      'Soporte prioritario',
    ],
  },
]
