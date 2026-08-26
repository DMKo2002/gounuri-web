'use client'

// Espejo de "Panel Admin/src/app/auth/confirm/page.tsx" (2026-08-26) — llega
// acá un magic link generado por /api/superadmin/impersonate (panel-admin,
// target: 'web'), con access_token/refresh_token en el fragment de la URL
// (#...). Nunca viajan al servidor ni quedan en logs.
//
// ?next=/ruta (querystring, no fragment — Supabase lo preserva en el
// redirectTo) decide a dónde entrar una vez logueado; por defecto /perfil.
// Uso principal: superadmin entrando a /perfil/plan de un tenant de test
// para ver plazo/próximo cobro/dar de baja/historial sin tener su contraseña.

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/perfil'

  useEffect(() => {
    const hash = window.location.hash.slice(1) // quitar el #
    const params = new URLSearchParams(hash)
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
      }).then(() => {
        window.location.href = next
      })
      return
    }

    // Sin tokens en el hash: usar sesión existente o ir al login
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? next : '/login')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
        <p className="text-sm text-zinc-500">Iniciando sesión...</p>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfirmInner />
    </Suspense>
  )
}
