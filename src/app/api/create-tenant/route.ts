// POST /api/create-tenant — crea tenant + store_config + vínculo en users
// para el usuario autenticado, con trial de 7 días del plan elegido.
//
// Espeja la lógica de Panel Admin/src/app/api/create-tenant pero con el
// modelo nuevo: status 'active' de entrada (self-serve), plan_status 'trial'
// y trial_ends_at = now() + TRIAL_DAYS.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { TEMPLATES } from '@/lib/templates'
import { PLANES, TRIAL_DAYS, PANEL_URL } from '@/lib/site'
import { addSlugDomain } from '@/lib/vercel'
import { sendEmail, emailBienvenidaTienda } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const {
    name, domain, template, plan,
    // Contacto y Redes, cargados en el paso "Configurá tu Tienda" del
    // onboarding (src/app/onboarding/page.tsx) — se insertan más abajo en
    // store_config con los mismos nombres de columna que usa la pantalla
    // real de Contacto y Redes del Panel Admin
    // (panel-admin/src/app/dashboard/contacto/page.tsx), para que ya estén
    // cargados cuando el dueño entra por primera vez a su panel.
    whatsapp, instagram, facebook, tiktok, direccion, direccionDespacho,
  } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const service = createServiceClient()

  // Si ya tiene tenant, no crear otro (evita duplicados por doble submit)
  const { data: _existing } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  if (_existing?.[0]?.tenant_id) {
    return NextResponse.json({ ok: true, tenantId: _existing[0].tenant_id, existing: true })
  }

  // El slug es literalmente {slug}.gounuri.com \u2014 antes ac\u00e1 se le pegaba
  // siempre un sufijo random de 4 d\u00edgitos (prueba3-0746) sin chequear si el
  // nombre limpio ya estaba libre, as\u00ed que la tienda nunca quedaba en
  // nombre.gounuri.com como esperar\u00eda el tenant. Ahora: nombre limpio primero,
  // y si ya existe se avisa en vez de generar uno random en silencio.
  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'tienda'

  const { data: _slugTaken } = await service.from('tenants').select('id').eq('slug', slug).limit(1)
  if (_slugTaken?.[0]) {
    return NextResponse.json(
      { error: `El nombre "${name.trim()}" ya est\u00e1 en uso. Prob\u00e1 con otro nombre para tu tienda.` },
      { status: 409 }
    )
  }

  const validTemplates = TEMPLATES.map(t => t.slug)
  const chosenTemplate = validTemplates.includes(template) ? template : 'minimalista'

  const validPlans = PLANES.map(p => p.id)
  const chosenPlan = validPlans.includes(plan) ? plan : 'standard'

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString()

  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .insert({
      slug,
      name: name.trim(),
      domain: domain?.trim() || null,
      template: chosenTemplate,
      plan: chosenPlan,
      plan_status: 'trial',
      trial_ends_at: trialEndsAt,
      status: 'active',
    })
    .select()
    .single()

  if (tenantError) {
    // 23505 = unique_violation \u2014 dos submits casi simult\u00e1neos con el mismo
    // nombre pasaron el chequeo de arriba antes de que el primero terminara
    // de insertar. Poco com\u00fan, pero mismo mensaje claro en vez del error
    // crudo de Postgres.
    if (tenantError.code === '23505') {
      return NextResponse.json(
        { error: `El nombre "${name.trim()}" ya est\u00e1 en uso. Prob\u00e1 con otro nombre para tu tienda.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  const { error: configError } = await service
    .from('store_config')
    .insert({
      tenant_id: tenant.id,
      variant_attributes: [
        { key: 'talle', label: 'Talle', type: 'select', options: ['XS','S','M','L','XL','XXL'] },
        { key: 'color', label: 'Color', type: 'text' },
      ],
      mp_enabled: true,
      transfer_enabled: true,
      pickup_enabled: true,
      // Ver comentario más arriba: mismos nombres de columna que
      // panel-admin/src/app/dashboard/contacto/page.tsx. "direccion" es la
      // que aparece en el pie de la tienda (pickup_address) y
      // "direccionDespacho" la que aparece en los PDFs (store_address) —
      // el nombre de columna real quedó así del lado del Panel Admin, no es
      // un error de este endpoint.
      whatsapp_number: whatsapp?.trim?.() || null,
      instagram_url: instagram?.trim?.() || null,
      facebook_url: facebook?.trim?.() || null,
      tiktok_url: tiktok?.trim?.() || null,
      pickup_address: direccion?.trim?.() || null,
      store_address: direccionDespacho?.trim?.() || null,
    })

  if (configError) return NextResponse.json({ error: configError.message }, { status: 500 })

  const { error: userError } = await service
    .from('users')
    .upsert(
      { id: user.id, email: user.email, tenant_id: tenant.id, role: 'owner' },
      { onConflict: 'id' }
    )

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  // Vincula el tenant recién creado a la cuenta de gounuri (gounuri_accounts)
  // del dueño — best effort: si por algún motivo no hay fila (cuenta vieja,
  // de antes de este flujo), no frena la creación del tenant.
  const { data: accountRow } = await service
    .from('gounuri_accounts')
    .update({ tenant_id: tenant.id })
    .eq('auth_user_id', user.id)
    .select('nombre')
    .limit(1)
    .maybeSingle()

  // Alta de {slug}.gounuri.com en el proyecto de Vercel del template — sin
  // esto la URL que le mandamos al tenant más abajo no resuelve (bug real,
  // ver lib/vercel.ts). Best-effort: si falla (ej. falta VERCEL_TOKEN), no
  // frena la creación del tenant, solo queda sin el dominio de respaldo por
  // ahora — se puede reintentar después con el backfill del superadmin.
  try {
    await addSlugDomain(chosenTemplate, slug)
  } catch (e) {
    console.error('[create-tenant] no se pudo dar de alta el dominio en Vercel', e)
  }

  // Notificación al admin + bienvenida al tenant (best effort, no bloqueante)
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const adminEmail = process.env.ADMIN_EMAIL ?? 'dmko2002@gmail.com'
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'gounuri <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🆕 Nuevo tenant (trial ${TRIAL_DAYS} días): ${name.trim()}`,
        html: `
          <h2>Nuevo tenant registrado desde gounuri.com</h2>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Tienda:</strong> ${name.trim()}</p>
          <p><strong>Template:</strong> ${chosenTemplate} · <strong>Plan:</strong> ${chosenPlan} (trial hasta ${trialEndsAt.slice(0, 10)})</p>
          <p><strong>Tenant ID:</strong> <code>${tenant.id}</code></p>
        `,
      }),
    }).catch(() => {})

    if (user.email) {
      const chosenPlanObj = PLANES.find(p => p.id === chosenPlan)
      sendEmail({
        to: user.email,
        subject: `¡Tu tienda ${name.trim()} está lista! — gounuri`,
        html: emailBienvenidaTienda({
          nombre: accountRow?.nombre ?? name.trim(),
          storeName: name.trim(),
          storeUrl: `https://${slug}.gounuri.com`,
          panelUrl: PANEL_URL,
          loginEmail: user.email,
          planNombre: chosenPlanObj?.nombre ?? chosenPlan,
          trialDays: TRIAL_DAYS,
        }),
      }).catch(e => console.error('[email bienvenida tienda] error:', e))
    }
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id })
}
