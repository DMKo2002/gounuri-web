import { Check } from 'lucide-react'
import { PLANES, TRIAL_DAYS, formatPrecio } from '@/lib/site'

const SIGNATURE_FEATURES = [
  'Ecosistema 100% a medida',
  'Arquitectura y flujos de usuario (UX/UI) diseñados con exclusividad',
  'Funcionalidades complejas',
  'Escalabilidad garantizada: preparadas para crecer al ritmo de la empresa',
  'Integraciones especiales',
]

export default function Pricing() {
  return (
    <section id="planes" className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Planes para cada etapa
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Probá cualquier plan gratis durante {TRIAL_DAYS} días. Sin tarjeta para empezar.
        </p>

        <div className="mt-5 flex justify-center">
          <img
            src="/img/planes-descuento-terminos.svg"
            alt="Pagando semestral ahorrás 10% y pagando anual ahorrás 20%"
            width={407}
            height={35}
            className="h-auto w-full max-w-[407px]"
          />
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  {formatPrecio(plan.precioARS)}
                </span>
                <span className="ml-1 text-sm text-zinc-500">/ mes</span>
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
                href={`/api/ir-a-plan?plan=${plan.id}`}
                className={`mt-8 ${plan.destacado ? 'btn-black' : 'btn-outline'} w-full`}
              >
                Empezar con {plan.nombre}
              </a>
            </div>
          ))}

          {/* Plan Signature — ecosistema a medida, sin precio fijo, se coordina con un especialista */}
          <div className="relative flex flex-col rounded-xl border border-zinc-900 bg-zinc-900 p-8 text-white">
            <h3 className="text-lg font-semibold">Signature</h3>
            <p className="mt-1 text-sm text-zinc-300">
              Para marcas que exigen una identidad digital única y sin límites.
            </p>

            <div className="mt-6">
              <span className="text-3xl font-bold tracking-tight">A medida</span>
            </div>

            <ul className="mt-8 flex-1 space-y-3">
              {SIGNATURE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="https://www.gounuri.com/migracion/contacto"
              className="mt-8 w-full rounded-lg bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Contactá a un especialista
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
