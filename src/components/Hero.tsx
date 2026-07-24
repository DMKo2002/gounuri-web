import { ArrowRight } from 'lucide-react'
import { REGISTRO_URL } from '@/lib/site'

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-24 text-center sm:pt-32">
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-medium text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Plataforma para tiendas de moda en Argentina
        </p>

        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
          Tu tienda de moda online, en minutos.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
          Catálogo, pedidos, clientes y pagos con MercadoPago — todo desde un
          panel simple, con una tienda de diseño profesional que es tuya de verdad.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={REGISTRO_URL} className="btn-black !px-7 !py-3 !text-base">
            Crear mi tienda
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#como-funciona" className="btn-outline !px-7 !py-3 !text-base">
            Ver cómo funciona
          </a>
        </div>

        {/* Placeholder del banner/screenshot — se reemplaza en la etapa de diseño */}
        <div className="mx-auto mt-16 max-w-4xl rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
          <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-zinc-50 text-sm text-zinc-400">
            Screenshot del Panel Admin / tienda — próximamente
          </div>
        </div>
      </div>
    </section>
  )
}
