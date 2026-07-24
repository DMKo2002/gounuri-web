import { ArrowRight } from 'lucide-react'
import { REGISTRO_URL } from '@/lib/site'

export default function CTA() {
  return (
    <section className="border-t border-zinc-200 bg-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Tu marca merece su propia tienda.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          Sumate ahora y tené tu tienda online funcionando esta semana.
        </p>
        <a
          href={REGISTRO_URL}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          Crear mi tienda
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  )
}
