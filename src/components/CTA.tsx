import { REGISTRO_PAGO_URL } from '@/lib/site'

// Revisado 2026-08-28 a pedido de Aram: la nota anterior (19/08) decia que
// esta seccion ya no ofrecia alta self-serve porque un pilot manual en
// Avellaneda lo requeria -- esa decision se revirtio hace mas de dos
// semanas y la nota de memoria que la explicaba (creart_avellaneda_pilot_plan)
// ya no existe. Con el autoservicio de nuevo como flujo principal, esta
// seccion vuelve a ofrecer el CTA de "Crear mi tienda" (antes solo tenia
// mailto + Instagram, sin ningun camino de alta para quien llega hasta el
// final de la pagina sin convertir). "Contactanos" queda como opcion
// secundaria para quien prefiere hablar con alguien antes de arrancar.
export default function CTA() {
  return (
    <section id="contacto" className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Tu marca merece su propia tienda.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-500">
          ¿Tenés preguntas antes de arrancar? Estamos para ayudarte.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={REGISTRO_PAGO_URL}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Crear mi tienda
          </a>
          <a
            href="/contacto"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-8 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Contactanos
          </a>
        </div>
        <a
          href="https://instagram.com/gounuri.com"
          target="_blank"
          rel="noopener"
          className="mt-4 inline-block text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-700"
        >
          Escribinos por Instagram
        </a>
      </div>
    </section>
  )
}
