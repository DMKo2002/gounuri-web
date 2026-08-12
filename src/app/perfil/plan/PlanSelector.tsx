'use client'

// Cards de cambio de plan — portado de Panel Admin/src/components/UpgradePlans.tsx
// (2026-08-12) para que el pago se haga acá en gounuri.com en vez de tener
// que entrar al Panel Admin. Solo Mercado Pago (Preapproval) — la "tarjeta
// directa" sigue apagada en el Panel Admin (ver comentario en UpgradePlans.tsx)
// y no se portó acá todavía.

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { PLANES } from '@/lib/site'
import { priceForTerm, TERM_DISCOUNTS, isPlanId, type PlanId, type BillingTerm } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function PlanSelector({ currentPlan, trialing }: { currentPlan: string; trialing: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [payerEmail, setPayerEmail] = useState('')
  const [term, setTerm] = useState<BillingTerm>(1)

  const searchParams = useSearchParams()
  const sectionRef = useRef<HTMLDivElement>(null)
  const [highlightPlan, setHighlightPlan] = useState<PlanId | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setPayerEmail(data.user.email)
    })
  }, [])

  useEffect(() => {
    const planParam = searchParams.get('plan')
    if (isPlanId(planParam)) {
      setHighlightPlan(planParam)
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const t = setTimeout(() => setHighlightPlan(null), 2500)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function subscribe(planId: PlanId) {
    if (!EMAIL_RE.test(payerEmail.trim())) {
      setError('Ingresá el email de la cuenta de Mercado Pago con la que vas a pagar.')
      return
    }
    setLoading(planId)
    setError(null)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, payerEmail: payerEmail.trim(), months: term }),
      })
      const json = await res.json()
      if (!res.ok || !json.init_point) throw new Error(json.error ?? 'Error desconocido')
      window.location.href = json.init_point
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la suscripción')
      setLoading(null)
    }
  }

  return (
    <div ref={sectionRef}>
      <h2 className="text-lg font-semibold text-zinc-900">Cambiar de plan</h2>
      <p className="mt-1 text-sm text-zinc-500">
        El débito es automático. Podés cancelar cuando quieras y tu tienda vuelve al plan gratuito.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Email de tu cuenta de Mercado Pago</label>
        <input
          type="email"
          className="max-w-sm w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          value={payerEmail}
          onChange={e => setPayerEmail(e.target.value)}
          placeholder="tu@email.com"
        />
        <p className="mt-1 text-xs text-zinc-400">
          Tiene que ser el email de la cuenta de Mercado Pago con la que vas a autorizar el pago — no hace falta que sea el mismo con el que entrás acá. Si no coincide con la cuenta de MP que uses al pagar, Mercado Pago va a rechazar el pago.
        </p>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-zinc-700 mb-1">Plazo de pago</label>
        <div className="inline-flex rounded-lg border border-zinc-200 p-1 bg-zinc-50">
          {([1, 6, 12] as BillingTerm[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${term === t ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
            >
              {t === 1 ? 'Mensual' : `${t} meses`}
              {TERM_DISCOUNTS[t] > 0 && (
                <span className="ml-1 text-emerald-600">-{TERM_DISCOUNTS[t] * 100}%</span>
              )}
            </button>
          ))}
        </div>
        {term > 1 && (
          <p className="mt-1 text-xs text-zinc-400">
            Se cobra el total de los {term} meses de una sola vez — recién vuelve a cobrarte cuando se cumpla el plazo, no todos los meses.
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {PLANES.map(card => {
          const esActual = card.id === currentPlan && !trialing
          return (
            <div
              key={card.id}
              className={`relative flex flex-col rounded-xl border bg-white p-5 transition-shadow ${card.destacado ? 'border-zinc-900' : 'border-zinc-200'} ${highlightPlan === card.id ? 'ring-2 ring-emerald-400' : ''}`}
            >
              {card.destacado && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
                  Recomendado
                </span>
              )}
              <h3 className="font-semibold text-zinc-900">{card.nombre}</h3>
              {term > 1 ? (
                <div className="mt-1">
                  <p className="text-2xl font-bold text-zinc-900">
                    {formatARS(priceForTerm(card.id, term))}
                    <span className="text-sm font-normal text-zinc-500"> total / {term} meses</span>
                  </p>
                  <p className="text-xs text-zinc-400">
                    equivale a {formatARS(Math.round(priceForTerm(card.id, term) / term))}/mes
                  </p>
                </div>
              ) : (
                <p className="mt-1 text-2xl font-bold text-zinc-900">
                  {formatARS(card.precioARS)}
                  <span className="text-sm font-normal text-zinc-500"> /mes</span>
                </p>
              )}
              <ul className="mt-4 flex-1 space-y-2">
                {card.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check size={15} className="mt-0.5 shrink-0 text-zinc-900" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => subscribe(card.id)}
                disabled={esActual || loading !== null}
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  card.destacado
                    ? 'bg-zinc-900 text-white hover:bg-zinc-700'
                    : 'border border-zinc-300 text-zinc-900 hover:border-zinc-900'
                }`}
              >
                {loading === card.id && <Loader2 size={15} className="animate-spin" />}
                {esActual
                  ? 'Tu plan actual'
                  : trialing && card.id === currentPlan
                    ? `Activar ${card.nombre}`
                    : `Pasar a ${card.nombre}`}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        El pago se procesa con MercadoPago. Vas a cargar tu medio de pago en el sitio seguro de MP — nunca guardamos los datos de tu tarjeta.
        Aceptamos tarjetas de crédito y débito bancarias habilitadas para débito automático, o dinero disponible en tu cuenta de MercadoPago.
        No se aceptan tarjetas prepagas ni virtuales (ej. Prex, Uala prepaga) para suscripciones recurrentes.
      </p>
    </div>
  )
}
