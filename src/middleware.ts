// Refresca la sesión de Supabase solo en las rutas que la usan —
// el resto del sitio sigue siendo estático.
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cookie a nivel .gounuri.com para compartir sesión con panel.gounuri.com —
// ver nota en lib/supabase/client.ts. Solo en producción.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.gounuri.com' : undefined

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { domain: COOKIE_DOMAIN },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return response
}

export const config = {
  matcher: ['/perfil/:path*', '/login', '/registro', '/onboarding', '/api/mi-tienda', '/api/baja', '/api/create-tenant'],
}
