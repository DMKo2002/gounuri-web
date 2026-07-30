// POST /api/baja — cancela la suscripción (preapproval de MP) del tenant
// logueado y lo pasa al plan gratuito. Requiere GOUNURI_MP_ACCESS_TOKEN.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const userRow = _rows?.[0]
  if (!userRow?.tenant_id) return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 })
  if (userRow.role === 'staff') return NextResponse.json({ error: 'Solo el dueño de la tienda puede darse de baja' }, { status: 403 })

  const { data: _tenants } = await service
    .from('tenants')
    .select('mp_preapproval_id')
    .eq('id', userRow.tenant_id)
    .limit(1)
  const preapprovalId = _tenants?.[0]?.mp_preapproval_id
  if (!preapprovalId) return NextResponse.json({ error: 'No hay una suscripción activa' }, { status: 400 })

  const token = process.env.GOUNURI_MP_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'La gestión de suscripciones no está disponible en este momento' }, { status: 503 })

  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  })
  if (!res.ok) {
    console.error('[baja] MP error:', res.status, await res.text())
    return NextResponse.json({ error: 'MercadoPago no pudo procesar la baja. Probá de nuevo en unos minutos.' }, { status: 502 })
  }

  await service
    .from('tenants')
    .update({ plan: 'free', plan_status: 'canceled' })
    .eq('id', userRow.tenant_id)

  return NextResponse.json({ ok: true })
}
