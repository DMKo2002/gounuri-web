// GET /api/billing/payment-settings — expone platform_billing_settings a
// componentes cliente que no pueden leerlo directo de la base (a diferencia
// de /perfil/plan/page.tsx, que es server component y le pasa paymentSettings
// como prop a PlanSelector). Usado por /onboarding, paso "Pago" (2026-08-22):
// ahí también se puede pagar por transferencia si Mercado Pago está apagado,
// mismo criterio que /perfil/plan.
//
// Solo requiere sesión — no hay nada sensible acá (CBU/alias/WhatsApp/mail de
// contacto ya se muestran tal cual a cualquier tenant logueado en
// /perfil/plan), pero sin sesión no tiene sentido exponerlo igual.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlatformPaymentSettings } from '@/lib/platformBilling'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const service = createServiceClient()
  const settings = await getPlatformPaymentSettings(service)
  return NextResponse.json(settings)
}
