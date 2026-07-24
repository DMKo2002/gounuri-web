import {
  ShoppingBag,
  CreditCard,
  Palette,
  Users,
  Truck,
  BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: ShoppingBag,
    titulo: 'Catálogo completo',
    texto:
      'Productos con variantes de talle y color, stock por variante, precios minoristas y mayoristas.',
  },
  {
    icon: CreditCard,
    titulo: 'Cobrá como quieras',
    texto:
      'MercadoPago integrado, transferencia bancaria o retiro en persona. Vos elegís qué habilitar.',
  },
  {
    icon: Palette,
    titulo: 'Diseño profesional',
    texto:
      'Templates pensados para moda. Cambiá colores, logo y banners desde el panel, sin tocar código.',
  },
  {
    icon: Users,
    titulo: 'Clientes y pedidos',
    texto:
      'Todos tus pedidos y compradores en un solo lugar, con notificaciones automáticas por email.',
  },
  {
    icon: Truck,
    titulo: 'Envíos simplificados',
    texto:
      'Etiquetas de envío en PDF con los datos del comprador, listas para imprimir y pegar.',
  },
  {
    icon: BarChart3,
    titulo: 'Modo sin stock',
    texto:
      'Vendé por encargo: tus clientes pueden comprar aunque no tengas stock cargado.',
  },
]

export default function Features() {
  return (
    <section id="features" className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Todo lo que tu tienda necesita
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Sin plugins, sin configuraciones eternas. Funciona desde el primer día.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titulo, texto }) => (
            <div
              key={titulo}
              className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-sm"
            >
              <Icon className="h-5 w-5 text-zinc-900" />
              <h3 className="mt-4 font-semibold text-zinc-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
