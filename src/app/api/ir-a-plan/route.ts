// GET /api/ir-a-plan?plan=mini|standard|premium&months=1|6|12
//
// A dónde va el botón "Empezar con X" de la página de precios — no siempre a
// /registro.
//   - No logueado           → /registro (arranca el trial, como siempre)
//   - Logueado sin tienda   → /onboarding, con el plan/plazo elegidos como
//                              hint (2026-08-29, pedido de ARam: invertir el
//                              orden a login -> onboarding -> pago). Antes
//                              esto armaba un preapproval de MP directo acá
//                              mismo y recién creaba un tenant placeholder
//                              "(pendiente)" cuando se confirmaba el pago —
//                              ahora el pago queda como último paso del
//                              wizard de onboarding (ver
//                              /api/onboarding/pagar), después de cargar
//                              nombre/template/contacto, así que nunca se
//                              crea nada hasta que el pago esté confirmado.
//   - Logueado con tienda   → /perfil/plan?plan=X (ahí elige plazo —
//                              mensual/6/12 meses — y paga, todo acá mismo en
//                              gounuri.com, sin pasar por el Panel Admin)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { PlanId } from '@/lib/plans'

const VALID_PLANS = ['mini', 'standard', 'premium']
const VALID_MONTHS = [1, 6, 12]

export async function GET(req: Request) {
  const origin = new URL(req.url).origin
  const url = new URL(req.url)
  const planParam = url.searchParams.get('plan')
  const plan = (VALID_PLANS.includes(planParam ?? '') ? planParam! : 'standard') as PlanId
  const monthsParam = Number(url.searchParams.get('months'))
  const months = VALID_MONTHS.includes(monthsParam) ? monthsParam : 1

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Sin loguear (2026-08-26, pedido de ARam -- reportado en vivo, entrando
  // desde "Empezar con Mini" en incógnito): antes esto mandaba a /registro
  // pelado y se perdía el plan elegido -- volvía siempre al trial genérico
  // en vez de a pagar. Ahora manda con ?intent=pago&plan=X&months=Y (mismo
  // mecanismo que usan los botones "Crear mi tienda", ver REGISTRO_PAGO_URL
  // en @/lib/site) -- plan/months acá ya están validados arriba.
  if (!user) return NextResponse.redirect(`${origin}/registro?intent=pago&plan=${plan}&months=${months}`)

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id

  if (!tenantId) {
    // El wizard de /onboarding lee estas mismas cookies que ya usa /registro
    // (gounuri_plan/gounuri_months) para preseleccionar el plan en el paso
    // "Plan" — y gounuri_intent=pago para saber que tiene que terminar en
    // plan/pago en vez de crear la tienda gratis de una.
    const res = NextResponse.redirect(`${origin}/onboarding`)
    res.cookies.set('gounuri_intent', 'pago', { path: '/', maxAge: 3600, sameSite: 'lax' })
    res.cookies.set('gounuri_plan', plan, { path: '/', maxAge: 3600, sameSite: 'lax' })
    res.cookies.set('gounuri_months', String(months), { path: '/', maxAge: 3600, sameSite: 'lax' })
    return res
  }

  return NextResponse.redirect(`${origin}/perfil/plan?plan=${plan}`)
}
