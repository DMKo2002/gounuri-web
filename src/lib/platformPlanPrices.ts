// Lee platform_plan_prices — precio mensual vigente de mini/standard/premium,
// editable desde Panel Admin /superadmin/planes sin redeploy (2026-08-29,
// pedido de ARam: en Argentina el precio necesita poder ajustarse seguido
// por inflación). Misma tabla que Panel Admin/src/lib/platformPlanPrices.ts
// lee — es una sola base Supabase compartida entre los dos repos.
//
// PLANES (site.ts) sigue siendo la fuente de verdad para todo lo que NO es
// precio (nombre/descripción/features) — precioARS ahí queda solo como
// fallback si la tabla todavía no tiene esa fila (o la consulta falla).
//
// A propósito esto nunca le pega a la API de Mercado Pago — ver comentario
// en Panel Admin/src/app/api/superadmin/update-plan-prices/route.ts.
import type { SupabaseClient } from '@supabase/supabase-js'
import { PLANES } from '@/lib/site'
import type { PlanId } from '@/lib/plans'

export type PlanPrices = Record<PlanId, number>

function fallbackPrices(): PlanPrices {
  const byId = Object.fromEntries(PLANES.map(p => [p.id, p.precioARS])) as PlanPrices
  return byId
}

export async function getPlatformPlanPrices(service: SupabaseClient): Promise<PlanPrices> {
  const { data, error } = await service.from('platform_plan_prices').select('plan_id, precio_ars')
  const prices = fallbackPrices()
  if (error || !data) {
    console.error('[platformPlanPrices] no se pudo leer platform_plan_prices, uso fallback hardcodeado:', error?.message)
    return prices
  }
  for (const row of data) {
    if (row.plan_id === 'mini' || row.plan_id === 'standard' || row.plan_id === 'premium') {
      prices[row.plan_id as PlanId] = row.precio_ars
    }
  }
  return prices
}
