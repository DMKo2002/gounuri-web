// POST /api/billing/cancel — "dar de baja del servicio" desde gounuri.com.
//
// Portado de Panel Admin/src/app/api/billing/cancel/route.ts (el original,
// 2026-08-25) — PlanSelector.tsx ya vive en gounuri-web y le pega a esta
// ruta relativa, pero nunca se había creado acá: la primera prueba tiró 404
// (HTML de Next.js), que rompía el fetch del cliente con
// "Unexpected token '<', <!DOCTYPE... is not valid JSON".
//
// Cancela el preapproval de Mercado Pago del tenant (no le vuelven a
// cobrar), pero NO baja el plan al instante: el servicio sigue activo hasta
// next_billing_date (ver PlanSelector.tsx, "tenés total libertad para
// cancelar cuando quieras"). El cron de Panel Admin (/api/cron/enforce,
// sección 5) es quien baja el plan a gratis cuando llega esa fecha — acá
// solo se marca la intención con billing_paused_by_user, para que ese
// vencimiento no se confunda con un cobro fallido (que sí dispara avisos).
//
// No reactiva solo: volver a suscribirse después de cancelar es un
// preapproval nuevo, con una autorización nueva (ver /api/billing/subscribe)
// — MP no permite reanudar un preapproval ya cancelado.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cancelPreapproval } from '@/lib/billing'
import { getPlatformPaymentSettings } from '@/lib/platformBilling'

export async function POST() {
  const service = createServiceClient()

  // Mismo gate que /api/billing/subscribe (ver ese archivo) — movido de
  // BILLING_ENABLED a platform_billing_settings el 2026-08-22.
  const paymentSettings = await getPlatformPaymentSettings(service)
  if (!paymentSettings.mercadopagoEnabled) {
    return NextResponse.json({ error: 'El pago con Mercado Pago todavía no está habilitado' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: _rows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const userRow = _rows?.[0]
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  if (userRow.role === 'staff') return NextResponse.json({ error: 'Solo el dueño de la tienda puede dar de baja el plan' }, { status: 403 })
  const tenantId = userRow.tenant_id

  // Aislamiento — ver /api/billing/subscribe y memoria de proyecto "Gounuri
  // billing/subscriptions". Tenants legacy nunca deben poder cancelar nada
  // desde acá.
  const { data: _tenantRows } = await service
    .from('tenants').select('legacy_manual_billing, mp_preapproval_id, next_billing_date').eq('id', tenantId).limit(1)
  const tenantRow = _tenantRows?.[0]
  if (tenantRow?.legacy_manual_billing) {
    return NextResponse.json(
      { error: 'Tu plan lo gestiona el equipo de Gounuri directamente — escribinos para darlo de baja.' },
      { status: 403 }
    )
  }
  if (!tenantRow?.mp_preapproval_id) {
    return NextResponse.json({ error: 'No tenés una suscripción de Mercado Pago activa para dar de baja.' }, { status: 400 })
  }

  try {
    await cancelPreapproval(tenantRow.mp_preapproval_id)
  } catch (e) {
    console.error('[billing/cancel]', e)
    return NextResponse.json({ error: 'No se pudo dar de baja la suscripción. Probá de nuevo.' }, { status: 500 })
  }

  await service.from('tenants').update({
    mp_preapproval_id: null,
    billing_paused_by_user: true,
  }).eq('id', tenantId)

  return NextResponse.json({ ok: true, activeUntil: tenantRow.next_billing_date ?? null })
}
