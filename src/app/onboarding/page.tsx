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
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Check, ExternalLink, Loader2 } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, demoUrl } from '@/lib/templates'
import { PLANES, TRIAL_DAYS, formatPrecio } from '@/lib/site'

type Step = 'nombre' | 'template' | 'configurar' | 'plan'

// Cada paso tiene su propia dirección (?paso=01, 02, 03, 04) para que se
// pueda compartir/guardar un link a un paso puntual y para que el botón
// "atrás" del navegador vuelva al paso anterior en vez de salir de
// /onboarding. Sigue siendo la misma página/estado de siempre (no son rutas
// separadas) — solo se sincroniza la URL con `router.push` cada vez que
// cambia el paso.
const STEP_ORDER: Step[] = ['nombre', 'template', 'configurar', 'plan']
function stepParam(step: Step): string {
  return String(STEP_ORDER.indexOf(step) + 1).padStart(2, '0')
}
function stepFromParam(param: string | null): Step | null {
  const i = Number(param) - 1
  return STEP_ORDER[i] ?? null
}

// Fotos exportadas de Figma para el paso 1 (pantallas "Registracion
// 1A/1B/1C" — misma pantalla, 3 fondos distintos) — bajadas y comprimidas
// (PNG originales ~2.5-3.5MB c/u → JPG ~85% más liviano) en
// public/img/onboarding/.
const ONBOARDING_SLIDES = ['/img/onboarding/onboarding-01.jpg', '/img/onboarding/onboarding-02.jpg', '/img/onboarding/onboarding-03.jpg']

// Roadmap decorativo del panel derecho de los pasos 2+ (diseño Figma
// "Registracion 2", "Registracion 3", ...) — mismo espíritu que el
// "Bienvenido!" del paso 1: contexto/motivación, no forma parte de la
// lógica de `pasos`/Step de más abajo. Se reutiliza en cada pantalla con un
// activeIndex y color distintos (ver <RoadmapPanel>).
const ROADMAP_STEPS = [
  'Bienvenido',
  'Seleccioná un Template',
  'Configurá tu Tienda',
  'Cargá tus productos',
  'Escalá con tus Ventas',
]
// Separación real entre puntos en el asset "Puntos secuenciales.svg"
// (círculos en y=9.5, 142.5, 275.5, 408.5, 541.5 → 133px parejos).
const ROADMAP_ROW_GAP = 133

// Path del isotipo "G" de la franja lateral derecha — mismo en todas las
// pantallas (Registracion 2 y 3 comparten el mismo asset salvo el color del
// bloque inferior), solo cambia el color vía prop.
const G_ICON_PATH =
  'M90.752 1018.28L85.4541 1020.99C87.1055 1022.43 88.4021 1022.84 90.0283 1024.96C91.4512 1026.81 92.3987 1029.01 92.7627 1031.15C94.2271 1039.76 88.7192 1046.46 81.6738 1048.59C82.8602 1049.33 83.5949 1050.27 83.7139 1051.35C83.879 1052.85 82.8299 1054.37 80.9609 1055.68C82.1514 1056.12 83.2042 1056.98 83.876 1058.17C85.3404 1060.77 84.4422 1063.99 81.8701 1065.38C79.2977 1066.76 76.0252 1065.77 74.5606 1063.17C73.714 1061.67 73.6575 1059.96 74.2568 1058.51C73.2314 1058.76 72.1519 1058.96 71.0332 1059.1C63.6613 1060.04 57.3865 1058.07 57.0176 1054.72C56.6639 1051.5 61.8803 1048.17 68.8193 1047.09C60.7076 1042.33 59.9898 1033.16 63.4981 1027.19C65.9785 1022.97 68.8297 1021.61 73.7607 1019.05C78.1817 1016.76 82.9364 1014.06 87.4238 1012L90.752 1018.28ZM83.5244 1029.17C81.0462 1026.37 76.0541 1025.29 72.2647 1028.31L72.2637 1028.31C63.7815 1035.09 74.3451 1046.72 82.5098 1040C85.2929 1037.7 86.7021 1032.75 83.5244 1029.17Z'

