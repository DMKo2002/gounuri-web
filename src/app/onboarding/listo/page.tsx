'use client'

// /onboarding/listo — a dónde vuelve Mercado Pago después de pagar en
// "Crear mi tienda" (back_url armado en /api/onboarding/pagar, con un
// token propio en vez de depender de la sesión — ver comentario en
// /api/onboarding/estado, que es lo que esta pantalla consulta).
//
// A propósito es una página aparte del wizard de /onboarding, no un paso
// más ahí: el wizard asume sesión iniciada (redirige a /registro si no hay
// user, ver el useEffect "Sin sesión no hay onboarding") — y esta pantalla
// tiene que funcionar aunque no haya sesión, porque la vuelta de MP puede
// caer en un navegador que no comparte cookies con el que pagó (2026-08-29,
// confirmado en testing por ARam: en el celular, si el pago se hace desde
// la app de Mercado Pago, el back_url abre gounuri.com dentro del
// navegador propio de esa app).

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'

type Estado = 'esperando' | 'listo' | 'timeout' | 'invalido'

function ListoContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('t')
  const [estado, setEstado] = useState<Estado>('esperando')
  const [storeUrl, setStoreUrl] = useState<string | null>(null)
  const [pollAttempt, setPollAttempt] = useState(0)

  useEffect(() => {
    if (!token) { setEstado('invalido'); return }
    let cancelled = false
    let tries = 0
    const MAX_TRIES = 20 // ~30s (1.5s entre intentos)

    function poll() {
      fetch(`/api/onboarding/estado?t=${encodeURIComponent(token!)}`)
        .then(res => res.json().then(json => ({ status: res.status, json })))
        .then(({ status, json }) => {
          if (cancelled) return
          if (status === 404 || json?.error === 'invalid_token') { setEstado('invalido'); return }
          if (json?.ready) {
            setStoreUrl(json.storeUrl ?? null)
            setEstado('listo')
            return
          }
          tries++
          if (tries >= MAX_TRIES) { setEstado('timeout'); return }
          setTimeout(poll, 1500)
        })
        .catch(e => {
          console.error('[onboarding/listo] error consultando estado', e)
          if (cancelled) return
          tries++
          if (tries >= MAX_TRIES) { setEstado('timeout'); return }
          setTimeout(poll, 1500)
        })
    }
    poll()
    return () => { cancelled = true }
  }, [token, pollAttempt])

  return (
    <main className="min-h-screen bg-zinc-50">
      <Navbar />
      <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-6 text-center">
        {estado === 'esperando' && (
          <>
            <Loader2 size={32} className="mb-4 animate-spin text-zinc-400" />
            <p className="text-xl font-bold text-zinc-900">Confirmando tu pago...</p>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">Esto toma solo unos segundos. No cierres esta ventana.</p>
          </>
        )}

        {estado === 'timeout' && (
          <>
            <p className="mb-2 text-xl font-bold text-zinc-900">Todavía estamos confirmando tu pago</p>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">
              Puede demorar un poco más de lo esperado. Probá de nuevo en unos segundos — si ya pagaste, no hace falta que vuelvas a hacerlo.
            </p>
            <button
              type="button"
              onClick={() => { setEstado('esperando'); setPollAttempt(a => a + 1) }}
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Reintentar
            </button>
          </>
        )}

        {estado === 'invalido' && (
          <>
            <XCircle size={32} className="mb-4 text-red-400" />
            <p className="mb-2 text-xl font-bold text-zinc-900">No encontramos ese pago</p>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">
              Puede que el link haya caducado. Si ya pagaste, entrá a tu cuenta — si no lo ves ahí, escribinos.
            </p>
            <a
              href="/perfil"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Ir a mi cuenta
            </a>
          </>
        )}

        {estado === 'listo' && (
          <>
            <CheckCircle2 size={36} className="mb-4 text-emerald-500" />
            <p className="mb-2 text-xl font-bold text-zinc-900">¡Tu tienda ya está lista!</p>
            <p className="mb-6 max-w-sm text-sm text-zinc-500">
              Ya podés volver a tu navegador de siempre si esta pantalla se abrió dentro de otra app.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {storeUrl && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Ir a mi tienda
                </a>
              )}
              <a
                href="/perfil"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Ir a mi cuenta
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default function OnboardingListoPage() {
  return (
    <Suspense fallback={null}>
      <ListoContent />
    </Suspense>
  )
}
