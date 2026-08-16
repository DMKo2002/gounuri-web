'use client'

// Onboarding post-registro: 1) nombre de la tienda → 2) template → 3) plan.
// Al finalizar crea el tenant (POST /api/create-tenant).
//
// Cambio 2026-08-14: antes, al terminar, se entregaba la sesión al Panel
// Admin vía /auth/handoff (tokens en el fragment) y se sacaba al usuario de
// gounuri.com de una. David lo sacó explícitamente — después de crear la
// tienda tiene que quedarse en gounuri.com (/perfil), no saltar
// automáticamente a Panel Admin. Desde /perfil ya hay un botón "Ir al Panel
// Admin" para quien quiera entrar a cargar productos.

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, demoUrl } from '@/lib/templates'
import { PLANES, TRIAL_DAYS, formatPrecio } from '@/lib/site'

type Step = 'nombre' | 'template' | 'plan'

// Mismas fotos del carrusel del Hero de gounuri.com (public/img/hero) — se
// reutilizan acá para el panel derecho del paso 1 del onboarding (diseño
// Figma "Registracion 1A/1B/1C", que son la misma pantalla con 3 fondos
// distintos: en vez de elegir una sola foto o armar un asset nuevo, las
// rotamos las 4 con la misma técnica que ya usa el Hero — ver .hero-slide
// en globals.css).
const ONBOARDING_SLIDES = ['/img/hero/hero-01.jpg', '/img/hero/hero-02.jpg', '/img/hero/hero-03.jpg', '/img/hero/hero-04.jpg']

// Isotipo "G" de gounuri — mismo trazo que components/Hero.tsx (.g-logo),
// reutilizado acá en dos tamaños en vez de bajar el asset de Figma (que
// vence a los 7 días).
function GMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 155 212" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M127.122 35.918L110.309 44.5352L110.307 44.5342V44.5371L110.309 44.5352C115.55 49.0924 119.662 50.4132 124.824 57.1289C129.34 63.0044 132.347 69.97 133.502 76.7695C138.149 104.103 120.678 125.377 98.3216 132.125C102.081 134.479 104.406 137.448 104.783 140.878C105.308 145.642 101.985 150.481 96.0569 154.64C99.8321 156.04 103.168 158.747 105.299 162.528C109.947 170.779 107.097 181.021 98.9319 185.405C90.7672 189.789 80.3808 186.655 75.7327 178.404C73.0476 173.638 72.8643 168.207 74.763 163.625C71.5104 164.415 68.0864 165.05 64.5383 165.498C41.141 168.453 21.2249 162.221 20.054 151.578C18.9302 141.363 35.4837 130.799 57.5042 127.354C31.7655 112.249 29.4898 83.149 40.6233 64.208C48.4958 50.8128 57.5434 46.5131 73.1936 38.3916C87.2253 31.1111 102.315 22.5295 116.558 16L127.122 35.918ZM104.184 70.4844C96.3186 61.6071 80.4737 58.1668 68.4466 67.7715L68.4446 67.7744C41.5219 89.2772 75.0498 126.203 100.963 104.854C109.797 97.5739 114.27 81.8684 104.184 70.4844Z" fill="currentColor" />
    </svg>
  )
}