// ── Panel derecho reutilizable: roadmap ("Bienvenido" → paso actual
//    destacado → pasos futuros) + botón circular "Siguiente" en el borde,
//    centrado verticalmente respecto al lienzo completo (top-1/2 sobre un
//    panel con el mismo alto que sus hermanos de la fila). El color cambia
//    por pantalla (verde oliva en "Seleccioná un Template", turquesa en
//    "Configurá tu Tienda", etc. — cada asset de Figma trae su propio
//    color). ────────────────────────────────────────────────────────────
function RoadmapPanel({ activeIndex, color, onNext }: { activeIndex: number; color: string; onNext: () => void }) {
  return (
    <div className="relative hidden lg:block lg:w-[22.8%]">
      {/* Puntos posicionados por altura fija (no por flujo/flex), para que
          la distancia entre uno y otro sea siempre la misma (133px, la
          separación real del asset) sin importar que el texto activo sea
          más grande que el resto. El punto activo se ubica exactamente en
          el centro vertical del panel — el mismo top-1/2 que usa el botón
          "Siguiente" — y los demás se calculan a partir de ahí. */}
      {ROADMAP_STEPS.map((label, i) => {
        const active = i === activeIndex
        const offset = (i - activeIndex) * ROADMAP_ROW_GAP
        return (
          <div
            key={label}
            className="absolute right-8 flex items-center gap-4 xl:right-10"
            style={{ top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' }}
          >
            <span
              className={
                active
                  ? 'text-right text-3xl font-extrabold leading-tight text-zinc-900'
                  : 'text-right text-base font-bold text-zinc-300'
              }
            >
              {label}
            </span>
            <span className="relative flex-shrink-0">
              <span className="block h-[19px] w-[19px] rounded-full" style={{ background: color }} />
              {/* Línea que conecta el 1er punto ("Bienvenido") con el punto
                  del paso actual — crece a medida que avanza el onboarding,
                  igual que en los assets "Puntos secuenciales/de
                  secuencia.svg" de cada pantalla. */}
              {i === 0 && activeIndex > 0 && (
                <span
                  className="absolute left-1/2 top-full w-[2px] -translate-x-1/2"
                  style={{ background: color, height: activeIndex * ROADMAP_ROW_GAP - 19 }}
                />
              )}
            </span>
          </div>
        )
      })}

      <button
        type="button"
        onClick={onNext}
        aria-label="Continuar"
        className="absolute left-0 top-1/2 z-10 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full transition hover:brightness-110 hover:scale-105"
        style={{ background: color }}
      >
        <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
          <path d="M49 38L32.5 47.5263L32.5 28.4737L49 38Z" fill="white" />
        </svg>
      </button>
    </div>
  )
}

// ── Franja lateral decorativa reutilizable — reconstruida con colores
//    sólidos exactos (nunca se deforman, a diferencia del asset compuesto)
//    en vez de estirar/recortar la imagen. El bloque superior es siempre
//    #454B53; el inferior cambia de color por pantalla. El isotipo "G"
//    queda centrado en su tamaño nativo, bajado a la posición real que
//    tiene dentro del asset (~9% del borde inferior del bloque). ────────
function SideStrip({ color }: { color: string }) {
  return (
    <div className="hidden xl:flex xl:w-[8.9%] xl:flex-col">
      <div className="flex-1" style={{ background: '#454B53' }} />
      <div className="relative flex-1" style={{ background: color }}>
        <svg
          width="28"
          height="40"
          viewBox="55 1010 41 59"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="absolute bottom-[9%] left-1/2 -translate-x-1/2"
        >
          <path d={G_ICON_PATH} fill="white" />
        </svg>
      </div>
    </div>
  )
}

// ── Tarjeta de template — misma captura y textos que la página /templates
//    (public/templates/{slug}.webp + TEMPLATES de lib/templates.ts), en vez
//    de reconstruir el mockup plano exportado de Figma: ese asset es solo
//    una captura de referencia de esa página, no contenido para renderizar
//    tal cual. Se le agrega el botón "Seleccionar" que no está en /templates
//    (ahí las tarjetas solo llevan a la demo — acá además hay que poder
//    elegir el diseño para el onboarding). ────────────────────────────────
function TemplateCard({
  slug, nombre, descripcion, publico, selected, onSelect,
}: {
  slug: string; nombre: string; descripcion: string; publico: string
  selected: boolean; onSelect: () => void
}) {
  const url = demoUrl(slug)

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-xl border-2 bg-white transition-all ${
        selected ? 'border-zinc-900 ring-2 ring-zinc-300' : 'border-zinc-200 hover:border-zinc-400'
      }`}
    >
      <div className="relative">
        {/* Misma captura full-page y misma animación que /templates: arranca
            mostrando el tope y al pasar el mouse "scrollea" hasta el pie de
            la página y vuelve (transition-[object-position]). */}
        {/* eslint-disable-next-line @next/next/no-img-element -- captura real, no asset vectorial */}
        <img
          src={`/templates/${slug}.webp`}
          alt={`Preview del template ${nombre}`}
          className="aspect-[4/3] w-full border-b border-zinc-100 object-cover object-top transition-[object-position] duration-[4000ms] ease-in-out group-hover:object-bottom"
        />
        {selected && (
          <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 shadow">
            <Check size={14} className="text-white" />
          </div>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Ver demo completa"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow transition-colors hover:text-zinc-900"
        >
          <ExternalLink size={13} />
        </a>
      </div>
      <div className="relative flex flex-1 flex-col p-5 pr-12">
        <h3 className="font-semibold text-zinc-900">{nombre}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{descripcion}</p>
        <p className="mt-3 text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">Ideal para:</span> {publico}
        </p>

        {/* Botón "Seleccionar" como ícono en la esquina inferior derecha de
            la tarjeta (asset "Boton seleccionar.svg") en vez del botón de
            ancho completo de antes, que tapaba el texto de "Ideal para"
            cuando la descripción era larga. */}
        <button
          type="button"
          onClick={onSelect}
          title={selected ? 'Seleccionado' : 'Seleccionar'}
          aria-pressed={selected}
          className={`absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            selected ? 'bg-zinc-900' : 'bg-zinc-100 hover:bg-zinc-200'
          }`}
        >
          {selected ? (
            <Check size={14} className="text-white" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7.385 16V7.385H16V8.385H9.092L16 15.292L15.292 16L8.384 9.092V16H7.385ZM3.692 16V14.77H4.923V16H3.692ZM0 1.23V0H1.23V1.23H0ZM3.692 1.23V0H4.923V1.23H3.692ZM7.384 1.23V0H8.616V1.23H7.384ZM11.077 1.23V0H12.307V1.23H11.077ZM14.769 1.23V0H16V1.23H14.769ZM0 16V14.77H1.23V16H0ZM0 12.308V11.077H1.23V12.307L0 12.308ZM0 8.615V7.385H1.23V8.615H0ZM0 4.923V3.693H1.23V4.923H0ZM14.77 4.923V3.693H16V4.923H14.77Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
    </div>
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
  const router = useRouter()
  // El nombre de tienda ya se pidió en /registro (gounuri_accounts.store_name)
  // y /auth/verificar lo pasa acá por query param al confirmar el mail — no
  // hace falta volver a pedirlo, pero el paso "nombre" sigue disponible por
  // si quieren cambiarlo (botón "← Volver" del paso 2).
  const searchParams = useSearchParams()
  const storeFromQuery = searchParams.get('store') ?? ''
  // `?paso=NN` manda sobre `?store=` si ambos están presentes (por ejemplo,
  // alguien que comparte/guarda el link de un paso puntual ya avanzado).
  const initialStep = stepFromParam(searchParams.get('paso')) ?? (storeFromQuery ? 'template' : 'nombre')
  const [step, setStepState] = useState<Step>(initialStep)
  const [name, setName] = useState(storeFromQuery)
  const [domain, setDomain] = useState('')
  const [dniCuit, setDniCuit] = useState('')
  const [celular, setCelular] = useState('')
  const [template, setTemplate] = useState('minimalista')
  const [plan, setPlan] = useState('standard')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)

  // Cambia de paso y refleja el nuevo paso en la URL (`?paso=01/02/03/04`)
  // con `router.push`, para que quede como una entrada de historial propia
  // — el botón "atrás" del navegador vuelve al paso anterior en vez de
  // salir de /onboarding. Ojo: esto NO persiste los datos ya cargados
  // (nombre, template, etc.) — siguen viviendo solo en memoria de React,
  // así que entrar de cero a un link de un paso avanzado no trae precargado
  // lo que se completó antes.
  function goToStep(next: Step) {
    setStepState(next)
    router.push(`/onboarding?paso=${stepParam(next)}`, { scroll: false })
  }

  // Si se entra sin `?paso=` (por ejemplo /onboarding a secas, o con
  // `?store=`), deja la URL en línea con el paso inicial ya resuelto —
  // reemplaza en vez de empujar, para no sumar una entrada de historial
  // extra en la primera carga.
  useEffect(() => {
    if (!searchParams.get('paso')) {
      router.replace(`/onboarding?paso=${stepParam(initialStep)}`, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

    goToStep('template')
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
      if (res.status === 409) goToStep('nombre')
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
    { id: 'configurar', label: '3. Configuración' },
    { id: 'plan', label: '4. Plan' },
  ]
  const planElegido = PLANES.find(p => p.id === plan) ?? PLANES[1]
  const templateElegido = TEMPLATES.find(t => t.slug === template) ?? TEMPLATES[0]

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header — en los pasos 1, 2 y 2.5 usamos el navbar real del sitio
          (igual al diseño de Figma "Registracion 1", "2" y "3"); en el paso
          de plan seguimos con la barra liviana con el indicador de paso,
          que todavía no tiene diseño de Figma. */}
      {step === 'nombre' || step === 'template' || step === 'configurar' ? (
        <Navbar />
      ) : (
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
      )}

      {/* ── PASO 1: Nombre (diseño Figma "Registracion 1A/1B/1C") ── */}
      {step === 'nombre' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          {/* Panel del formulario — el bloque de datos va centrado en el eje Y
              (flex-1 + justify-center), el logo queda fijo abajo a la
              izquierda sin importar cuánto contenido tenga el formulario. */}
          <div className="relative flex w-full flex-col px-6 py-12 sm:px-16 sm:py-16 lg:w-1/2 lg:px-24">
            {/* Título en el flujo normal, arriba del todo (ya no forma parte
                del bloque centrado) — queda más arriba que antes. */}
            <h1 className="text-4xl font-extrabold leading-[1.15] text-zinc-900 sm:text-5xl">
              Empezamos a crear<br />tu tienda.
            </h1>

            {/* Bloque de 4 campos centrado respecto al botón "Siguiente": el
                botón usa top-1/2 -translate-y-1/2 sobre el panel de imagen,
                que tiene el mismo alto (son hermanos flex de la misma fila).
                Usamos la misma técnica acá, desacoplada del título y del
                logo, para que ambos queden a la misma altura exacta. En
                mobile/tablet (sin botón circular) el form sigue en el flujo
                normal, debajo del título. */}
            <form
              id="onb-paso1-form"
              onSubmit={handleNombreSubmit}
              className="mt-10 max-w-md space-y-5 lg:absolute lg:left-24 lg:right-24 lg:top-1/2 lg:mt-0 lg:w-auto lg:-translate-y-1/2"
            >
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

            {/* Logo fijo abajo a la izquierda — posición absoluta en vez de
                empujado por flujo normal, así no se mueve si el form cambia
                de alto (validación, error, etc). Agrandado 150% respecto al
                tamaño anterior. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- asset SVG exportado de Figma tal cual, no una foto a optimizar */}
            <img src="/img/onboarding/g-logo-slogan.svg" alt="gounuri.com" className="absolute bottom-10 left-6 hidden h-36 w-auto sm:left-16 sm:block lg:left-24" />
          </div>

          {/* Panel de imagen — foto exportada de Figma tal cual, sin filtro ni
              velo oscuro encima (se había aplicado un overlay negro y un
              filtro grayscale/brightness que no eran parte del asset — se
              sacan). Rota entre las 3 sin crossfade (se reemplaza el div
              entero vía `key`, nunca hay dos fotos superpuestas). Ancho fijo
              en % (no flex-1) para mantener la proporción exacta del Figma:
              form 50% / foto 41.1% (710 de 1728) / franja 8.9% (150 de 1728). */}
          <div className="relative hidden lg:block lg:w-[41.1%]">
            <div
              key={slideIndex}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${ONBOARDING_SLIDES[slideIndex]}')` }}
            />
            {/* "Bienvenido!" centrado como bloque en X e Y respecto a la foto,
                pero con las dos líneas alineadas a la izquierda entre sí
                (en vez de cada una centrada por separado), para que ambos
                renglones arranquen en el mismo borde. */}
            <div className="absolute inset-0 flex items-center justify-center px-6 text-white">
              <div className="text-left">
                <h2 className="text-[3.6rem] font-extrabold">Bienvenido!</h2>
                <p className="mt-1 text-xl font-medium">B2B Mayoristas y B2C Minoristas</p>
              </div>
            </div>

            <button
              type="submit"
              form="onb-paso1-form"
              aria-label="Continuar"
              className="absolute left-0 top-1/2 z-10 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 transition hover:brightness-110 hover:scale-105"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/onboarding/boton-siguiente.svg" alt="Continuar" className="h-full w-full drop-shadow-lg" />
            </button>
          </div>

          {/* Franja lateral decorativa — reconstruida con los colores exactos
              del SVG (#454B53 / #FE4648) en dos bloques al 50%, en vez de
              estirar/recortar la imagen compuesta. Así los rectángulos nunca
              se deforman (son color sólido, no importa el tamaño) y el
              isotipo "G" queda siempre centrado de verdad en el bloque rojo,
              en su tamaño nativo — sin forzar ningún recorte o escalado. */}
          <div className="hidden xl:flex xl:w-[8.9%] xl:flex-col">
            <div className="flex-1" style={{ background: '#454B53' }} />
            {/* Isotipo "G" bajado a la parte inferior-central del bloque
                rojo (no al centro exacto), replicando su posición real
                dentro del asset original: en el SVG de 150×1117 el ícono
                termina ~50px antes del borde inferior del bloque rojo de
                559px de alto (~9%). Usamos position absolute + bottom en %
                para que esa proporción se mantenga sea cual sea el alto de
                pantalla. */}
            <div className="relative flex-1" style={{ background: '#FE4648' }}>
              <svg
                width="28"
                height="40"
                viewBox="55 1010 41 59"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="absolute bottom-[9%] left-1/2 -translate-x-1/2"
              >
                <path d="M90.752 1018.28L85.4541 1020.99C87.1055 1022.43 88.4021 1022.84 90.0283 1024.96C91.4512 1026.81 92.3987 1029.01 92.7627 1031.15C94.2271 1039.76 88.7192 1046.46 81.6738 1048.59C82.8602 1049.33 83.5949 1050.27 83.7139 1051.35C83.879 1052.85 82.8299 1054.37 80.9609 1055.68C82.1514 1056.12 83.2042 1056.98 83.876 1058.17C85.3404 1060.77 84.4422 1063.99 81.8701 1065.38C79.2977 1066.76 76.0252 1065.77 74.5606 1063.17C73.714 1061.67 73.6575 1059.96 74.2568 1058.51C73.2314 1058.76 72.1519 1058.96 71.0332 1059.1C63.6613 1060.04 57.3865 1058.07 57.0176 1054.72C56.6639 1051.5 61.8803 1048.17 68.8193 1047.09C60.7076 1042.33 59.9898 1033.16 63.4981 1027.19C65.9785 1022.97 68.8297 1021.61 73.7607 1019.05C78.1817 1016.76 82.9364 1014.06 87.4238 1012L90.752 1018.28ZM83.5244 1029.17C81.0462 1026.37 76.0541 1025.29 72.2647 1028.31L72.2637 1028.31C63.7815 1035.09 74.3451 1046.72 82.5098 1040C85.2929 1037.7 86.7021 1032.75 83.5244 1029.17Z" fill="white" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: Template (diseño Figma "Registracion 2") ── */}
      {step === 'template' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          {/* Panel de templates — grilla 3×2 con las tarjetas reales (misma
              captura y textos que /templates), fondo gris clarito como en
              el Figma. Ancho en % siguiendo la misma proporción del lienzo
              (1184 de 1728). */}
          <div className="w-full overflow-y-auto bg-[#fafafa] px-6 py-10 sm:px-10 lg:w-[68.5%] lg:px-14 lg:py-14">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {TEMPLATES.map(t => (
                <TemplateCard
                  key={t.slug}
                  {...t}
                  selected={template === t.slug}
                  onSelect={() => setTemplate(t.slug)}
                />
              ))}
            </div>

            {/* Botón visible en mobile/tablet, donde no hay panel derecho
                para alojar el botón circular de "Siguiente". */}
            <button
              type="button"
              onClick={() => goToStep('configurar')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden"
            >
              Continuar con &quot;{templateElegido.nombre}&quot; <ArrowRight size={16} />
            </button>
          </div>

          <RoadmapPanel activeIndex={1} color="#B9C96F" onNext={() => goToStep('configurar')} />
          <SideStrip color="#B9C96F" />
        </div>
      )}

      {/* ── PASO 2.5: Configurar tu tienda (diseño Figma "Registracion 3") —
          pantalla informativa, sin datos propios que guardar todavía (los
          campos de Contacto y Redes son un preview de lo que va a poder
          cargar más adelante desde el Panel Admin/perfil). ── */}
      {step === 'configurar' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          <div className="w-full overflow-y-auto bg-[#f2f2f2] px-6 py-10 sm:px-10 lg:w-[68.5%] lg:px-14 lg:py-14">
            <div className="max-w-3xl space-y-8 text-black">
              <section>
                <h2 className="text-2xl font-bold">General</h2>
                <p className="mt-3 leading-relaxed">
                  Podés activar <strong className="font-bold">modo sin stock</strong>, si preferís operar sin especificar el stock de cada producto publicado.
                  <br />
                  También podés definir el <strong className="font-bold">monto mínimo de pedido</strong> y{' '}
                  <strong className="font-bold">la cantidad mínima de unidades para la venta mayorista</strong>.
                  <br />
                  Tu tienda está preparada para <strong className="font-bold">precios escalonados</strong> por volumen o según el segmento de clientes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Contacto y Redes</h2>
                <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">WhatsApp</label>
                    <input disabled className="w-full rounded-[10px] border-none bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Dirección</label>
                    <input disabled className="w-full rounded-[10px] border-none bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Instagram</label>
                    <input disabled className="w-full rounded-[10px] border-none bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">Facebook</label>
                    <input disabled className="w-full rounded-[10px] border-none bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm" />
                  </div>
                </div>
                <p className="mt-4 leading-relaxed">
                  Para campañas de publicidad en Meta, Google Ads o TikTok, podés instalar los píxeles de seguimiento simplemente ingresando el Meta Pixel ID, Google Ads ID o TikTok Pixel ID.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Cobranzas &amp; Finanzas</h2>
                <p className="mt-3 leading-relaxed">Tu tienda ofrece 3 formas de cobro:</p>
                <ul className="ml-6 list-disc leading-relaxed">
                  <li>Mercado Pago</li>
                  <li>Transferencia bancaria</li>
                  <li>Efectivo en el local</li>
                </ul>
                <p className="mt-3 leading-relaxed">
                  <strong className="font-bold italic">Debés habilitar al menos una forma de cobro</strong> para que tus clientes puedan finalizar la compra.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Envíos</h2>
                <p className="mt-3 leading-relaxed">
                  Podés habilitar distintos tipos de envío según las necesidades de tu tienda, como envío a domicilio, retiro en local u otras modalidades disponibles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Catálogo</h2>
                <p className="mt-3 leading-relaxed">
                  Esta sección es para definir las <strong className="font-bold">variantes</strong> y <strong className="font-bold">atributos</strong> de tus productos, como talle, color, tamaño u otras características, y establecer el <strong className="font-bold">formato</strong> y las dimensiones recomendadas para las imágenes de producto.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Apariencia</h2>
                <p className="mt-3 leading-relaxed">
                  Podés personalizar tu landing page a tu gusto, cambiando imágenes, logotipo y otros elementos visuales con solo <strong className="font-bold">arrastrar y soltar</strong> para adaptarlos a la identidad de tu marca.
                </p>
              </section>
            </div>

            {/* Botón visible en mobile/tablet, donde no hay panel derecho
                para alojar el botón circular de "Siguiente". */}
            <button
              type="button"
              onClick={() => goToStep('plan')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden"
            >
              Continuar <ArrowRight size={16} />
            </button>
          </div>

          <RoadmapPanel activeIndex={2} color="#3B9DA2" onNext={() => goToStep('plan')} />
          <SideStrip color="#3B9DA2" />
        </div>
      )}

      {/* ── PASO 3: Plan ── */}
      {step === 'plan' && (
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Paso 4 de 4</p>
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
            <button onClick={() => goToStep('template')} className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100">
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
