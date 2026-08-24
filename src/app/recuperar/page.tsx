'use client'

// /recuperar — pide el email y dispara /api/auth/recuperar (mismo estilo que
// /login). Respuesta siempre genérica: no revela si el email tiene cuenta.

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setEstado('enviando')
    try {
      const res = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'No pudimos procesar el pedido. Probá de nuevo.')
        setEstado('idle')
        return
      }
      setEstado('enviado')
    } catch {
      setError('No pudimos procesar el pedido. Probá de nuevo en unos minutos.')
      setEstado('idle')
    }
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="block text-center text-xl font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            {estado === 'enviado' ? (
              <>
                <h1 className="text-lg font-semibold text-zinc-900">Revisá tu casilla</h1>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Si hay una cuenta con ese email, te enviamos un link para restablecer tu contraseña.
                  Puede tardar unos minutos (mirá también el spam).
                </p>
                <Link href="/login" className="mt-6 block text-center text-sm font-medium text-zinc-900 underline underline-offset-2">
                  Volver a ingresar
                </Link>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h1 className="text-lg font-semibold text-zinc-900">Restablecer contraseña</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Ingresá tu email y te mandamos un link para crear una nueva contraseña.
                </p>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <label className="mt-5 block text-xs font-medium text-zinc-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={estado === 'enviando'}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {estado === 'enviando' && <Loader2 size={15} className="animate-spin" />}
                  Enviar link
                </button>
              </form>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-zinc-500">
            <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-2">
              Volver a ingresar
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
