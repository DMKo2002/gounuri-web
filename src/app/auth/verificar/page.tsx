'use client'

// /auth/verificar?token_hash=...&type=signup|magiclink — antes esto era un
// GET route handler que confirmaba la cuenta apenas se cargaba la página,
// sin ninguna acción del usuario. El problema: varios clientes de mail
// (Microsoft Safe Links, el proxy de Gmail, etc.) pre-visitan los links de
// un mail recién llegado para escanearlos por seguridad — como el link de
// confirmación es de un solo uso, ese escaneo automático lo "quemaba" antes
// de que el usuario real llegara a hacer click, y quedaba con un "Email
// link is invalid or has expired" en un link de segundos de antigüedad.
//
// Fix: ahora esto es una page.tsx que muestra un botón "Confirmar mi
// cuenta" y recién dispara la confirmación (POST a /api/auth/confirmar)
// cuando el usuario hace click — los escáneres automáticos no ejecutan JS
// ni clickean botones, así que ya no consumen el token. Ver conversación
// 2026-08-17.
//
// Nota: Next.js no permite un route.ts y un page.tsx en el mismo segmento
// — el viejo src/app/auth/verificar/route.ts hay que borrarlo a mano
// (device_bash no puede borrar archivos en la carpeta montada).

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function VerificarInner() {
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const linkValido = !!tokenHash && (type === 'signup' || type === 'magiclink')

  const [estado, setEstado] = useState<'idle' | 'confirmando' | 'error'>('idle')

  async function handleConfirmar() {
    setEstado('confirmando')
    try {
      const res = await fetch('/api/auth/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.redirectTo) {
        // Navegación completa (no router.push) para que el resto del sitio
        // vea la sesión recién creada desde el arranque.
        window.location.href = data.redirectTo
        return
      }
    } catch {
      // cae al estado de error de abajo
    }
    window.location.href = '/registro?confirmacion=error'
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-sm text-center">
          {linkValido ? (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <h1 className="mt-6 text-xl font-semibold text-zinc-900">Confirmá tu cuenta</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Un último click para activar tu cuenta de gounuri.
              </p>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={estado === 'confirmando'}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                {estado === 'confirmando' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Confirmar mi cuenta
                  </>
                )}
              </button>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Este link no es válido.</p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default function VerificarPage() {
  return (
    <Suspense fallback={null}>
      <VerificarInner />
    </Suspense>
  )
}
