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
//
// 2026-08-17: rediseño visual según Figma "Registracion 6" (node 1018:2,
// file 9NUy2MXkGJf7Vh9DlIPyzB) — mismo layout de dos paneles que usa el
// onboarding (form ~50% / foto ~41.1% / franja lateral ~8.9%), reutilizando
// la misma foto ("Paris street") y el mismo <SideStrip> ya extraído a
// components/SideStrip.tsx. El /login NO se toca — sigue con su layout de
// card centrada de siempre (pedido explícito de Aram).
//
// Deviación flagueada: el Figma de esta pantalla no tiene <Footer /> (es un
// layout full-bleed de dos paneles, igual que todo el onboarding) — se sacó
// acá también. Antes el /registro viejo sí tenía Footer.
//
// También se resuelven acá dos problemas funcionales reportados por Aram
// ("Login y Registro hay que separarlos" / el mail de confirmación abría
// esta pantalla en blanco cuando el link ya había sido usado):
// - ?confirmacion=error (lo manda /auth/verificar cuando el link ya no es
//   válido — típicamente porque un escáner de seguridad de mail lo
//   pre-consumió antes de que el usuario hiciera click, ver
//   /auth/verificar/page.tsx) ahora muestra un mensaje claro + botón para
//   reenviar el mail, en vez de la nada — el form vacío de siempre.
// - Reenvío pega al mismo /api/auth/reenviar-confirmacion que ya usa el
//   botón de /login.

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Turnstile from 'react-turnstile'
import { AlertTriangle, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { LOGIN_URL, TRIAL_DAYS } from '@/lib/site'
import Navbar from '@/components/Navbar'
import OAuthButtons from '@/components/OAuthButtons'
import SideStrip from '@/components/SideStrip'

// Si esto sigue mostrando el sitekey de prueba de Cloudflare después de
// cargar NEXT_PUBLIC_TURNSTILE_SITE_KEY en Vercel, no alcanza con guardar
// la variable — hace falta un build nuevo de verdad (no un Redeploy con
// "Use existing Build Cache" tildado, que puede reusar el bundle viejo).
// Este comentario fuerza justamente eso: un diff real de este archivo.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'

// "Registrate" (título) estirado por letter-spacing hasta ocupar el mismo
// ancho que "B2B Mayoristas y B2C Minoristas" (subtítulo) — pedido de Aram
// 2026-08-17 sobre el resultado del rediseño Figma. Se mide el ancho real
// de los dos textos en el navegador (getBoundingClientRect) en vez de
// adivinar un tracking fijo en px: así funciona sea cual sea el tamaño de
// pantalla/zoom y si algún día cambia el texto o la tipografía. Se
// recalcula también cuando terminan de cargar las fuentes (document.fonts)
// para no medir con la tipografía de fallback todavía.
function StretchedTitle({ title, subtitle }: { title: string; subtitle: string }) {
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const subtituloRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    function ajustar() {
      const tEl = tituloRef.current
      const sEl = subtituloRef.current
      if (!tEl || !sEl || title.length <= 1) return
      tEl.style.letterSpacing = '0px'
      const anchoTitulo = tEl.getBoundingClientRect().width
      const anchoSubtitulo = sEl.getBoundingClientRect().width
      const extra = (anchoSubtitulo - anchoTitulo) / (title.length - 1)
      tEl.style.letterSpacing = `${Math.max(extra, 0)}px`
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    document.fonts?.ready?.then(ajustar).catch(() => {})
    return () => window.removeEventListener('resize', ajustar)
  }, [title, subtitle])

  return (
    <div className="text-left">
      <h2 ref={tituloRef} className="text-[3.6rem] font-extrabold">{title}</h2>
      <p ref={subtituloRef} className="mt-1 text-xl font-medium">{subtitle}</p>
    </div>
  )
}

