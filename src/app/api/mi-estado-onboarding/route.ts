// GET /api/mi-estado-onboarding — le dice a /onboarding en qué estado está
// la tienda del usuario logueado, para dos casos:
//
//  - ready: true   → el webhook de Panel Admin ya creó la tienda REAL y
//    completa (2026-08-29: camino nuevo, "Crear mi tienda" ya pasó por todo
//    el wizard ANTES de pagar — ver /api/onboarding/pagar — así que acá no
//    queda nada por pedirle al usuario, solo mandarlo a /perfil).
//  - isPlaceholder: true → red de seguridad del flujo viejo: un tenant
//    placeholder "(pendiente)" ya pagado pero sin nombre/template/contacto
//    reales todavía (por ejemplo, un pago iniciado por un link viejo que no
//    pasó por el wizard nuevo) — el wizard sigue completándolo vía
//    /api/finalizar-tienda, como siempre.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PLACEHOLDER_TENANT_NAME } from '@/lib/site'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isPlaceholder: false, ready: false, plan: null })

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) return NextResponse.json({ isPlaceholder: false, ready: false, plan: null })

  const { data: _tenantRows } = await service
    .from('tenants')
    .select('name, slug, domain, domain_status, plan')
    .eq('id', tenantId)
    .limit(1)
  const tenant = _tenantRows?.[0]
  if (!tenant) return NextResponse.json({ isPlaceholder: false, ready: false, plan: null })

  if (tenant.name === PLACEHOLDER_TENANT_NAME) {
    return NextResponse.json({ isPlaceholder: true, ready: false, plan: tenant.plan ?? null })
  }

  // 2026-08-26: no tratar un dominio propio todavía sin verificar como si
  // ya fuera la URL real de la tienda — mismo criterio que /perfil y
  // /api/create-tenant.
  const storeUrl = (tenant.domain && tenant.domain_status === 'verified')
    ? `https://${tenant.domain}`
    : `https://${tenant.slug}.gounuri.com`

  return NextResponse.json({ isPlaceholder: false, ready: true, plan: tenant.plan ?? null, storeUrl })
}
