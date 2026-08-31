'use client'

// /onboarding/listo (sin token en el path) — solo por compatibilidad hacia
// atrás, para cualquier link viejo con ?t=<token> que haya quedado dando
// vueltas (2026-08-29: el token ahora viaja en el path, ver
// /onboarding/listo/[token]/page.tsx, y por qué se cambió el comentario ahí).

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('t')

  useEffect(() => {
    router.replace(token ? `/onboarding/listo/${encodeURIComponent(token)}` : '/perfil')
  }, [token, router])

  return null
}

export default function OnboardingListoLegacyPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  )
}
