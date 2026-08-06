'use client'

// Registro de gounuri.com — crea la cuenta en Supabase (mismo proyecto que el
// Panel Admin) y sigue al onboarding: nombre de tienda → template → plan.

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { LOGIN_URL, TRIAL_DAYS } from '@/lib/site'
import { friendlyAuthError } from '@/lib/auth-error'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RegistroPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      setLoading(false)

      if (err) {
        setError(friendlyAuthError(err))
        return
      }

      // Supabase no siempre devuelve un error explícito cuando el email ya
      // tiene cuenta (por diseño, para no revelar qué emails existen): en
      // ese caso el usuario vuelve con identities=[] y sin sesión. Sin esta
      // guarda el submit "no hacía nada" — parecía que el registro se había
      // perdido, cuando en realidad había que ir al login.
      const yaExiste = (data.user?.identities?.length ?? 0) === 0
      if (yaExiste) {
        setError('Ya existe una cuenta con ese email — puede ser de una compra anterior en alguna tienda de Gounuri. Ingresá desde el login.')
        return
      }

      if (!data.session) {
        // El proyecto tiene "Confirmar email" activado — no debería pasar
        // con la config actual, pero cubrimos el caso para no dejar al
        // usuario en un estado confuso.
        setError('Te enviamos un email para confirmar tu cuenta. Confirmalo y volvé a ingresar desde el login.')
        return
      }

      // Sin confirmación por email — directo al onboarding
      window.location.href = '/onboarding'
    } catch (err) {
      setLoading(false)
      setError(friendlyAuthError(err))
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

          <form onSubmit={handleRegister} className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-zinc-900">Creá tu tienda</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {TRIAL_DAYS} días gratis, sin tarjeta. En 2 minutos tenés tu tienda online.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <label className="mt-5 block text-xs font-medium text-zinc-700">Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />

            <label className="mt-4 block text-xs font-medium text-zinc-700">Contraseña</label>
            <input
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />

            <label className="mt-4 block text-xs font-medium text-zinc-700">Confirmá la contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Crear cuenta
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            ¿Ya tenés cuenta?{' '}
            <Link href={LOGIN_URL} className="font-medium text-zinc-900 underline underline-offset-2">
              Ingresá acá
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
