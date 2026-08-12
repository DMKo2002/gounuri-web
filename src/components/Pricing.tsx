import { Check, MessageCircle, Mail } from 'lucide-react'
import { PLANES, TRIAL_DAYS, formatPrecio, TERM_DISCOUNTS_PCT, CONTACTO_EMAIL, whatsappUrl } from '@/lib/site'

export default function Pricing() {
  return (
    <section id="planes" className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Planes para cada etapa
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          Probá cualquier plan gratis durante {TRIAL_DAYS} días. Sin tarjeta para empezar.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">
          Pagando {6} meses de una ahorrás {TERM_DISCOUNTS_PCT[6]}%, y pagando {12} meses ahorrás {TERM_DISCOUNTS_PCT[12]}%. Elegís el plazo al activar tu plan.
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
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white p-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-semibold text-zinc-900">¿Necesitás algo a medida?</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Catálogos muy grandes, integraciones puntuales o límites distintos a los planes de arriba — armamos un plan Personalizado y evaluamos el precio según el trabajo.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <a
              href={whatsappUrl('Hola! Quiero consultar por un plan personalizado en gounuri.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-black inline-flex items-center gap-2 whitespace-nowrap"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a
              href={`mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent('Consulta por plan personalizado')}`}
              className="btn-outline inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Mail size={16} />
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
