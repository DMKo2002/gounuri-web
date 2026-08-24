'use client'

// /recuperar/nueva — se llega acá DESPUÉS de consumir el token de recovery
// (ver /recuperar/confirmar), con la sesión ya creada en cookies. Cambia la
// contraseña con el cliente del browser (updateUser) y manda al perfil.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { friendlyAuthError } from '@/lib/auth-error'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NuevaPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      const msg = ((err as { message?: string }).message ?? '').toLowerCase()
      if (msg.includes('weak') || msg.includes('pwned') || msg.includes('known') || msg.includes('easy to guess')) {
        setError('Esa contraseña es muy común o insegura. Elegí una más difícil de adivinar.')
      } else if (msg.includes('session') || msg.includes('logged') || msg.includes('jwt')) {
        setError('El link de recuperación expiró. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".')
      } else {
        setError(friendlyAuthError(err))
      }
      return
    }
    setOk(true)
    setTimeout(() => {
      router.push('/perfil')
      router.refresh()
    }, 1500)
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
            {ok ? (
              <>
                <h1 className="text-lg font-semibold text-zinc-900">¡Listo!</h1>
                <p className="mt-2 text-sm text-zinc-500">Tu contraseña se actualizó. Te llevamos a tu cuenta...</p>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <h1 className="text-lg font-semibold text-zinc-900">Nueva contraseña</h1>
                <p className="mt-1 text-sm text-zinc-500">Elegí una contraseña nueva para tu cuenta.</p>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <label className="mt-5 block text-xs font-medium text-zinc-700">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />

                <label className="mt-4 block text-xs font-medium text-zinc-700">Repetir contraseña</label>
                <input
                  type="password"
                  required
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Guardar contraseña
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
