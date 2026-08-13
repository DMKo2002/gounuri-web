// Precios y plazos de pago para /perfil/plan — usa PLANES (site.ts) como
// única fuente de precio mensual, para no terminar con un tercer lugar
// (además de Panel Admin/src/lib/plans.ts) donde hardcodear los mismos
// números y que se desincronicen entre sí.

import { PLANES } from './site'

export type PlanId = 'mini' | 'standard' | 'premium'
export type BillingTerm = 1 | 6 | 12

export const TERM_DISCOUNTS: Record<BillingTerm, number> = {
  1: 0,
  6: 0.10,
  12: 0.20,
}

export function isBillingTerm(v: unknown): v is BillingTerm {
  return v === 1 || v === 6 || v === 12
}

export function isPlanId(v: unknown): v is PlanId {
  return v === 'mini' || v === 'standard' || v === 'premium'
}

function precioMensual(planId: PlanId): number {
  const p = PLANES.find(p => p.id === planId)
  if (!p) throw new Error(`[plans] plan desconocido: ${planId}`)
  return p.precioARS
}

// Precio TOTAL a cobrar por el plazo elegido (ya con el descuento aplicado).
export function priceForTerm(planId: PlanId, months: BillingTerm): number {
  const discount = TERM_DISCOUNTS[months]
  return Math.round(precioMensual(planId) * months * (1 - discount))
}
