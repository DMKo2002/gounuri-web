// GET /api/referidos/validar?code=XXXXXX — endpoint PÚBLICO (sin login,
// se llama desde /registro antes de que exista cuenta) para mostrar "te
// invitó [tienda]" en el form de registro. A propósito devuelve lo mínimo
// (valid + nombre de la tienda) — nunca el tenantId ni nada más, para no
// exponer datos de otros tenants a través de un código adivinado.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false })

  const service = createServiceClient()
  const { data } = await service
    .from('tenants')
    .select('name')
    .eq('referral_code', code)
    .limit(1)
    .maybeSingle()

  if (!data) return NextResponse.json({ valid: false })
  return NextResponse.json({ valid: true, tiendaName: data.name })
}
