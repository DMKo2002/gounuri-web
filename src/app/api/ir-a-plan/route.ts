// GET /api/ir-a-plan?plan=mini|standard|premium&months=1|6|12
//
// A dónde va el botón "Empezar con X" de la página de precios — no siempre a
// /registro. Antes mandaba SIEMPRE a /registro, incluso si ya estabas
// logueado y ya tenías una tienda (bug reportado 2026-08-12). Ahora:
//   - No logueado           → /registro (arranca el trial, como siempre)
//   - Logueado sin tienda   → NO se crea ningún tenant todavía — pedido
//                              2026-08-18: "selecciona el plan - paga - recién
//                              con el pago queda generado la tienda -
//                              onboarding". Se crea directamente un preapproval
//                              de MP con un external_reference tipo
//                              "new:userId:planId:months" (sin tenantId) y se
//                              manda al checkout hospedado de MP. Recién
//                              cuando el webhook de Panel Admin confirme
//                              'authorized' se crea el tenant (ver
//                              panel-admin/src/app/api/billing/webhook). El
//                              back_url apunta a /onboarding?paso=confirmando,
//                              que sondea /api/mi-estado-onboarding hasta que
//                              el tenant exista.
//   - Logueado con tienda   → /perfil/plan?plan=X (ahí elige plazo —
//                              mensual/6/12 meses — y paga, todo acá mismo en
//                              gounuri.com, sin pasar por el Panel Admin)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createSignupPreapproval } from '@/lib/billing'
import type { BillingTerm, PlanId } from '@/lib/plans'

const VALID_PLANS = ['mini', 'standard', 'premium']
const VALID_MONTHS = [1, 6, 12]

export async function GET(req: Request) {
  const origin = new URL(req.url).origin
  const url = new URL(req.url)
  const planParam = url.searchParams.get('plan')
  const plan = (VALID_PLANS.includes(planParam ?? '') ? planParam! : 'standard') as PlanId
  const monthsParam = Number(url.searchParams.get('months'))
  const months = (VALID_MONTHS.includes(monthsParam) ? monthsParam : 1) as BillingTerm

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
    if (!user.email) {
      console.error('[ir-a-plan] usuario sin email, no se puede armar el preapproval', user.id)
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    try {
      const preapproval = await createSignupPreapproval({
        userId: user.id,
        planId: plan,
        payerEmail: user.email,
        backUrl: `${origin}/onboarding?paso=confirmando`,
        months,
      })
      if (!preapproval.init_point) throw new Error('MP no devolvió init_point')
      return NextResponse.redirect(preapproval.init_point)
    } catch (e) {
      console.error('[ir-a-plan] no se pudo crear el preapproval de signup', e)
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}/perfil/plan?plan=${plan}`)
}
