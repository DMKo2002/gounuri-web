'use client'

// /recuperar/confirmar?token_hash=...&type=recovery — misma protección
// anti-escáner que /auth/verificar: un botón que recién dispara el consumo del
// token (POST /api/auth/recuperar/confirmar) al hacer click, para que los
// escáneres de mail no quemen el link de un solo uso. Al confirmar, redirige a
// /recuperar/nueva con la sesión ya lista para cambiar la contraseña.

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function ConfirmarInner() {
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const linkValido = !!tokenHash && type === 'recovery'

  const [estado, setEstado] = useState<'idle' | 'confirmando' | 'error'>('idle')

  async function handleConfirmar() {
    setEstado('confirmando')
    try {
      const res = await fetch('/api/auth/recuperar/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        window.location.href = '/recuperar/nueva'
        return
      }
    } catch {
      // cae al estado de error de abajo
    }
    setEstado('error')
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
              <h1 className="mt-6 text-xl font-semibold text-zinc-900">Restablecer contraseña</h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Un último click para elegir una nueva contraseña.
              </p>
              <button
                type="button"
                onClick={handleConfirmar}
                disabled={estado === 'confirmando'}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                {estado === 'confirmando' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} /> Continuar
                  </>
                )}
              </button>
              {estado === 'error' && (
                <p className="mt-4 text-sm text-red-600">
                  Este link ya no es válido o expiró. Pedí uno nuevo desde{' '}
                  <a href="/recuperar" className="underline underline-offset-2">recuperar contraseña</a>.
                </p>
              )}
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

export default function RecuperarConfirmarPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmarInner />
    </Suspense>
  )
}
