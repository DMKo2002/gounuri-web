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

// "new:userId:planId:months" — pedido 2026-08-18: "selecciona el plan - paga
// - recién con el pago queda generado la tienda - onboarding". Se usa cuando
// alguien elige un plan pago desde la landing SIN tener tienda todavía (ver
// /api/ir-a-plan) — no existe tenantId para meter en el external_reference
// porque a propósito no se crea ningún tenant hasta que el webhook de
// Panel Admin confirme 'authorized' (así no quedan tiendas "(pendiente)"
// huérfanas de gente que arrancó a pagar y no terminó). Debe coincidir
// exactamente con panel-admin/src/lib/billing.ts (ese archivo es el que
// efectivamente lo parsea en el webhook).
export function buildSignupExternalReference(userId: string, planId: PlanId, months: BillingTerm): string {
  return `new:${userId}:${planId}:${months}`
}

async function postPreapproval(opts: {
  reason: string
  externalReference: string
  payerEmail: string
  backUrl: string
  months: BillingTerm
  amount: number
}): Promise<Preapproval> {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: opts.reason,
      external_reference: opts.externalReference,
      payer_email: opts.payerEmail,
      back_url: opts.backUrl,
      auto_recurring: {
        frequency: opts.months,
        frequency_type: 'months',
        transaction_amount: opts.amount,
        currency_id: 'ARS',
      },
      status: 'pending',
    }),
  })
  if (!res.ok) throw new Error(`[billing] MP preapproval falló (${res.status}): ${await res.text()}`)
  return res.json()
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

  return postPreapproval({
    reason,
    externalReference: buildExternalReference(opts.tenantId, opts.planId),
    payerEmail: opts.payerEmail,
    backUrl: opts.backUrl,
    months,
    amount,
  })
}

// Igual que createPreapproval pero para alguien que todavía NO tiene tienda
// (llega desde la landing, ver /api/ir-a-plan). No hay tenantId — el
// external_reference lleva el userId y recién se crea el tenant cuando el
// webhook confirma el pago.
export async function createSignupPreapproval(opts: {
  userId: string
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

  return postPreapproval({
    reason,
    externalReference: buildSignupExternalReference(opts.userId, opts.planId, months),
    payerEmail: opts.payerEmail,
    backUrl: opts.backUrl,
    months,
    amount,
  })
}

export function billingEnabled(): boolean {
  return process.env.BILLING_ENABLED === 'true'
}
