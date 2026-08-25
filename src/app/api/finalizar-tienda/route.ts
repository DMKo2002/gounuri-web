// POST /api/finalizar-tienda — completa con los datos reales (nombre, slug,
// template, dominio, contacto y redes) el tenant placeholder que se creó en
// /api/ir-a-plan cuando alguien eligió un plan pago desde la landing sin
// tener tienda todavía. Se llama desde el paso final de /onboarding
// (pantalla "Escalá con tus Ventas") para quien ya pagó.
//
// A propósito es un UPDATE, no un INSERT — y a propósito el único tenant que
// puede tocar es uno cuyo name siga siendo exactamente
// PLACEHOLDER_TENANT_NAME: así nunca puede pisar el nombre/slug/template de
// una tienda real ya en uso, ni siquiera por error o doble submit.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TEMPLATES } from '@/lib/templates'
import { PLACEHOLDER_TENANT_NAME, PANEL_URL, PLANES } from '@/lib/site'
import { addSlugDomain } from '@/lib/vercel'
import { sendEmail, emailBienvenidaTienda } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const {
    name, domain, template,
    // Mismos nombres/columnas que /api/create-tenant — ver ese archivo.
    whatsapp, instagram, facebook, tiktok, direccion, direccionDespacho,
    mpEnabled, transferEnabled, cashEnabled,
  } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const service = createServiceClient()

  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) return NextResponse.json({ error: 'No se encontró ninguna tienda para completar' }, { status: 404 })

  const { data: _tenantRows } = await service.from('tenants').select('id, name, plan').eq('id', tenantId).limit(1)
  const tenant = _tenantRows?.[0]
  // Guardia central: si el nombre ya no es el sentinel, esta tienda ya se
  // terminó de configurar (o nunca fue un placeholder) — no tocar nada.
  if (!tenant || tenant.name !== PLACEHOLDER_TENANT_NAME) {
    return NextResponse.json({ ok: true, tenantId, alreadyFinished: true })
  }

  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'tienda'

  const { data: _slugTaken } = await service.from('tenants').select('id').eq('slug', slug).neq('id', tenantId).limit(1)
  if (_slugTaken?.[0]) {
    return NextResponse.json(
      { error: `El nombre "${name.trim()}" ya está en uso. Probá con otro nombre para tu tienda.` },
      { status: 409 }
    )
  }

  const validTemplates = TEMPLATES.map(t => t.slug)
  const chosenTemplate = validTemplates.includes(template) ? template : 'minimalista'

  const { error: tenantError } = await service
    .from('tenants')
    .update({
      slug,
      name: name.trim(),
      domain: domain?.trim() || null,
      template: chosenTemplate,
    })
    .eq('id', tenantId)

  if (tenantError) {
    if (tenantError.code === '23505') {
      return NextResponse.json(
        { error: `El nombre "${name.trim()}" ya está en uso. Probá con otro nombre para tu tienda.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  // store_config puede no existir todavía (el placeholder de /api/ir-a-plan
  // no lo crea) — upsert por las dudas, sin pisar configuración si por algún
  // motivo ya existiera (ej. reintento).
  const { data: _configRows } = await service.from('store_config').select('id').eq('tenant_id', tenantId).limit(1)
  if (!_configRows?.[0]) {
    const { error: configError } = await service
      .from('store_config')
      .insert({
        tenant_id: tenantId,
        variant_attributes: [
          { key: 'talle', label: 'Talle', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
          { key: 'color', label: 'Color', type: 'text' },
        ],
        mp_enabled: Boolean(mpEnabled),
        transfer_enabled: Boolean(transferEnabled),
        cash_enabled: Boolean(cashEnabled),
        pickup_enabled: true,
        whatsapp_number: whatsapp?.trim?.() || null,
        instagram_url: instagram?.trim?.() || null,
        facebook_url: facebook?.trim?.() || null,
        tiktok_url: tiktok?.trim?.() || null,
        pickup_address: direccion?.trim?.() || null,
        store_address: direccionDespacho?.trim?.() || null,
      })
    if (configError) return NextResponse.json({ error: configError.message }, { status: 500 })
  } else {
    await service
      .from('store_config')
      .update({
        whatsapp_number: whatsapp?.trim?.() || null,
        instagram_url: instagram?.trim?.() || null,
        facebook_url: facebook?.trim?.() || null,
        tiktok_url: tiktok?.trim?.() || null,
        pickup_address: direccion?.trim?.() || null,
        store_address: direccionDespacho?.trim?.() || null,
        mp_enabled: Boolean(mpEnabled),
        transfer_enabled: Boolean(transferEnabled),
        cash_enabled: Boolean(cashEnabled),
      })
      .eq('tenant_id', tenantId)
  }

  // Vincula el tenant a gounuri_accounts, igual que /api/create-tenant.
  const { data: accountRow } = await service
    .from('gounuri_accounts')
    .update({ tenant_id: tenantId })
    .eq('auth_user_id', user.id)
    .select('nombre')
    .limit(1)
    .maybeSingle()

  try {
    await addSlugDomain(chosenTemplate, slug)
  } catch (e) {
    console.error('[finalizar-tienda] no se pudo dar de alta el dominio en Vercel', e)
  }

  if (user.email) {
    const planObj = PLANES.find(p => p.id === tenant.plan)
    sendEmail({
      to: user.email,
      subject: `¡Tu tienda ${name.trim()} está lista! — gounuri`,
      html: emailBienvenidaTienda({
        nombre: accountRow?.nombre ?? name.trim(),
        storeName: name.trim(),
        storeUrl: `https://${slug}.gounuri.com`,
        panelUrl: PANEL_URL,
        loginEmail: user.email,
        planNombre: planObj?.nombre ?? tenant.plan ?? '',
        trialDays: 0,
        paid: true,
      }),
    }).catch(e => console.error('[finalizar-tienda] email bienvenida error:', e))
  }

  return NextResponse.json({ ok: true, tenantId })
}
