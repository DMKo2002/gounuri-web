// GET /api/onboarding/estado?t=<token> — consulta si la tienda de "Crear mi
// tienda" ya quedó lista, SIN depender de la sesión del usuario (2026-08-29).
//
// La usa /onboarding/listo, la pantalla a la que vuelve Mercado Pago después
// de pagar (ver back_url en /api/onboarding/pagar). No podemos usar
// auth.getUser() ahí porque esa vuelta puede caer en un navegador que no
// comparte cookies con el navegador donde el usuario pagó — confirmado en
// testing por ARam: si el pago se hace desde la app de Mercado Pago en el
// celular, el back_url abre gounuri.com dentro del navegador propio de esa
// app, no en Chrome/Safari. El token (uuid random, generado en
// /api/onboarding/pagar) es lo único que identifica de qué pago se trata.
//
// No expone nada sensible: solo "¿tu tienda ya está lista?" + la URL
// pública de la tienda.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('t')
  if (!token) return NextResponse.json({ error: 'Falta el token' }, { status: 400 })

  const service = createServiceClient()
  const { data: accountRows } = await service
    .from('gounuri_accounts')
    .select('tenant_id')
    .eq('pending_signup_token', token)
    .limit(1)
  const account = accountRows?.[0]
  if (!account) return NextResponse.json({ error: 'invalid_token', ready: false }, { status: 404 })

  if (!account.tenant_id) {
    // El webhook de Mercado Pago todavía no confirmó el pago (o lo está
    // procesando) — nada raro, /onboarding/listo sigue sondeando.
    return NextResponse.json({ ready: false })
  }

  const { data: tenantRows } = await service
    .from('tenants')
    .select('slug, domain, domain_status')
    .eq('id', account.tenant_id)
    .limit(1)
  const tenant = tenantRows?.[0]
  if (!tenant) return NextResponse.json({ ready: false })

  // 2026-08-26: no tratar un dominio propio todavía sin verificar como si
  // ya fuera la URL real de la tienda — mismo criterio que /perfil.
  const storeUrl = (tenant.domain && tenant.domain_status === 'verified')
    ? `https://${tenant.domain}`
    : `https://${tenant.slug}.gounuri.com`

  return NextResponse.json({ ready: true, storeUrl })
}
