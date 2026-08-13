// Suscripciones de Gounuri vía MercadoPago Preapproval (débito automático).
// Mismo patrón que /api/baja (misma cuenta de MP de GOUNURI, mismo fetch
// directo a la API) — antes esto vivía solo en Panel Admin/src/lib/billing.ts;
// se portó acá el 2026-08-12 para que el pago se haga en gounuri.com en vez
// de tener que entrar al Panel Admin. El webhook (que confirma el pago y
// activa el plan) se queda en Panel Admin — a MP no le importa qué sitio creó
// el preapproval, solo pega al webhook configurado en su cuenta.

import { PLANES } from './site'
import { priceForTerm, type PlanId, type BillingTerm } from './plans'

const MP_API = 'https://api.mercadopago.com'

function token(): string {
  const t = process.env.GOUNURI_MP_ACCESS_TOKEN
  if (!t) throw new Error('[billing] Falta GOUNURI_MP_ACCESS_TOKEN en las variables de entorno')
  return t
}

export interface Preapproval {
  id: string
  status: string
  init_point?: string
}

// external_reference = "tenantId:planId" — el webhook de Panel Admin lo
// parsea igual sin importar de dónde vino el preapproval.
export function buildExternalReference(tenantId: string, planId: PlanId): string {
  return `${tenantId}:${planId}`
}

export async function createPreapproval(opts: {
  tenantId: string
  planId: PlanId
  payerEmail: string
  backUrl: string
  months?: BillingTerm
}): Promise<Preapproval> {
  const plan = PLANES.find(p => p.id === opts.planId)
  if (!plan) throw new Error(`[billing] plan desconocido: ${opts.planId}`)
  const months = opts.months ?? 1
  const amount = priceForTerm(opts.planId, months)
  const reason = months === 1
    ? `Gounuri — Plan ${plan.nombre}`
    : `Gounuri — Plan ${plan.nombre} (${months} meses)`

  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason,
      external_reference: buildExternalReference(opts.tenantId, opts.planId),
      payer_email: opts.payerEmail,
      back_url: opts.backUrl,
      auto_recurring: {
        frequency: months,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'ARS',
      },
      status: 'pending',
    }),
  })
  if (!res.ok) throw new Error(`[billing] MP preapproval falló (${res.status}): ${await res.text()}`)
  return res.json()
}

export function billingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true'
}
