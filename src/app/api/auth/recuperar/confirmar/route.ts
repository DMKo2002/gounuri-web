// POST /api/auth/recuperar/confirmar — consume el token de recovery (verifyOtp)
// y deja la sesión lista en cookies para que /recuperar/nueva pueda cambiar la
// contraseña. Separado a propósito de /api/auth/confirmar (signup/magiclink)
// para no tocar el flujo de confirmación de registro que ya funciona.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const token_hash = body?.token_hash
  if (!token_hash) {
    return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: 'recovery' })
    if (!error && data.user) {
      return NextResponse.json({ ok: true })
    }
    console.error('[recuperar/confirmar] verifyOtp error:', error?.message)
  } catch (err: any) {
    console.error('[recuperar/confirmar] excepción:', err?.message ?? err)
  }

  return NextResponse.json({ error: 'El link ya no es válido.' }, { status: 400 })
}
