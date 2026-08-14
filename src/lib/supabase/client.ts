import { createBrowserClient } from '@supabase/ssr'

// Cookie a nivel .gounuri.com (no solo el host actual) para que la misma
// sesión valga tanto en gounuri.com/www.gounuri.com como en
// panel.gounuri.com — es lo que permite entrar a Panel Admin sin volver a
// loguearse si ya iniciaste sesión acá. Solo en producción: en localhost
// (dev) un dominio con punto no aplica y rompería el login local.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.gounuri.com' : undefined

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { domain: COOKIE_DOMAIN } }
  )
}
