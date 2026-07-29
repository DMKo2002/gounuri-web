import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CTA from '@/components/CTA'
import DemoInteractiva from './DemoInteractiva'

export const metadata: Metadata = {
  title: 'Demo — Gounuri',
  description:
    'Probá el Panel Admin de Gounuri en vivo: cambiá colores, activá el modo sin stock y mirá cómo tu tienda reacciona al instante.',
}

export default function DemoPage() {
  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Probalo vos mismo
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
            Así se siente administrar tu tienda: tocá los controles del panel y
            mirá cómo la tienda cambia al instante. Sin registrarte, sin vueltas.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <DemoInteractiva />
          <p className="mt-6 text-center text-sm text-zinc-500">
            Esto es una simulación con 3 features — el Panel Admin real tiene además pedidos,
            clientes, estadísticas, envíos, emails automáticos y mucho más.
          </p>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  )
}
