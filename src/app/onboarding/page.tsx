'use client'

// Onboarding post-registro: 1) nombre de la tienda → 2) template → 3) plan.
// Al finalizar crea el tenant (POST /api/create-tenant) y entrega la sesión
// al Panel Admin via /auth/handoff (tokens en el fragment, nunca en query).

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, demoUrl } from '@/lib/templates'
import { PLANES, PANEL_URL, TRIAL_DAYS, formatPrecio } from '@/lib/site'

type Step = 'nombre' | 'template' | 'plan'

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
  const [template, setTemplate] = useState('minimalista')
  const [plan, setPlan] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sin sesión no hay onboarding
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) window.location.href = '/registro'
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function handleNombreSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre de la tienda es obligatorio.'); return }
    setError(null)
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

    // Handoff de sesión al Panel Admin (tokens en fragment — no llegan al server)
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      window.location.href =
        `${PANEL_URL}/auth/handoff#access_token=${encodeURIComponent(session.access_token)}` +
        `&refresh_token=${encodeURIComponent(session.refresh_token)}`
    } else {
      window.location.href = `${PANEL_URL}/login`
    }
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

      {/* ── PASO 1: Nombre ── */}
      {step === 'nombre' && (
        <div className="mx-auto max-w-lg px-6 py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Paso 1 de 3</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Configurá tu tienda</h1>
          <p className="mt-1 text-sm text-zinc-500">Solo necesitamos el nombre para empezar.</p>

          <form onSubmit={handleNombreSubmit} className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Nombre de la tienda <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Moda Caro, Iruda, Connors..."
                autoFocus
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Dominio propio <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="Ej: mitienda.com"
              />
              <p className="mt-1 text-xs text-zinc-400">Lo podés configurar después desde el panel.</p>
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button type="submit" className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
              Continuar →
            </button>
          </form>
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
