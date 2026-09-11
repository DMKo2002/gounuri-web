// POST /api/referidos/usar-mes-gratis — canjea 1 mes del saldo de meses
// gratis ganados por referidos (2026-09). Espejo del mismo endpoint en
// Panel Admin (panel-admin/src/app/api/referidos/usar-mes-gratis) — ver ese
// archivo para el razonamiento completo de por qué reusa el mecanismo de
// "dar de baja" en vez de pausar/reactivar en Mercado Pago.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cancelPreapproval } from '@/lib/billing'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const service = createServiceClient()
  const { data: userRows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const userRow = userRows?.[0]
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
  if (userRow.role === 'staff') return NextResponse.json({ error: 'Solo el owner puede canjear meses gratis' }, { status: 403 })
  const tenantId = userRow.tenant_id

  const { data: tenantRows } = await service
    .from('tenants')
    .select('meses_gratis_disponibles, legacy_manual_billing, mp_preapproval_id, next_billing_date, plan_status, trial_ends_at, manual_paid_until')
    .eq('id', tenantId)
    .limit(1)
  const tenant = tenantRows?.[0]
  if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })

  if ((tenant.meses_gratis_disponibles ?? 0) < 1) {
    return NextResponse.json({ error: 'No tenés meses gratis disponibles todavía.' }, { status: 400 })
  }

  if (tenant.legacy_manual_billing) {
    return NextResponse.json(
      { error: 'Tu plan lo gestiona el equipo de Gounuri directamente — escribinos para canjear tu mes gratis.' },
      { status: 403 },
    )
  }

  const now = new Date()

  try {
    if (tenant.plan_status === 'trial') {
      const base = tenant.trial_ends_at && new Date(tenant.trial_ends_at) > now ? new Date(tenant.trial_ends_at) : now
      const nuevaFecha = addMonths(base, 1)
      const { data: ok } = await service.rpc('decrement_meses_gratis', { p_tenant_id: tenantId, p_meses: 1 })
      if (!ok) return NextResponse.json({ error: 'No tenés meses gratis disponibles todavía.' }, { status: 400 })
      await service.from('tenants').update({
        trial_ends_at: nuevaFecha.toISOString(),
        trial_warned_at: null,
      }).eq('id', tenantId)
      return NextResponse.json({ ok: true, tipo: 'trial_extendido', hasta: nuevaFecha.toISOString() })
    }

    if (tenant.mp_preapproval_id) {
      const base = tenant.next_billing_date && new Date(tenant.next_billing_date) > now ? new Date(tenant.next_billing_date) : now
      const nuevaFecha = addMonths(base, 1)
      try {
        await cancelPreapproval(tenant.mp_preapproval_id)
      } catch (e) {
        console.error('[referidos/usar-mes-gratis] no se pudo cancelar el preapproval', e)
        return NextResponse.json({ error: 'No se pudo procesar el canje. Probá de nuevo en un momento.' }, { status: 500 })
      }
      const { data: ok } = await service.rpc('decrement_meses_gratis', { p_tenant_id: tenantId, p_meses: 1 })
      if (!ok) return NextResponse.json({ error: 'No tenés meses gratis disponibles todavía.' }, { status: 400 })
      await service.from('tenants').update({
        billing_paused_by_user: true,
        next_billing_date: nuevaFecha.toISOString(),
        mp_preapproval_id: null,
      }).eq('id', tenantId)
      return NextResponse.json({ ok: true, tipo: 'mp_cancelado_y_extendido', hasta: nuevaFecha.toISOString() })
    }

    if (tenant.manual_paid_until) {
      const base = new Date(tenant.manual_paid_until) > now ? new Date(tenant.manual_paid_until) : now
      const nuevaFecha = addMonths(base, 1)
      const { data: ok } = await service.rpc('decrement_meses_gratis', { p_tenant_id: tenantId, p_meses: 1 })
      if (!ok) return NextResponse.json({ error: 'No tenés meses gratis disponibles todavía.' }, { status: 400 })
      await service.from('tenants').update({
        manual_paid_until: nuevaFecha.toISOString(),
        manual_payment_warned_at: null,
        manual_payment_final_warned_at: null,
      }).eq('id', tenantId)
      return NextResponse.json({ ok: true, tipo: 'manual_extendido', hasta: nuevaFecha.toISOString() })
    }

    return NextResponse.json(
      { error: 'No encontramos una suscripción activa para extender. Escribinos si esto no es lo que esperabas.' },
      { status: 400 },
    )
  } catch (e) {
    console.error('[referidos/usar-mes-gratis]', e)
    return NextResponse.json({ error: 'No se pudo procesar el canje. Probá de nuevo.' }, { status: 500 })
  }
}
