import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Espejo de "Panel Admin/src/app/api/auth/set-session/route.ts" (2026-08-26)
// — recibe access_token + refresh_token y los escribe como cookies SSR.
// Lo usa /auth/confirm/page.tsx cuando llega un magic link (impersonación
// desde superadmin en panel-admin, ver /api/superadmin/impersonate).
export async function POST(req: NextRequest) {
  const { access_token, refresh_token } = await req.json()

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.setSession({ access_token, refresh_token })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
