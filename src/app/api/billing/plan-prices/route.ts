// GET /api/billing/plan-prices — expone platform_plan_prices a componentes
// cliente que no pueden leerlo directo de la base (a diferencia de
// /perfil/plan/page.tsx, que es server component y le pasa planPrices como
// prop a PlanSelector). Usado por /onboarding, paso "Plan" (2026-08-29,
// pedido de ARam: precios editables desde Panel Admin /superadmin/planes,
// sin redeploy) — mismo criterio que /api/billing/payment-settings.
//
// Solo requiere sesión — no hay nada sensible acá (el precio de cada plan ya
// se muestra tal cual a cualquier visitante en la landing pública), pero sin
// sesión no tiene sentido exponerlo igual.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlatformPlanPrices } from '@/lib/platformPlanPrices'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const service = createServiceClient()
  const prices = await getPlatformPlanPrices(service)
  return NextResponse.json(prices)
}
