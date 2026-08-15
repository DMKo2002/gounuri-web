import { createBrowserClient } from '@supabase/ssr'

// Cookie host-only (sin domain compartido). El pase de sesión hacia
// panel.gounuri.com NO se hace ampliando el dominio de la cookie —eso
// generó un loop de refresh token que rompió producción el 14/8 (ver
// mensaje-para-aram.md)— sino con un handoff explícito: se mandan
// access_token/refresh_token una sola vez por el fragment de la URL hacia
// panel.gounuri.com/auth/handoff, que ahí arma su propia cookie host-only.
// Ver components/PanelHandoffLink.tsx.

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
