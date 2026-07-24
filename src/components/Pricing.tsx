import { Check } from 'lucide-react'
import { PLANES, REGISTRO_URL } from '@/lib/site'

export default function Pricing() {
  return (
    <section id="planes" className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Planes para cada etapa
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Precios en definición — durante el lanzamiento el acceso es sin costo.
        </p>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANES.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border bg-white p-8 ${
                plan.destacado
                  ? 'border-zinc-900 shadow-md'
                  : 'border-zinc-200'
              }`}
            >
              {plan.destacado && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                  Recomendado
                </span>
              )}

              <h3 className="text-lg font-semibold text-zinc-900">{plan.nombre}</h3>
              <p className="mt-1 text-sm text-zinc-600">{plan.descripcion}</p>

              <div className="mt-6">
                <span className="text-3xl font-bold tracking-tight text-zinc-900">
                  {plan.precio}
                </span>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-zinc-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={REGISTRO_URL}
                className={`mt-8 ${plan.destacado ? 'btn-black' : 'btn-outline'} w-full`}
              >
                Empezar con {plan.nombre}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