// ── Panel derecho: misma foto ("Paris street", ya usada en el onboarding
//    Paso 5 "Escalá con tus Ventas") con el título superpuesto que trae el
//    Figma de esta pantalla ("Registrate"), + la franja lateral roja — el
//    mismo rojo #FE4648 del Paso 5 que sigue justo después en el flujo. ───
function PhotoPanel() {
  return (
    <>
      <div className="relative hidden lg:block lg:w-[41.1%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/onboarding/onboarding-05-escalar.jpg')" }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-6 text-white">
          <StretchedTitle title="Registrate" subtitle="B2B Mayoristas y B2C Minoristas" />
        </div>
      </div>
      <SideStrip color="#FE4648" />
    </>
  )
}

function RegistroForm() {
  const searchParams = useSearchParams()
  // /auth/verificar redirige acá con esto cuando el link de confirmación ya
  // no sirve (usado, o pre-consumido por un escáner de seguridad de mail
  // antes de que el usuario llegara a hacer click) — ver comentario arriba.
  const confirmacionError = searchParams.get('confirmacion') === 'error'

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

  // Recuadro de "el link ya no es válido" (?confirmacion=error) — reenvío
  // independiente del form de arriba, con su propio email.
  const [resendEmail, setResendEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'enviando' | 'enviado'>('idle')

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

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!resendEmail.trim()) return
    setResendState('enviando')
    try {
      await fetch('/api/auth/reenviar-confirmacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      })
    } catch {
      // el mensaje de abajo es genérico igual — no hace falta distinguir
      // un error de red acá
    }
    setResendState('enviado')
  }

  let card: React.ReactNode

  if (confirmacionError && resendState === 'enviado') {
    card = (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
          <Mail size={22} className="text-white" />
        </div>
        <h1 className="mt-6 text-xl font-semibold text-zinc-900">Revisá tu casilla</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Si hay una cuenta pendiente de confirmar con ese email, te mandamos un link nuevo a{' '}
          <strong className="text-zinc-700">{resendEmail}</strong>. Puede tardar unos minutos — revisá spam / correo no deseado.
        </p>
        <Link href={LOGIN_URL} className="mt-6 inline-block text-sm font-medium text-zinc-900 underline underline-offset-2">
          Ir al inicio de sesión
        </Link>
      </div>
    )
  } else if (confirmacionError) {
    card = (
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle size={20} className="text-red-600" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900">El link ya no es válido</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Puede haber expirado o ya haberse usado. Ingresá tu email y te mandamos un link nuevo para confirmar tu cuenta.
        </p>

        <form onSubmit={handleResend} className="mt-5">
          <label className="block text-xs font-medium text-zinc-700">Email</label>
          <input
            type="email" required autoFocus value={resendEmail} onChange={e => setResendEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={resendState === 'enviando'}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {resendState === 'enviando' && <Loader2 size={15} className="animate-spin" />}
            Reenviar mail de confirmación
          </button>
        </form>

        <Link href={LOGIN_URL} className="mt-4 block text-center text-sm font-medium text-zinc-900 underline underline-offset-2">
          Ya confirmé, ir a iniciar sesión
        </Link>
      </div>
    )
  } else if (enviado) {
    card = (
      <div className="text-center">
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
    )
  } else {
    card = (
      <>
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6">
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
      </>
    )
  }

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-var(--nav-h))] bg-[#fafafa]">
        <div className="flex w-full items-center justify-center px-6 py-16 lg:w-[50%]">
          <div className="w-full max-w-sm">
            {/* Título visible solo en mobile/tablet — en desktop el mismo
                mensaje va superpuesto sobre la foto del panel derecho. */}
            <h1 className="text-3xl font-extrabold leading-tight text-zinc-900 lg:hidden">Registrate</h1>
            <p className="mt-1 text-base font-medium text-zinc-500 lg:hidden">B2B Mayoristas y B2C Minoristas</p>

            <Link href="/" className="mt-6 block text-center text-xl font-semibold tracking-tight text-zinc-900 lg:mt-0">
              gounuri<span className="text-zinc-400">.com</span>
            </Link>

            <div className="mt-8">{card}</div>
          </div>
        </div>

        <PhotoPanel />
      </div>
    </main>
  )
}

export default function RegistroPage() {
  return (
    <Suspense fallback={null}>
      <RegistroForm />
    </Suspense>
  )
}
