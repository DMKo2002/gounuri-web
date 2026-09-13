// POST /api/billing/subscribe — inicia el upgrade de plan desde gounuri.com.
// Body: { plan: 'mini'|'standard'|'premium', payerEmail?, months? }
// Devuelve { init_point } para redirigir al checkout de MP.
//
// Portado de Panel Admin (2026-08-12) — el pago ahora se hace acá, no hace
// falta entrar al Panel Admin. El webhook que confirma el pago sigue en
// Panel Admin (/api/billing/webhook), no depende de dónde se creó el
// preapproval.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createPreapproval } from '@/lib/billing'
import { getPlatformPaymentSettings } from '@/lib/platformBilling'
import { isPlanId, isBillingTerm } from '@/lib/plans'
import { PLACEHOLDER_TENANT_NAME } from '@/lib/site'


// Descuento por referido (2026-09-11, bug reportado por David en QA: "el
// descuento se hace únicamente por Mercado Pago desde Panel Admin, no desde
// gounuri.com") -- esta ruta nunca había tenido esta lógica, a pesar de que
// Panel Admin (donde SÍ vive el checkout de Suscripción) la tiene desde el
// principio. Mismo criterio exacto que panel-admin/src/app/api/billing/subscribe/route.ts:
// 20% off 2 meses, SOLO plazo mensual, SOLO plan Business (pedido de David).
const REFERIDO_DESCUENTO_PCT = 20

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  const service = createServiceClient()

  // Gate movido de BILLING_ENABLED (env var) a platform_billing_settings
  // (2026-08-22, editable desde Panel Admin /superadmin/pagos) — así el botón
  // que ve el tenant en /perfil/plan y lo que este endpoint realmente permite
  // nunca quedan desincronizados.
  const paymentSettings = await getPlatformPaymentSettings(service)
  if (!paymentSettings.mercadopagoEnabled) {
    return NextResponse.json({ error: 'El pago con Mercado Pago todavía no está habilitado' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { plan, payerEmail: payerEmailInput, months: monthsInput } = await req.json()
  if (!isPlanId(plan)) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  const months = isBillingTerm(monthsInput) ? monthsInput : 1

  // El email que autoriza en MP no tiene por qué ser el email de login (ver
  // Panel Admin/src/app/api/billing/subscribe/route.ts, mismo criterio).
  const payerEmail = typeof payerEmailInput === 'string' && EMAIL_RE.test(payerEmailInput.trim())
    ? payerEmailInput.trim()
    : user.email

  const { data: _rows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const userRow = _rows?.[0]
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  if (userRow.role === 'staff') return NextResponse.json({ error: 'Solo el dueño de la tienda puede cambiar el plan' }, { status: 403 })

  // Si todavía es el tenant placeholder de /api/ir-a-plan (eligió un plan
  // desde la landing sin tener tienda aún), después de pagar tiene que ir a
  // completar su tienda real en /onboarding en vez de volver a /perfil/plan
  // — ahí no hay nada que "ver" todavía. Pedido 2026-08-18.
  const { data: _tenantRows } = await service
    .from('tenants')
    .select('name, referred_by, referido_descuento_hasta, mp_preapproval_id')
    .eq('id', userRow.tenant_id).limit(1)
  const tenantRow = _tenantRows?.[0]
  const isPlaceholderTenant = tenantRow?.name === PLACEHOLDER_TENANT_NAME

  // Se registró con un código de invitación y todavía no usó el descuento
  // por referido -- solo vale la primera vez que se suscribe pagando mes a
  // mes, y SOLO en el plan Business.
  const aplicaDescuentoReferido = months === 1 && plan === 'standard'
    && Boolean(tenantRow?.referred_by) && !tenantRow?.referido_descuento_hasta

  try {
    const origin = new URL(req.url).origin
    const preapproval = await createPreapproval({
      tenantId: userRow.tenant_id,
      planId: plan,
      payerEmail,
      backUrl: isPlaceholderTenant ? `${origin}/onboarding` : `${origin}/perfil/plan?sub=pendiente`,
      months,
      discountPct: aplicaDescuentoReferido ? REFERIDO_DESCUENTO_PCT : undefined,
    })
    // Guardar el id ya mismo — el webhook confirma la activación después.
    // 2026-09-13 (bug reportado por David en QA): referido_descuento_hasta
    // NO se toca acá -- ver el mismo fix en Panel Admin/api/billing/subscribe
    // y api/billing/webhook (ese webhook, en Panel Admin, procesa TODOS los
    // preapprovals sin importar en qué sitio se crearon, así que ya cubre
    // también los que se originan acá).
    await service.from('tenants').update({
      mp_preapproval_id: preapproval.id,
    }).eq('id', userRow.tenant_id)
    return NextResponse.json({ init_point: preapproval.init_point, referidoDescuentoAplicado: aplicaDescuentoReferido })
  } catch (e) {
    console.error('[billing/subscribe]', e)
    return NextResponse.json({ error: 'No se pudo iniciar la suscripción. Probá de nuevo.' }, { status: 500 })
  }
}
