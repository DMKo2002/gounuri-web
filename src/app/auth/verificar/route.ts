// GET /auth/verificar?token_hash=...&type=signup|magiclink
//
// Confirma el mail de registro (ver /api/auth/registro) y recién ahí deja al
// usuario con sesión — verifyOtp() setea las cookies de sesión vía el cliente
// server-side. Sin este paso no hay forma de loguearse ni de llegar al
// onboarding: es lo que "bloquea" la cuenta hasta confirmar.
//
// type=magiclink es el mismo circuito pero para el caso "cuenta de Auth ya
// existente (compradora en alguna tienda) enganchada a un perfil nuevo de
// gounuri_accounts" — ver vincularCuentaExistente() en
// /api/auth/registro/route.ts. La fila de gounuri_accounts ya se insertó
// ahí (no hay auth.users nuevo => no corre el trigger), así que acá el
// UPDATE de confirmed_at de abajo aplica igual para los dos casos.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const TIPOS_VALIDOS = new Set(['signup', 'magiclink'])

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type && TIPOS_VALIDOS.has(type)) {
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
        const nextUrl = storeName
          ? `${origin}/onboarding?store=${encodeURIComponent(storeName)}`
          : `${origin}/onboarding`
        return NextResponse.redirect(nextUrl)
      }
      console.error('[auth/verificar] verifyOtp error:', error?.message)
    } catch (err: any) {
      console.error('[auth/verificar] excepción:', err?.message ?? err)
    }
  }

  return NextResponse.redirect(`${origin}/registro?confirmacion=error`)
}
