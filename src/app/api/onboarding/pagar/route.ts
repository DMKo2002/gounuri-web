// POST /api/onboarding/pagar — último paso del wizard de "Crear mi tienda"
// (2026-08-29, pedido de ARam: invertir el orden a login -> onboarding ->
// pago, en vez de pago -> placeholder -> onboarding).
//
// Con este orden, cuando llega acá el usuario ya cargó nombre/template/
// contacto/redes/métodos de cobro en el wizard — pero todavía NO existe
// ningún tenant (a propósito: así nunca queda una tienda a medio crear si
// no llega a pagar). Este endpoint:
//   1) valida nombre/slug disponible (mismo chequeo que /api/create-tenant),
//   2) guarda ese borrador en gounuri_accounts.pending_signup, y
//   3) arma el signup preapproval de Mercado Pago (mismo mecanismo que ya
//      usaba /api/ir-a-plan) y devuelve init_point para redirigir a pagar.
//
// El tenant recién se crea del lado de Panel Admin cuando el webhook
// confirma 'authorized' — ver panel-admin/src/app/api/billing/webhook
// (rama 'signup'), que lee este mismo borrador para crearlo ya completo,
// sin pasar por ningún placeholder "(pendiente)".

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createSignupPreapproval } from '@/lib/billing'
import { TEMPLATES } from '@/lib/templates'
import { isPlanId, isBillingTerm } from '@/lib/plans'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const {
    name, domain, template,
    whatsapp, instagram, facebook, tiktok, direccion, direccionDespacho,
    mpEnabled, transferEnabled, cashEnabled,
    plan, months: monthsInput, payerEmail: payerEmailInput,
  } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!isPlanId(plan)) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
  const months = isBillingTerm(monthsInput) ? monthsInput : 1
  const payerEmail = typeof payerEmailInput === 'string' && EMAIL_RE.test(payerEmailInput.trim())
    ? payerEmailInput.trim()
    : user.email

  const service = createServiceClient()

  // Si por algún motivo ya tiene tenant (doble submit, o entró de nuevo a
  // este paso después de que el webhook ya haya creado la tienda), no tiene
  // sentido armar otro preapproval de alta — que siga a /perfil.
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  if (_rows?.[0]?.tenant_id) {
    return NextResponse.json({ error: 'Tu cuenta ya tiene una tienda.', alreadyHasTenant: true }, { status: 409 })
  }

  // Mismo chequeo/normalización de slug que /api/create-tenant — avisar acá
  // (antes de mandar a pagar) es mejor que enterarse recién cuando el
  // webhook no pueda crear la tienda después de un pago ya confirmado.
  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'tienda'
  const { data: _slugTaken } = await service.from('tenants').select('id').eq('slug', slug).limit(1)
  if (_slugTaken?.[0]) {
    return NextResponse.json(
      { error: `El nombre "${name.trim()}" ya está en uso. Probá con otro nombre para tu tienda.` },
      { status: 409 }
    )
  }

  const validTemplates = TEMPLATES.map(t => t.slug)
  const chosenTemplate = validTemplates.includes(template) ? template : 'minimalista'

  // Mismos nombres de campo que /api/create-tenant y /api/finalizar-tienda —
  // el webhook (panel-admin) los vuelca tal cual en store_config.
  const draft = {
    name: name.trim(),
    domain: domain?.trim() || null,
    template: chosenTemplate,
    whatsapp: whatsapp?.trim?.() || null,
    instagram: instagram?.trim?.() || null,
    facebook: facebook?.trim?.() || null,
    tiktok: tiktok?.trim?.() || null,
    direccion: direccion?.trim?.() || null,
    direccionDespacho: direccionDespacho?.trim?.() || null,
    mpEnabled: Boolean(mpEnabled),
    transferEnabled: Boolean(transferEnabled),
    cashEnabled: Boolean(cashEnabled),
  }

  const { error: draftError } = await service
    .from('gounuri_accounts')
    .update({ pending_signup: draft })
    .eq('auth_user_id', user.id)
  if (draftError) {
    console.error('[onboarding/pagar] no se pudo guardar el borrador', draftError)
    return NextResponse.json({ error: 'No se pudo guardar tu información. Probá de nuevo.' }, { status: 500 })
  }

  try {
    const origin = new URL(req.url).origin
    const preapproval = await createSignupPreapproval({
      userId: user.id,
      planId: plan,
      payerEmail,
      backUrl: `${origin}/onboarding?paso=confirmando`,
      months,
    })
    if (!preapproval.init_point) throw new Error('MP no devolvió init_point')
    return NextResponse.json({ init_point: preapproval.init_point })
  } catch (e) {
    console.error('[onboarding/pagar]', e)
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Probá de nuevo.' }, { status: 500 })
  }
}
