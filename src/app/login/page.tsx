'use client'

// Login de gounuri.com — mismas credenciales que el Panel Admin
// (mismo proyecto Supabase). Al entrar va al perfil.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { REGISTRO_URL } from '@/lib/site'
import { friendlyAuthError } from '@/lib/auth-error'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OAuthButtons from '@/components/OAuthButtons'

// "Recordarme" guarda solo el email en localStorage para prellenar el
// campo la próxima vez — no guarda la contraseña. La sesión en sí ya
// persiste sola vía cookies (eso no depende de este checkbox).
const REMEMBER_KEY = 'gounuri_remember_email'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Cuenta que existe pero nunca confirmó el mail (Supabase: "Email not
  // confirmed") — antes no había forma de reintentar desde acá sin volver a
  // llenar /registro entero. Ver /api/auth/reenviar-confirmacion.
  const [sinConfirmar, setSinConfirmar] = useState(false)
  const [reenvio, setReenvio] = useState<'idle' | 'enviando' | 'enviado'>('idle')

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) setEmail(saved)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSinConfirmar(false)
    setReenvio('idle')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (err) {
        setError(friendlyAuthError(err))
        if (typeof (err as { message?: unknown }).message === 'string' && (err as { message: string }).message.includes('Email not confirmed')) {
          setSinConfirmar(true)
        }
        return
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, email)
      else localStorage.removeItem(REMEMBER_KEY)
      // Cookie gounuri_intent=pago (2026-08-26, pedido de ARam) -- mismo
      // criterio que /api/auth/confirmar y /auth/callback: si vino de
      // "Crear mi tienda" (por ejemplo, tocó el botón, /registro le mostró
      // "ya tenés cuenta, ingresá acá" y volvió por acá), lo mandamos a
      // elegir plan en vez de al perfil de siempre.
      const intentPago = document.cookie.split('; ').some(c => c === 'gounuri_intent=pago')
      const planHintCookie = document.cookie.split('; ').find(c => c.startsWith('gounuri_plan='))
      const planHint = planHintCookie?.split('=')[1]
      router.push(intentPago ? `/perfil/plan${planHint ? `?plan=${planHint}` : ''}` : '/perfil')
      router.refresh()
    } catch (err) {
      setLoading(false)
      setError(friendlyAuthError(err))
    }
  }

  async function handleReenviar() {
    setReenvio('enviando')
    try {
      await fetch('/api/auth/reenviar-confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // el mensaje de abajo es genérico igual — no hace falta distinguir
      // un error de red acá, "reintentá en unos minutos" ya lo cubre
    }
    setReenvio('enviado')
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="block text-center text-xl font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>

          <form onSubmit={handleLogin} className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-zinc-900">Ingresar</h1>
            <p className="mt-1 text-sm text-zinc-500">Usá las mismas credenciales que en tu Panel Admin.</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                {sinConfirmar && (
                  reenvio === 'enviado' ? (
                    <p className="mt-1.5 text-red-600">Listo, revisá tu casilla (y spam) en unos minutos.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReenviar}
                      disabled={reenvio === 'enviando'}
                      className="mt-1.5 block font-medium underline underline-offset-2 disabled:opacity-60"
                    >
                      {reenvio === 'enviando' ? 'Enviando...' : 'Reenviar mail de confirmación'}
                    </button>
                  )
                )}
              </div>
            )}

            <div className="mt-5">
              <OAuthButtons />
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs text-zinc-400">o con mail</span>
              <div className="h-px flex-1 bg-zinc-200" />
            </div>

            <label className="block text-xs font-medium text-zinc-700">Email</label>
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

            <div className="mt-3 text-right">
              <Link href="/recuperar" className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-900">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300"
              />
              Recordarme
            </label>

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
      </div>
      <Footer />
    </main>
  )
}
