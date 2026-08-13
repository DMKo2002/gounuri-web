// GET /auth/callback?code=... — vuelta de Google/Facebook tras
// signInWithOAuth (ver components/OAuthButtons.tsx). Cambia el code por una
// sesión (exchangeCodeForSession setea las cookies) y decide a dónde
// mandar: si ya tiene tienda (login de alguien existente) → /perfil, si es
// alta nueva sin tenant todavía → /onboarding. Mismo criterio que
// /auth/verificar para el flujo por mail.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user) {
        const service = createServiceClient()
        const { data: userRows } = await service
          .from('users')
          .select('tenant_id')
          .eq('id', data.user.id)
          .limit(1)

        const tenantId = userRows?.[0]?.tenant_id
        return NextResponse.redirect(tenantId ? `${origin}/perfil` : `${origin}/onboarding`)
      }
      console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    } catch (err: any) {
      console.error('[auth/callback] excepción:', err?.message ?? err)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
