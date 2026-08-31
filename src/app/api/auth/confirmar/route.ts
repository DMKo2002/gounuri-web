// POST /api/auth/confirmar — confirma el mail de registro (ver
// /api/auth/registro) y recién ahí deja al usuario con sesión —
// verifyOtp() setea las cookies de sesión vía el cliente server-side. Sin
// este paso no hay forma de loguearse ni de llegar al onboarding: es lo
// que "bloquea" la cuenta hasta confirmar.
//
// type=magiclink es el mismo circuito pero para el caso "cuenta de Auth ya
// existente (compradora en alguna tienda) enganchada a un perfil nuevo de
// gounuri_accounts" — ver vincularCuentaExistente() en
// /api/auth/registro/route.ts. La fila de gounuri_accounts ya se insertó
// ahí (no hay auth.users nuevo => no corre el trigger), así que acá el
// UPDATE de confirmed_at de abajo aplica igual para los dos casos.
//
// 2026-08-17: esta lógica vivía antes en un GET de /auth/verificar/route.ts
// — se movió a este POST porque un GET que confirma solo (sin acción del
// usuario) queda expuesto a que un escáner de seguridad de mail (Microsoft
// Safe Links, el proxy de Gmail, etc.) pre-consuma el link de un solo uso
// ANTES de que el usuario llegue a hacer click, dejando el link "quemado" y
// al usuario con un "Email link is invalid or has expired" en un link de
// segundos de antigüedad. Ahora /auth/verificar es una page.tsx que muestra
// un botón "Confirmar mi cuenta" y recién llama a este POST cuando el
// usuario hace click — los escáneres no ejecutan JS ni clickean botones.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const TIPOS_VALIDOS = new Set(['signup', 'magiclink'])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token_hash = body?.token_hash
  const type = body?.type

  if (!token_hash || !type || !TIPOS_VALIDOS.has(type)) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'signup' | 'magiclink' })

    if (!error && data.user) {
      const service = createServiceClient()
      const { data: accountRows } = await service
        .from('gounuri_accounts')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('auth_user_id', data.user.id)
        .select('store_name')
        .limit(1)

      const storeName = accountRows?.[0]?.store_name
      // 2026-08-29 (pedido de ARam: invertir el orden a login -> onboarding
      // -> pago): "Crear mi tienda" y "Probar Gratis" arrancan igual, por
      // el mismo wizard de /onboarding -- antes acá se mandaba derecho a
      // /perfil/plan, saltando todo el onboarding. La cookie
      // gounuri_intent=pago (seteada por /registro, ver REGISTRO_PAGO_URL
      // en @/lib/site) sigue viva y es lo que /onboarding lee para saber
      // que tiene que terminar en plan/pago en vez de crear la tienda
      // gratis de una.
      const redirectTo = storeName
        ? `/onboarding?store=${encodeURIComponent(storeName)}`
        : '/onboarding'
      return NextResponse.json({ ok: true, redirectTo })
    }
    console.error('[api/auth/confirmar] verifyOtp error:', error?.message)
  } catch (err: any) {
    console.error('[api/auth/confirmar] excepción:', err?.message ?? err)
  }

  return NextResponse.json({ error: 'El link ya no es válido.' }, { status: 400 })
}
