// Config central del sitio — un solo lugar para URLs y datos de planes.

export const PANEL_URL =
  process.env.NEXT_PUBLIC_PANEL_URL ?? 'https://panel.gounuri.com'

export const REGISTRO_URL = `${PANEL_URL}/registro`
export const LOGIN_URL = `${PANEL_URL}/login`

export type Plan = {
  id: 'basico' | 'pro' | 'premium'
  nombre: string
  precio: string
  descripcion: string
  destacado?: boolean
  features: string[]
}

export const PLANES: Plan[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    precio: 'Próximamente',
    descripcion: 'Para empezar a vender online sin vueltas.',
    features: [
      'Hasta 50 productos',
      'Tienda online con dominio propio',
      'Panel de pedidos y clientes',
      'Pagos con MercadoPago y transferencia',
      'Personalización esencial (logo y colores)',
    ],
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precio: 'Próximamente',
    descripcion: 'Para tiendas en crecimiento.',
    destacado: true,
    features: [
      'Hasta 200 productos',
      'Todo lo del plan Básico',
      'Personalización completa del diseño',
      'Precios mayoristas y minoristas',
      'Etiquetas de envío en PDF',
      'Emails transaccionales con tu marca',
    ],
  },
  {
    id: 'premium',
    nombre: 'Premium',
    precio: 'Próximamente',
    descripcion: 'Para marcas establecidas que quieren todo.',
    features: [
      'Hasta 500 productos',
      'Todo lo del plan Pro',
      'Todos los templates de diseño',
      'Modo sin stock y pedidos por encargo',
      'Cuentas y roles para tu equipo',
      'Soporte prioritario',
    ],
  },
]
