// GET /api/mi-estado-onboarding — le dice a /onboarding si el usuario
// logueado ya tiene un tenant placeholder pendiente de completar (eligió un
// plan pago desde la landing sin tener tienda, ver /api/ir-a-plan, y ya
// pagó) — para saltear los pasos "Plan"/"Pago" del wizard y, en el paso
// final, llamar a /api/finalizar-tienda en vez de crear una tienda nueva o
// pedir que elija plan de nuevo.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PLACEHOLDER_TENANT_NAME } from '@/lib/site'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isPlaceholder: false, plan: null })

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) return NextResponse.json({ isPlaceholder: false, plan: null })

  const { data: _tenantRows } = await service.from('tenants').select('name, plan').eq('id', tenantId).limit(1)
  const tenant = _tenantRows?.[0]
  if (!tenant || tenant.name !== PLACEHOLDER_TENANT_NAME) {
    return NextResponse.json({ isPlaceholder: false, plan: null })
  }

  return NextResponse.json({ isPlaceholder: true, plan: tenant.plan ?? null })
}