// ── Preview de template con iframe escalado ──────────────────────────────────
function TemplateCard({
  slug, nombre, descripcion, publico, selected, onSelect,
}: {
  slug: string; nombre: string; descripcion: string; publico: string
  selected: boolean; onSelect: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const url = demoUrl(slug)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full overflow-hidden rounded-xl border-2 text-left transition-all ${
        selected ? 'border-zinc-900 ring-2 ring-zinc-300' : 'border-zinc-200 hover:border-zinc-400'
      }`}
    >
      <div className="relative overflow-hidden bg-zinc-100" style={{ height: 180 }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}
        <iframe
          src={url}
          title={`Demo ${nombre}`}
          scrolling="no"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            width: 1280,
            height: 800,
            transform: 'scale(0.234)',
            transformOrigin: 'top left',
            pointerEvents: 'none',
            border: 'none',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
        {selected && (
          <div className="absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 shadow">
            <Check size={13} className="text-white" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{nombre}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{descripcion}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{publico}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0 text-zinc-400 transition-colors hover:text-zinc-900"
          title="Ver demo completa"
        >
          <ExternalLink size={14} />
        </a>
      </div>
    </button>
  )
}

// ── Página ────────────────────────────────────────────────────────────────────
// useSearchParams() (para precargar el nombre de tienda que viene del link de
// /auth/verificar) exige un boundary de Suspense en Next 14 App Router o el
// build falla al prerenderizar la página estáticamente.
export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const supabase = createClient()
  // El nombre de tienda ya se pidió en /registro (gounuri_accounts.store_name)
  // y /auth/verificar lo pasa acá por query param al confirmar el mail — no
  // hace falta volver a pedirlo, pero el paso "nombre" sigue disponible por
  // si quieren cambiarlo (botón "← Volver" del paso 2).
  const searchParams = useSearchParams()
  const storeFromQuery = searchParams.get('store') ?? ''
  const [step, setStep] = useState<Step>(storeFromQuery ? 'template' : 'nombre')
  const [name, setName] = useState(storeFromQuery)
  const [domain, setDomain] = useState('')
  const [dniCuit, setDniCuit] = useState('')
  const [celular, setCelular] = useState('')
  const [template, setTemplate] = useState('minimalista')
  const [plan, setPlan] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)

  // Sin sesión no hay onboarding
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/registro'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Carrusel de fondo del paso 1 (mismo timing que el Hero de gounuri.com)
  useEffect(() => {
    if (step !== 'nombre') return
    const t = setInterval(() => setSlideIndex(i => (i + 1) % ONBOARDING_SLIDES.length), 3500)
    return () => clearInterval(t)
  }, [step])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function handleNombreSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre de la tienda es obligatorio.'); return }
    setError(null)

    // DNI/CUIT y WhatsApp son opcionales y no bloquean el paso — son datos
    // de la tienda para dejarla más preparada (facturación, botón de
    // WhatsApp de la tienda, etc.), no un requisito para poder crearla. Se
    // guardan en gounuri_accounts vía el mismo endpoint que usa
    // /perfil/datos — best effort: si falla, seguimos igual al paso 2, el
    // dueño puede completarlos después desde /perfil.
    if (dniCuit.trim() || celular.trim()) {
      fetch('/api/perfil/datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni: dniCuit.trim(),
          celular: celular.trim() ? `+54 ${celular.trim()}` : '',
        }),
      }).catch(e => console.error('[onboarding] no se pudieron guardar DNI/CUIT y WhatsApp', e))
    }

    setStep('template')
  }

  async function handleFinalSubmit() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/create-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), domain: domain.trim() || null, template, plan }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.error) {
      setError(json.error ?? 'Error al crear la tienda. Probá de nuevo.')
      setSaving(false)
      // 409 = nombre ya en uso — hay que volver al paso 1 para que lo cambien,
      // no tiene sentido dejarlos varados en el paso de plan viendo el error.
      if (res.status === 409) setStep('nombre')
      return
    }

    // Tienda creada — quedarse en gounuri.com (Mi cuenta), no saltar a Panel
    // Admin de una. La sesión ya está en las cookies de este mismo dominio,
    // no hace falta ningún handoff para esto.
    window.location.href = '/perfil'
  }

  const pasos: { id: Step; label: string }[] = [
    { id: 'nombre', label: '1. Tu tienda' },
    { id: 'template', label: '2. Diseño' },
    { id: 'plan', label: '3. Plan' },
  ]
  const planElegido = PLANES.find(p => p.id === plan) ?? PLANES[1]
  const templateElegido = TEMPLATES.find(t => t.slug === template) ?? TEMPLATES[0]

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </span>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-2 text-xs sm:flex">
              {pasos.map((p, i) => (
                <span key={p.id} className="flex items-center gap-2">
                  {i > 0 && <span className="text-zinc-200">→</span>}
                  <span className={step === p.id ? 'font-medium text-zinc-900' : 'text-zinc-400'}>{p.label}</span>
                </span>
              ))}
            </div>
            <button onClick={handleLogout} className="text-xs text-zinc-400 transition-colors hover:text-zinc-600">
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* ── PASO 1: Nombre (diseño Figma "Registracion 1A/1B/1C") ── */}
      {step === 'nombre' && (
        <div className="relative flex min-h-[calc(100vh-73px)] overflow-hidden bg-white">
          {/* Panel del formulario */}
          <div className="flex w-full flex-col justify-between px-6 py-12 sm:px-16 sm:py-16 lg:w-1/2 lg:px-24">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">Paso 1 de 3</p>
              <h1 className="text-4xl font-extrabold leading-[1.15] text-zinc-900 sm:text-5xl">
                Empezamos a crear<br />tu tienda.
              </h1>

              <form id="onb-paso1-form" onSubmit={handleNombreSubmit} className="mt-10 max-w-md space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Nombre de la Tienda <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-2xl border-none bg-[#f0f0f1] px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Moda Caro, Iruda, Connors..."
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    DNI / CUIT <span className="font-normal text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    className="w-full rounded-2xl border-none bg-[#f0f0f1] px-4 py-3.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={dniCuit}
                    onChange={e => setDniCuit(e.target.value)}
                    placeholder="Sin puntos"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    WhatsApp <span className="font-normal text-zinc-400">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-2xl bg-[#f0f0f1] px-4 py-3.5 focus-within:ring-2 focus-within:ring-zinc-900">
                    <span className="text-sm text-zinc-900">+54</span>
                    <input
                      className="w-full border-none bg-transparent text-sm text-zinc-900 focus:outline-none"
                      value={celular}
                      onChange={e => setCelular(e.target.value)}
                      placeholder="11 1234 5678"
                    />
                  </div>
                </div>

                {/* No está en el diseño de Figma, pero ya existía y create-tenant
                    lo usa — lo dejamos como cuarto campo opcional para no
                    perder la función de dominio propio durante el onboarding. */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Dominio propio <span className="font-normal text-zinc-400">(opcional)</span>
                  </label>
                  <input
                    className="w-full rounded-2xl border-none bg-[#f0f0f1] px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Ej: mitienda.com — lo podés configurar después"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                {/* Botón visible en mobile/tablet, donde no hay panel de imagen
                    para alojar el botón circular de "Siguiente". */}
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden">
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            </div>

            <div className="mt-12 hidden items-center gap-3 text-zinc-900 sm:flex">
              <GMark className="h-10 w-auto" />
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Safe · High · Gounuri</span>
            </div>
          </div>

          {/* Panel de imagen — carrusel de fotos del Hero + CTA circular */}
          <div className="relative hidden flex-1 lg:block">
            <div className="hero-slides">
              {ONBOARDING_SLIDES.map((src, i) => (
                <div key={src} className={`hero-slide${i === slideIndex ? ' active' : ''}`} style={{ backgroundImage: `url('${src}')` }} />
              ))}
            </div>
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-x-0 top-[28%] px-14 text-white xl:px-20">
              <h2 className="text-5xl font-extrabold">Bienvenido!</h2>
              <p className="mt-3 text-xl font-medium">B2B Mayoristas y B2C Minoristas</p>
            </div>

            <button
              type="submit"
              form="onb-paso1-form"
              aria-label="Continuar"
              className="absolute left-0 top-1/2 z-10 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-110"
              style={{ background: 'var(--red)' }}
            >
              <ArrowRight size={28} />
            </button>
          </div>

          {/* Franja lateral decorativa (bicolor, con isotipo) */}
          <div className="hidden w-[150px] flex-col xl:flex">
            <div className="flex-1" style={{ background: '#2f3b4c' }} />
            <div className="flex flex-1 items-center justify-center" style={{ background: 'var(--red)' }}>
              <GMark className="h-10 w-auto text-white" />
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: Template ── */}
      {step === 'template' && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Paso 2 de 3</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Elegí el diseño de tu tienda</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Podés cambiarlo después desde el panel. Hacé click en{' '}
            <ExternalLink size={11} className="inline" /> para ver la demo completa.
          </p>

          <div className="mb-8 mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map(t => (
              <TemplateCard
                key={t.slug}
                {...t}
                selected={template === t.slug}
                onSelect={() => setTemplate(t.slug)}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('nombre')} className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
              ← Volver
            </button>
            <button
              onClick={() => setStep('plan')}
              className="flex-1 rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Continuar con &quot;{templateElegido.nombre}&quot; →
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Plan ── */}
      {step === 'plan' && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Paso 3 de 3</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Elegí tu plan</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Probás el plan que elijas <strong>gratis durante {TRIAL_DAYS} días</strong>, sin tarjeta.
            Después lo activás desde el panel.
          </p>

          <div className="mb-8 mt-8 grid gap-5 lg:grid-cols-3">
            {PLANES.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`relative flex flex-col rounded-xl border-2 bg-white p-6 text-left transition-all ${
                  plan === p.id ? 'border-zinc-900 ring-2 ring-zinc-300' : 'border-zinc-200 hover:border-zinc-400'
                }`}
              >
                {p.destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                    Recomendado
                  </span>
                )}
                {plan === p.id && (
                  <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900">
                    <Check size={13} className="text-white" />
                  </div>
                )}
                <h3 className="text-base font-semibold text-zinc-900">{p.nombre}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{p.descripcion}</p>
                <p className="mt-4">
                  <span className="text-2xl font-bold tracking-tight text-zinc-900">{formatPrecio(p.precioARS)}</span>
                  <span className="ml-1 text-xs text-zinc-500">/ mes</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-900" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('template')} className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
              ← Volver
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving
                ? 'Creando tu tienda...'
                : `Crear mi tienda — ${TRIAL_DAYS} días gratis del plan ${planElegido.nombre} →`}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
