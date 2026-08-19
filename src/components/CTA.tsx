// 2026-08-19: gounuri.com pasa a ser vidriera de templates mientras el pilot
// de Avellaneda usa alta manual + transferencia (ver creart_avellaneda_pilot_plan
// en la memoria del proyecto) — esta sección ya NO ofrece alta self-serve ni
// pago online, solo un canal de contacto. El botón "Crear mi tienda" con SVG
// custom se reemplazó por un botón de texto simple (mailto) porque el arte
// original tenía el texto dibujado como paths de SVG, no como texto real —
// para volver a tener un botón con el diseño de marca, hay que pedirle a
// Aram/diseño un asset nuevo con la leyenda "Contactanos" en vez de re-usar
// el de "Crear mi tienda".

export default function CTA() {
  return (
    <section id="contacto" className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Tu marca merece su propia tienda.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-zinc-500">
          Contactanos y armamos tu tienda a medida.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="mailto:info@gounuri.com"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Contactanos
          </a>
          <a
            href="https://instagram.com/gounuri.com"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-8 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Escribinos por Instagram
          </a>
        </div>
      </div>
    </section>
  )
}
