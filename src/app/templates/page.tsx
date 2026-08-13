import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'
import { ArrowUpRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CTA from '@/components/CTA'
import { TEMPLATES, demoUrl } from '@/lib/templates'

export const metadata: Metadata = {
  title: 'Templates — Gounuri',
  description:
    'Explorá los 6 diseños de tienda disponibles en Gounuri. Cada uno con demo en vivo para que lo pruebes como si fueras un cliente.',
}

// Busca el screenshot en public/templates/{slug}.jpg|.png (resuelto en build).
// Para agregar previews: guardar las capturas con esos nombres y redeployar.
function screenshotDe(slug: string): string | null {
  for (const ext of ['jpg', 'png', 'webp']) {
    if (fs.existsSync(path.join(process.cwd(), 'public', 'templates', `${slug}.${ext}`))) {
      return `/templates/${slug}.${ext}`
    }
  }
  return null
}

export default function TemplatesPage() {
  return (
    <main>
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Un diseño para cada marca
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
            6 templates pensados para escalar. Todos con demo en vivo.
            <br />
            Entrá, explorá el catálogo y testeá el carrito en tiempo real.
          </p>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((t) => (
              <a
                key={t.slug}
                href={demoUrl(t.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-900 hover:shadow-md"
              >
                {screenshotDe(t.slug) ? (
                  // Screenshot full-page: arranca mostrando el tope y al pasar
                  // el mouse "scrollea" hasta el pie de la página y vuelve.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screenshotDe(t.slug)!}
                    alt={`Preview del template ${t.nombre}`}
                    className="aspect-[4/3] w-full border-b border-zinc-100 object-cover object-top transition-[object-position] duration-[4000ms] ease-in-out group-hover:object-bottom"
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center border-b border-zinc-100 bg-zinc-100 text-sm text-zinc-400">
                    Preview de {t.nombre}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-zinc-900">{t.nombre}</h2>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-zinc-900" />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{t.descripcion}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">Ideal para:</span> {t.publico}
                  </p>
                  <p className="mt-auto pt-4 text-xs font-medium text-zinc-400">
                    {t.slug}.gounuri.com
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  )
}
