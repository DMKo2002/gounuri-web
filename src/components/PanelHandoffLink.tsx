'use client'

// Reemplaza un <a href={PANEL_URL}/...}> plano. Como ya no compartimos
// cookie de dominio con panel.gounuri.com (ver lib/supabase/client.ts),
// pasamos la sesión activa una sola vez por el fragment de la URL
// (#access_token=...&refresh_token=...) hacia panel.gounuri.com/auth/handoff,
// que ya existe del lado del panel y arma ahí su propia cookie host-only.
// El fragment nunca viaja al servidor ni queda en logs de ningún lado.
//
// Siempre apunta a /dashboard: el middleware del panel (proxy.ts) ya
// redirige solo a /superadmin si la cuenta es de superadmin sin tenant
// propio, así que no hace falta un parámetro "next" acá.

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PANEL_URL } from '@/lib/site'

export default function PanelHandoffLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // No debería pasar (la página ya valida sesión server-side antes de
      // renderizar este link) pero por las dudas, no dejamos un botón roto.
      window.location.href = `${PANEL_URL}/login`
      return
    }

    const params = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    window.location.href = `${PANEL_URL}/auth/handoff#${params.toString()}`
  }

  return (
    <a href={`${PANEL_URL}/dashboard`} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}
