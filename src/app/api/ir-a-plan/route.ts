// GET /api/ir-a-plan?plan=mini|standard|premium
//
// A dónde va el botón "Empezar con X" de la página de precios — no siempre a
// /registro. Antes mandaba SIEMPRE a /registro, incluso si ya estabas
// logueado y ya tenías una tienda (bug reportado 2026-08-12: alguien logueado
// apretaba "Empezar con Business" y terminaba en la pantalla de crear cuenta
// de nuevo, sin sentido). Ahora:
//   - No logueado           → /registro (arranca el trial, como siempre)
//   - Logueado sin tienda   → /onboarding (ya tiene cuenta, solo le falta la tienda)
//   - Logueado con tienda   → Panel Admin /dashboard/uso?plan=X (ahí elige
//                              plazo — mensual/6/12 meses — y paga)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PANEL_URL } from '@/lib/site'

const VALID_PLANS = ['mini', 'standard', 'premium']

export async function GET(req: Request) {
  const origin = new URL(req.url).origin
  const planParam = new URL(req.url).searchParams.get('plan')
  const plan = VALID_PLANS.includes(planParam ?? '') ? planParam : 'standard'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/registro`)

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) return NextResponse.redirect(`${origin}/onboarding`)

  return NextResponse.redirect(`${PANEL_URL}/dashboard/uso?plan=${plan}`)
}
