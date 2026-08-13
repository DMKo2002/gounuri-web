'use client'

// Registro de gounuri.com — alta de la cuenta que va a ser dueña de la
// tienda. Pega a /api/auth/registro (server): crea la cuenta de Auth sin
// loguearla (admin.generateLink) y manda el mail de confirmación con
// nuestro branding. La cuenta queda bloqueada — sin sesión — hasta que
// confirman ese mail (ver /auth/verificar), recién ahí se sigue al
// onboarding.
//
// Simplificado 2026-08-13: antes pedía nombre/apellido/DNI/celular/nombre
// de tienda acá mismo — David y Aram lo sacaron por intimidante. Esos datos
// ahora se completan opcionalmente después, desde gounuri.com/perfil (ver
// /perfil/datos). El nombre de la tienda ya se pregunta en el onboarding
// (paso 1), así que sacarlo de acá no perdía nada, era una pregunta
// duplicada. También se sumó login social (Google/Facebook, ver
// components/OAuthButtons.tsx) como alternativa a mail+contraseña.

import { useState } from 'react'
import Link from 'next/link'
import Turnstile from 'react-turnstile'
import { Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { LOGIN_URL, TRIAL_DAYS } from '@/lib/site'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import OAuthButtons from '@/components/OAuthButtons'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'

export default function RegistroPage() {
  const [form, setForm] = useState({
    email: '', password: '', confirmar: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!turnstileToken) {
      setError('Completá la verificación de seguridad.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Error al crear la cuenta. Intentá de nuevo.')
        setTurnstileToken(null)
        setTurnstileKey(k => k + 1)
        return
      }
      setEnviado(true)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <main>
        <Navbar />
        <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center bg-zinc-50 px-6 py-16">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
              <Mail size={22} className="text-white" />
            </div>
            <h1 className="mt-6 text-xl font-semibold text-zinc-900">Falta un paso</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Te enviamos un email a <strong className="text-zinc-700">{form.email}</strong> para confirmar tu cuenta.
              Tu registro recién queda activo cuando hacés click en el link de ese correo — hasta entonces no vas a
              poder iniciar sesión ni crear tu tienda. Si no lo ves en unos minutos, revisá spam / correo no deseado.
            </p>
            <Link href={LOGIN_URL} className="mt-6 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2">
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-var(--nav-h))] items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-md">
          <Link href="/" className="block text-center text-xl font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>

          <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
            <h1 className="text-lg font-semibold text-zinc-900">Creá tu tienda</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {TRIAL_DAYS} días gratis, sin tarjeta. En 2 minutos tenés tu tienda online.
            </p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
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
              type="email" required autoFocus value={form.email} onChange={e => set('email', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />

            <label className="mt-4 block text-xs font-medium text-zinc-700">Contraseña</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'} required minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={form.password} onChange={e => set('password', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <label className="mt-4 block text-xs font-medium text-zinc-700">Confirmá la contraseña</label>
            <div className="relative mt-1.5">
              <input
                type={showConfirmar ? 'text' : 'password'} required minLength={8}
                value={form.confirmar} onChange={e => set('confirmar', e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 pr-10 text-sm focus:border-zinc-900 focus:outline-none"
              />
              <button type="button" onClick={() => setShowConfirmar(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700">
                {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <Turnstile
                key={turnstileKey}
                sitekey={TURNSTILE_SITE_KEY}
                onVerify={token => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                theme="light"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
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

          <p className="mt-6 text-center text-xs text-zinc-400">
            Al crear la cuenta, aceptás las{' '}
            <Link href="/terminos" className="underline underline-offset-2 hover:text-zinc-600">
              políticas, términos y condiciones
            </Link>{' '}
            de Gounuri.
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
