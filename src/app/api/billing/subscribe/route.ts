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
import { createPreapproval, billingEnabled } from '@/lib/billing'
import { isPlanId, isBillingTerm } from '@/lib/plans'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  if (!billingEnabled()) {
    return NextResponse.json({ error: 'La facturación todavía no está habilitada' }, { status: 403 })
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

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const userRow = _rows?.[0]
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  if (userRow.role === 'staff') return NextResponse.json({ error: 'Solo el dueño de la tienda puede cambiar el plan' }, { status: 403 })

  try {
    const origin = new URL(req.url).origin
    const preapproval = await createPreapproval({
      tenantId: userRow.tenant_id,
      planId: plan,
      payerEmail,
      backUrl: `${origin}/perfil/plan?sub=pendiente`,
      months,
    })
    // Guardar el id ya mismo — el webhook confirma la activación después
    await service.from('tenants').update({ mp_preapproval_id: preapproval.id }).eq('id', userRow.tenant_id)
    return NextResponse.json({ init_point: preapproval.init_point })
  } catch (e) {
    console.error('[billing/subscribe]', e)
    return NextResponse.json({ error: 'No se pudo iniciar la suscripción. Probá de nuevo.' }, { status: 500 })
  }
}
