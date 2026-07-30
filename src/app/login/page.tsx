'use client'

// Login de gounuri.com — mismas credenciales que el Panel Admin
// (mismo proyecto Supabase). Al entrar va al perfil.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { REGISTRO_URL } from '@/lib/site'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(
        err.message.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : err.message
      )
      return
    }
    router.push('/perfil')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xl font-semibold tracking-tight text-zinc-900">
          gounuri<span className="text-zinc-400">.com</span>
        </Link>

        <form onSubmit={handleLogin} className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-zinc-900">Ingresar</h1>
          <p className="mt-1 text-sm text-zinc-500">Usá las mismas credenciales que en tu Panel Admin.</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <label className="mt-5 block text-xs font-medium text-zinc-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />

          <label className="mt-4 block text-xs font-medium text-zinc-700">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Ingresar
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          ¿Todavía no tenés tienda?{' '}
          <a href={REGISTRO_URL} className="font-medium text-zinc-900 underline underline-offset-2">
            Creala gratis
          </a>
        </p>
      </div>
    </main>
  )
}
