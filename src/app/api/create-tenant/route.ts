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

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { name, domain, template, plan } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  const service = createServiceClient()

  // Si ya tiene tenant, no crear otro (evita duplicados por doble submit)
  const { data: _existing } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  if (_existing?.[0]?.tenant_id) {
    return NextResponse.json({ ok: true, tenantId: _existing[0].tenant_id, existing: true })
  }

  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now().toString().slice(-4)

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

  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 })

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
    })

  if (configError) return NextResponse.json({ error: configError.message }, { status: 500 })

  const { error: userError } = await service
    .from('users')
    .upsert(
      { id: user.id, email: user.email, tenant_id: tenant.id, role: 'owner' },
      { onConflict: 'id' }
    )

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

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
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'gounuri <onboarding@resend.dev>',
          to: [user.email],
          subject: `¡Tu tienda ${name.trim()} está lista! — gounuri`,
          html: `
            <h2>¡Bienvenido a gounuri!</h2>
            <p>Tu tienda <strong>${name.trim()}</strong> ya está creada. Tenés <strong>${TRIAL_DAYS} días gratis</strong> para probarla.</p>
            <p>Tu tienda pública: <a href="https://${slug}.gounuri.com">https://${slug}.gounuri.com</a></p>
            <p>Administrala desde el panel: <a href="${PANEL_URL}/dashboard">${PANEL_URL}/dashboard</a></p>
          `,
        }),
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id })
}
