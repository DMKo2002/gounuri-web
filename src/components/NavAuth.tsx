'use client'

// Botones del navbar según sesión. Renderiza el estado deslogueado por
// defecto (SSR, página estática) y al montar chequea la sesión en el browser:
// logueado → "Mi cuenta" + "Ir a mi tienda"; no → "Ingresar" + "Crear mi tienda".

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { REGISTRO_URL } from '@/lib/site'

export default function NavAuth() {
  const [logueado, setLogueado] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setLogueado(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLogueado(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (logueado) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/perfil"
          className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors sm:block"
        >
          Mi cuenta
        </Link>
        <a href="/api/mi-tienda" className="btn-black !px-4 !py-2">
          Ir a mi tienda
        </a>
      </div>
    )
  }

  // Estado deslogueado (también el default durante SSR/carga)
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="hidden text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors sm:block"
      >
        Ingresar
      </Link>
      <a href={REGISTRO_URL} className="btn-black !px-4 !py-2">
        Crear mi tienda
      </a>
    </div>
  )
}
