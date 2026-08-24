'use client'

// Onboarding post-registro: 1) nombre de la tienda → 2) template →
// 3) configurar tienda → 4) cargá tus productos → 5) escalá con tus ventas
// (CTA final: prueba gratis directo o ir al selector de planes) → 6) plan.
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
import { ArrowRight, Check, ExternalLink, Loader2, Wallet } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Pricing from '@/components/Pricing'
import SideStrip from '@/components/SideStrip'
import TransferPaymentBlock from '@/components/TransferPaymentBlock'
import { createClient } from '@/lib/supabase/client'
import { TEMPLATES, demoUrl } from '@/lib/templates'
import { PLANES, TRIAL_DAYS, formatPrecio } from '@/lib/site'
import { priceForTerm, TERM_DISCOUNTS, type BillingTerm, type PlanId } from '@/lib/plans'
import type { PlatformPaymentSettings } from '@/lib/platformBilling'

type Step = 'nombre' | 'template' | 'configurar' | 'productos' | 'escalar' | 'plan' | 'pago'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Cada paso tiene su propia dirección (?paso=01, 02, 03, 04, 05, 06, 07) para
// que se pueda compartir/guardar un link a un paso puntual y para que el
// botón "atrás" del navegador vuelva al paso anterior en vez de salir de
// /onboarding. Sigue siendo la misma página/estado de siempre (no son rutas
// separadas) — solo se sincroniza la URL con `router.push` cada vez que
// cambia el paso.
const STEP_ORDER: Step[] = ['nombre', 'template', 'configurar', 'productos', 'escalar', 'plan', 'pago']
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
// Mismo orden que ROADMAP_STEPS de arriba — a qué Step navega cada punto
// del roadmap al hacer click (pedido 2026-08-18: "linkear los puntos a las
// páginas de onboarding"). Solo se habilitan los puntos ya alcanzados (índice
// <= activeIndex, ver RoadmapPanel) — los pasos futuros quedan deshabilitados
// a propósito: goToStep no persiste lo ya cargado en pasos anteriores, así
// que saltar hacia adelante mostraría un paso sin los datos de los que se
// saltearon.
const ROADMAP_STEP_TARGETS: Step[] = ['nombre', 'template', 'configurar', 'productos', 'escalar']
// Separación real entre puntos en el asset "Puntos secuenciales.svg"
// (círculos en y=9.5, 142.5, 275.5, 408.5, 541.5 → 133px parejos).
const ROADMAP_ROW_GAP = 133

// ── Panel derecho reutilizable: roadmap ("Bienvenido" → paso actual
//    destacado → pasos futuros) + botón circular "Siguiente" en el borde,
//    centrado verticalmente respecto al lienzo completo (top-1/2 sobre un
//    panel con el mismo alto que sus hermanos de la fila). El color cambia
//    por pantalla (verde oliva en "Seleccioná un Template", turquesa en
//    "Configurá tu Tienda", etc. — cada asset de Figma trae su propio
//    color). ────────────────────────────────────────────────────────────
function RoadmapPanel({
  activeIndex, color, onNext, onStepClick, compactButton = false, triangleOpacity = 1,
}: {
  activeIndex: number
  color: string
  onNext: () => void
  /** Navega al hacer click en cualquiera de los puntos del roadmap (no solo
      el botón "Siguiente") — pedido 2026-08-18. */
  onStepClick: (step: Step) => void
  /** Pedido puntual para paso=02 ("Seleccioná un Template"): botón
      "Siguiente" al 75% de su tamaño normal — no cambia el resto de los
      pasos que reusan este mismo componente. */
  compactButton?: boolean
  /** Pedido puntual para paso=02: opacidad del triángulo (no del círculo
      de fondo) al 50%. */
  triangleOpacity?: number
}) {
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
        // Solo los pasos ya alcanzados (el actual incluido) son clickeables
        // — los futuros quedan deshabilitados, ver comentario en
        // ROADMAP_STEP_TARGETS más arriba.
        const reached = i <= activeIndex
        const offset = (i - activeIndex) * ROADMAP_ROW_GAP
        return (
          <button
            key={label}
            type="button"
            onClick={() => onStepClick(ROADMAP_STEP_TARGETS[i])}
            disabled={!reached}
            aria-label={`Ir a "${label}"`}
            className={`absolute right-8 flex items-center gap-4 border-0 bg-transparent p-0 text-left transition-opacity xl:right-10 ${reached ? 'cursor-pointer hover:opacity-70' : 'cursor-default'}`}
            style={{ top: `calc(50% + ${offset}px)`, transform: 'translateY(-50%)' }}
          >
            <span
              className={
                active
                  ? 'w-[230px] max-w-[230px] text-right text-3xl font-extrabold leading-tight text-zinc-900'
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
          </button>
        )
      })}

      <button
        type="button"
        onClick={onNext}
        aria-label="Continuar"
        className={`absolute left-0 top-1/2 z-10 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full transition hover:brightness-110 hover:scale-105 ${compactButton ? 'scale-75' : ''}`}
        style={{ background: color }}
      >
        <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
          <path d="M49 38L32.5 47.5263L32.5 28.4737L49 38Z" fill="white" fillOpacity={triangleOpacity} />
        </svg>
      </button>
    </div>
  )
}

// SideStrip (franja lateral decorativa) ahora vive en
// @/components/SideStrip — extraído 2026-08-17 para reusarlo también en
// /registro (mismo patrón visual: "Registracion 1/5/6" comparten esta
// franja, solo cambia el color del bloque inferior).

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
  const [plan, setPlan] = useState<PlanId>('standard')
  const [billingTerm, setBillingTerm] = useState<BillingTerm>(1)
  // La tienda se crea al elegir un plan en el paso "Plan" (antes de pasar a
  // "Pago") — este flag evita volver a crearla si el usuario va para atrás y
  // elige otro plan (el 2do POST a /api/create-tenant fallaría con 409,
  // nombre ya en uso). El plan/plazo elegido se manda recién al suscribir.
  const [tenantReady, setTenantReady] = useState(false)
  const [payerEmail, setPayerEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  // Paso "Configurá tu Tienda" (2026-08-18): se partió en 2 pantallas dentro
  // del mismo Step/roadmap — 0 = formulario de Contacto y Redes, 1 =
  // recomendaciones (informativa, como antes). Los campos de contacto se
  // guardan literalmente con los mismos nombres de columna que usa la
  // pantalla de Contacto y Redes real del Panel Admin (store_config:
  // whatsapp_number/instagram_url/facebook_url/tiktok_url/pickup_address/
  // store_address — ver panel-admin/src/app/dashboard/contacto/page.tsx),
  // y se mandan en el POST a /api/create-tenant para que quede precargado
  // ahí mismo desde el momento en que se crea la tienda.
  const [configStep, setConfigStep] = useState<0 | 1>(0)
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [direccion, setDireccion] = useState('')
  const [direccionDespacho, setDireccionDespacho] = useState('')

  // Ver comentario en el useEffect que lo consulta (/api/mi-estado-onboarding)
  const [isPlaceholderPaid, setIsPlaceholderPaid] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  // Métodos de pago habilitados desde superadmin (2026-08-22) — ver paso
  // "Pago" más abajo: si Mercado Pago está apagado, se ofrece transferencia
  // en su lugar (mismo componente que /perfil/plan/PlanSelector.tsx). null
  // mientras carga, para no mostrar el formulario de MP de entrada y que
  // "salte" apenas llega la respuesta.
  const [paymentSettings, setPaymentSettings] = useState<PlatformPaymentSettings | null>(null)

  // Pantalla "Confirmando tu pago..." (2026-08-18) — a dónde vuelve MP
  // (back_url) después de pagar desde /api/ir-a-plan sin tener tienda
  // todavía. El tenant recién lo crea el webhook de Panel Admin cuando
  // confirma 'authorized', y eso puede tardar unos segundos más que el
  // redirect del navegador — este estado sondea /api/mi-estado-onboarding
  // hasta que aparezca. Ver el useEffect de más abajo.
  const [confirmandoPago, setConfirmandoPago] = useState(() => searchParams.get('paso') === 'confirmando')
  const [confirmandoTimeout, setConfirmandoTimeout] = useState(false)
  const [pollAttempt, setPollAttempt] = useState(0)

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

  // Igual que goToStep, pero para los clicks en los puntos del roadmap
  // (RoadmapPanel.onStepClick): si el destino es "configurar", siempre
  // vuelve a la 1ra de sus 2 sub-pantallas (el formulario de Contacto y
  // Redes) — si no, saltar al punto del roadmap dejaría a alguien que ya
  // había avanzado a la sub-pantalla de recomendaciones sin forma simple de
  // volver a ver/editar el formulario.
  function handleStepClick(target: Step) {
    if (target === 'configurar') setConfigStep(0)
    goToStep(target)
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
      // Precarga el email de pago con el de la cuenta — igual que
      // PlanSelector.tsx en /perfil/plan. No tiene por qué ser el mismo con
      // el que se paga en Mercado Pago, así que sigue siendo editable.
      if (user?.email) setPayerEmail(user.email)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ¿Ya tiene una tienda placeholder pagada? (eligió un plan desde la
  // landing sin tener tienda todavía — ver /api/ir-a-plan — y ya completó el
  // pago). En ese caso el paso "Escalá con tus Ventas" no debe volver a
  // ofrecer prueba gratis / elegir plan: solo tiene que completar
  // nombre/template/contacto acá y listo, sin pasar de nuevo por Plan/Pago.
  useEffect(() => {
    fetch('/api/mi-estado-onboarding')
      .then(res => res.json())
      .then(json => {
        if (json?.isPlaceholder) {
          setIsPlaceholderPaid(true)
          if (json.plan) setPlan(json.plan)
        }
      })
      .catch(e => console.error('[onboarding] no se pudo consultar el estado de la tienda', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch('/api/billing/payment-settings')
      .then(res => res.json())
      .then(json => { if (json && !json.error) setPaymentSettings(json) })
      .catch(e => console.error('[onboarding] no se pudieron consultar los métodos de pago', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sondeo de la pantalla "Confirmando tu pago..." — solo corre mientras
  // confirmandoPago esté prendido (?paso=confirmando). Reintenta cada 1.5s
  // hasta 20 veces (~30s); si el webhook todavía no creó el tenant para
  // entonces, se corta y se ofrece un botón para reintentar a mano
  // (pollAttempt fuerza que el effect vuelva a correr).
  useEffect(() => {
    if (!confirmandoPago) return
    let cancelled = false
    let tries = 0
    const MAX_TRIES = 20

    function poll() {
      fetch('/api/mi-estado-onboarding')
        .then(res => res.json())
        .then(json => {
          if (cancelled) return
          if (json?.isPlaceholder) {
            setIsPlaceholderPaid(true)
            if (json.plan) setPlan(json.plan)
            setConfirmandoPago(false)
            goToStep('nombre')
            return
          }
          tries++
          if (tries >= MAX_TRIES) { setConfirmandoTimeout(true); return }
          setTimeout(poll, 1500)
        })
        .catch(e => {
          console.error('[onboarding] error consultando confirmación de pago', e)
          if (cancelled) return
          tries++
          if (tries >= MAX_TRIES) { setConfirmandoTimeout(true); return }
          setTimeout(poll, 1500)
        })
    }
    poll()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmandoPago, pollAttempt])

  // Carrusel de fondo del paso 1 (mismo timing que el Hero de gounuri.com)
  useEffect(() => {
    if (step !== 'nombre') return
    const t = setInterval(() => setSlideIndex(i => (i + 1) % ONBOARDING_SLIDES.length), 3500)
    return () => clearInterval(t)
  }, [step])

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

  // POST a /api/create-tenant, factorizado para poder usarse tanto desde el
  // botón directo de "prueba gratis" (handleFinalSubmit, que redirige a
  // /perfil) como desde el selector de plan real (handleSelectPlan, que en
  // cambio sigue al paso "Pago" sin salir de /onboarding). Devuelve
  // true/false para que cada llamador decida qué hacer después.
  async function createTenant(planId: PlanId): Promise<boolean> {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/create-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        domain: domain.trim() || null,
        template,
        plan: planId,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        direccion: direccion.trim() || null,
        direccionDespacho: direccionDespacho.trim() || null,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || json.error) {
      setError(json.error ?? 'Error al crear la tienda. Probá de nuevo.')
      // 409 = nombre ya en uso — hay que volver al paso 1 para que lo cambien,
      // no tiene sentido dejarlos varados viendo el error.
      if (res.status === 409) goToStep('nombre')
      return false
    }
    return true
  }

  async function handleFinalSubmit() {
    const ok = await createTenant(plan)
    if (!ok) return
    // Tienda creada — quedarse en gounuri.com (Mi cuenta), no saltar a Panel
    // Admin de una. La sesión ya está en las cookies de este mismo dominio,
    // no hace falta ningún handoff para esto.
    window.location.href = '/perfil'
  }

  // Para quien ya pagó un plan desde la landing sin tener tienda todavía
  // (isPlaceholderPaid, ver /api/mi-estado-onboarding): en vez de crear una
  // tienda nueva o volver a pedir plan/pago, completa con nombre/template/
  // contacto real el tenant placeholder que ya existe.
  async function handleFinalizarTienda() {
    if (!name.trim()) { setError('El nombre de la tienda es obligatorio.'); goToStep('nombre'); return }
    setFinalizando(true)
    setError(null)
    const res = await fetch('/api/finalizar-tienda', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        domain: domain.trim() || null,
        template,
        whatsapp: whatsapp.trim() || null,
        instagram: instagram.trim() || null,
        facebook: facebook.trim() || null,
        tiktok: tiktok.trim() || null,
        direccion: direccion.trim() || null,
        direccionDespacho: direccionDespacho.trim() || null,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setFinalizando(false)
    if (!res.ok || json.error) {
      setError(json.error ?? 'Error al completar la tienda. Probá de nuevo.')
      if (res.status === 409) goToStep('nombre')
      return
    }
    window.location.href = '/perfil'
  }

  // Tarjeta de plan elegida en el paso "Plan" (Pricing en mode="select"):
  // crea la tienda con ese plan/plazo (si todavía no existe — ver comentario
  // de `tenantReady`) y sigue al paso "Pago" para suscribir de verdad vía
  // Mercado Pago, en vez de crear directo con prueba gratis.
  async function handleSelectPlan(planId: PlanId, term: BillingTerm) {
    setPlan(planId)
    setBillingTerm(term)
    if (tenantReady) { goToStep('pago'); return }
    const ok = await createTenant(planId)
    if (!ok) return
    setTenantReady(true)
    goToStep('pago')
  }

  // Paso "Pago": inicia la suscripción real en Mercado Pago (Preapproval) —
  // mismo endpoint que usa /perfil/plan — y redirige al checkout de MP.
  async function handlePagar() {
    if (!EMAIL_RE.test(payerEmail.trim())) {
      setError('Ingresá el email de tu cuenta de Mercado Pago.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, payerEmail: payerEmail.trim(), months: billingTerm }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.init_point) throw new Error(json.error ?? 'No se pudo iniciar el pago. Probá de nuevo.')
      window.location.href = json.init_point
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago. Probá de nuevo.')
      setSaving(false)
    }
  }

  const templateElegido = TEMPLATES.find(t => t.slug === template) ?? TEMPLATES[0]
  const planElegido = PLANES.find(p => p.id === plan) ?? PLANES[1]

  // Cálculos del paso "Pago" (diseño Figma "Pago con Tarjeta") — mismas
  // fórmulas que ya usan Pricing.tsx/PlanSelector.tsx (priceForTerm ya
  // aplica el descuento por plazo), para no duplicar la lógica de precios.
  const pagoTotal = priceForTerm(plan, billingTerm)
  const pagoSinDescuento = planElegido.precioARS * billingTerm
  const pagoDescuentoMonto = pagoSinDescuento - pagoTotal
  const pagoDescuentoPct = TERM_DISCOUNTS[billingTerm] * 100
  const pagoTermLabel = billingTerm === 1 ? 'mensual' : billingTerm === 6 ? 'semestral' : 'anual'
  const pagoInicio = new Date()
  const pagoFin = new Date(pagoInicio)
  pagoFin.setMonth(pagoFin.getMonth() + billingTerm)
  const fmtFecha = (d: Date) => d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Pantalla "Confirmando tu pago..." — reemplaza todo el resto mientras
  // espera al webhook (ver el useEffect de sondeo más arriba). Return
  // temprano a propósito: ningún paso normal (nombre/template/etc.) tiene
  // sentido mostrar acá, el tenant todavía ni existe.
  if (confirmandoPago) {
    return (
      <main className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-6 text-center">
          {confirmandoTimeout ? (
            <>
              <p className="mb-2 text-xl font-bold text-zinc-900">Todavía estamos confirmando tu pago</p>
              <p className="mb-6 max-w-sm text-sm text-zinc-500">
                Puede demorar un poco más de lo esperado. Probá de nuevo en unos segundos — si ya pagaste, no hace falta que vuelvas a hacerlo.
              </p>
              <button
                type="button"
                onClick={() => { setConfirmandoTimeout(false); setPollAttempt(a => a + 1) }}
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Reintentar
              </button>
            </>
          ) : (
            <>
              <Loader2 size={32} className="mb-4 animate-spin text-zinc-400" />
              <p className="text-xl font-bold text-zinc-900">Confirmando tu pago...</p>
              <p className="mt-2 max-w-sm text-sm text-zinc-500">Esto toma solo unos segundos. No cierres esta ventana.</p>
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header — navbar real del sitio en todos los pasos (diseño Figma
          "Registracion 1" a "6"/"Pago con Tarjeta"). Ya no queda ningún paso
          usando la barra liviana de antes (esa era solo para cuando el paso
          de Plan todavía no tenía diseño de Figma). */}
      <Navbar />

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

            {/* Bloque de 4 campos centrado en el espacio en blanco que queda
                entre el título y el logo — flex-1 + justify-center en vez de
                position absolute + top-1/2 (que dependía de calcular bien el
                alto exacto del panel y no quedaba centrado en todas las
                pantallas). Con flexbox se recalcula solo con cualquier alto
                de pantalla, sin importar cuánto contenido tenga el form. En
                mobile/tablet (sin botón circular) el form sigue en el flujo
                normal, debajo del título. */}
            <div className="flex flex-1 flex-col justify-center py-8 lg:py-12">
              <form
                id="onb-paso1-form"
                onSubmit={handleNombreSubmit}
                className="w-full -translate-y-6 space-y-5 lg:-translate-y-8"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Nombre de la Tienda <span className="text-red-400">*</span>
                  </label>
                  <input
                    className="w-full rounded-[15px] border border-[#d9d9d9] bg-white px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
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
                    className="w-full rounded-[15px] border border-[#d9d9d9] bg-white px-4 py-3.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={dniCuit}
                    onChange={e => setDniCuit(e.target.value)}
                    placeholder="Sin puntos"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    WhatsApp <span className="font-normal text-zinc-400">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-2 rounded-[15px] border border-[#d9d9d9] bg-white px-4 py-3.5 focus-within:ring-2 focus-within:ring-zinc-900">
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
                    className="w-full rounded-[15px] border border-[#d9d9d9] bg-white px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    placeholder="Ej: mitienda.com — lo podés configurar después"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                )}

                {/* Botón "Siguiente" de escritorio (diseño Figma actualizado
                    "Registracion 1B/1C" — pill negra 162×31, alineada a la
                    derecha justo debajo del bloque de 4 campos, reemplaza el
                    botón circular que antes flotaba sobre el borde de la
                    foto). En mobile/tablet sigue el botón ancho de abajo.
                    Asset SVG exportado tal cual de Figma (Button.svg,
                    componente "Button" node 1038:230) — mismo patrón que
                    el botón "Ingresar a mi tienda" de NavAuth.tsx (texto y
                    tilde vectorizados, no HTML). */}
                <div className="hidden justify-end lg:flex">
                  <button type="submit" aria-label="Siguiente" className="transition hover:brightness-110">
                    <svg width="162" height="31" viewBox="0 0 162 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="162" height="31" rx="7" fill="black" />
                      <path d="M38.2188 13.5653C38.1733 13.1619 37.9858 12.8494 37.6562 12.6278C37.3267 12.4034 36.9119 12.2912 36.4119 12.2912C36.054 12.2912 35.7443 12.348 35.483 12.4616C35.2216 12.5724 35.0185 12.7259 34.8736 12.9219C34.7315 13.1151 34.6605 13.3352 34.6605 13.5824C34.6605 13.7898 34.7088 13.9687 34.8054 14.1193C34.9048 14.2699 35.0341 14.3963 35.1932 14.4986C35.3551 14.598 35.5284 14.6818 35.7131 14.75C35.8977 14.8153 36.0753 14.8693 36.2457 14.9119L37.098 15.1335C37.3764 15.2017 37.6619 15.294 37.9545 15.4105C38.2472 15.527 38.5185 15.6804 38.7685 15.8707C39.0185 16.0611 39.2202 16.2969 39.3736 16.5781C39.5298 16.8594 39.608 17.196 39.608 17.5881C39.608 18.0824 39.4801 18.5213 39.2244 18.9048C38.9716 19.2884 38.6037 19.5909 38.1207 19.8125C37.6406 20.0341 37.0597 20.1449 36.3778 20.1449C35.7244 20.1449 35.1591 20.0412 34.6818 19.8338C34.2045 19.6264 33.831 19.3324 33.5611 18.9517C33.2912 18.5682 33.142 18.1136 33.1136 17.5881H34.4347C34.4602 17.9034 34.5625 18.1662 34.7415 18.3764C34.9233 18.5838 35.1548 18.7386 35.4361 18.8409C35.7202 18.9403 36.0312 18.9901 36.3693 18.9901C36.7415 18.9901 37.0724 18.9318 37.3622 18.8153C37.6548 18.696 37.8849 18.5312 38.0526 18.321C38.2202 18.108 38.304 17.8594 38.304 17.5753C38.304 17.3168 38.2301 17.1051 38.0824 16.9403C37.9375 16.7756 37.7401 16.6392 37.4901 16.5312C37.2429 16.4233 36.9631 16.3281 36.6506 16.2457L35.6193 15.9645C34.9205 15.7741 34.3665 15.4943 33.9574 15.125C33.5511 14.7557 33.348 14.267 33.348 13.6591C33.348 13.1562 33.4844 12.7173 33.7571 12.3423C34.0298 11.9673 34.3991 11.6761 34.8651 11.4688C35.331 11.2585 35.8565 11.1534 36.4418 11.1534C37.0327 11.1534 37.554 11.2571 38.0057 11.4645C38.4602 11.6719 38.8182 11.9574 39.0795 12.321C39.3409 12.6818 39.4773 13.0966 39.4886 13.5653H38.2188ZM41.0792 20V13.4545H42.3533V20H41.0792ZM41.7227 12.4446C41.5011 12.4446 41.3107 12.3707 41.1516 12.223C40.9954 12.0724 40.9173 11.8935 40.9173 11.6861C40.9173 11.4759 40.9954 11.2969 41.1516 11.1491C41.3107 10.9986 41.5011 10.9233 41.7227 10.9233C41.9442 10.9233 42.1332 10.9986 42.2894 11.1491C42.4485 11.2969 42.5281 11.4759 42.5281 11.6861C42.5281 11.8935 42.4485 12.0724 42.2894 12.223C42.1332 12.3707 41.9442 12.4446 41.7227 12.4446ZM46.8118 22.5909C46.2919 22.5909 45.8445 22.5227 45.4695 22.3864C45.0973 22.25 44.7933 22.0696 44.5575 21.8452C44.3217 21.6207 44.1456 21.375 44.0291 21.108L45.1243 20.6562C45.201 20.7812 45.3033 20.9134 45.4311 21.0526C45.5618 21.1946 45.7379 21.3153 45.9595 21.4148C46.1839 21.5142 46.4723 21.5639 46.8246 21.5639C47.3075 21.5639 47.7067 21.446 48.022 21.2102C48.3374 20.9773 48.495 20.6051 48.495 20.0938V18.8068H48.4141C48.3374 18.946 48.2266 19.1009 48.0817 19.2713C47.9396 19.4418 47.7436 19.5895 47.4936 19.7145C47.2436 19.8395 46.9183 19.902 46.5178 19.902C46.0007 19.902 45.5348 19.7812 45.12 19.5398C44.7081 19.2955 44.3814 18.9361 44.1399 18.4616C43.9013 17.9844 43.782 17.3977 43.782 16.7017C43.782 16.0057 43.8999 15.4091 44.1357 14.9119C44.3743 14.4148 44.701 14.0341 45.1158 13.7699C45.5305 13.5028 46.0007 13.3693 46.5263 13.3693C46.9325 13.3693 47.2607 13.4375 47.5107 13.5739C47.7607 13.7074 47.9553 13.8636 48.0945 14.0426C48.2365 14.2216 48.3459 14.3793 48.4226 14.5156H48.5163V13.4545H49.7649V20.1449C49.7649 20.7074 49.6342 21.169 49.3729 21.5298C49.1115 21.8906 48.7578 22.1577 48.3118 22.331C47.8686 22.5043 47.3686 22.5909 46.8118 22.5909ZM46.799 18.8452C47.1655 18.8452 47.4751 18.7599 47.728 18.5895C47.9837 18.4162 48.1768 18.169 48.3075 17.848C48.4411 17.5241 48.5078 17.1364 48.5078 16.6847C48.5078 16.2443 48.4425 15.8565 48.3118 15.5213C48.1811 15.1861 47.9893 14.9247 47.7365 14.7372C47.4837 14.5469 47.1712 14.4517 46.799 14.4517C46.4155 14.4517 46.0959 14.5511 45.8402 14.75C45.5845 14.946 45.3913 15.2131 45.2607 15.5511C45.1328 15.8892 45.0689 16.267 45.0689 16.6847C45.0689 17.1136 45.1342 17.4901 45.2649 17.8139C45.3956 18.1378 45.5888 18.3906 45.8445 18.5724C46.103 18.7543 46.4212 18.8452 46.799 18.8452ZM55.62 17.2855V13.4545H56.8984V20H55.6456V18.8665H55.5774C55.4268 19.2159 55.1854 19.5071 54.853 19.7401C54.5234 19.9702 54.1129 20.0852 53.6214 20.0852C53.201 20.0852 52.8288 19.9929 52.505 19.8082C52.1839 19.6207 51.9311 19.3438 51.7464 18.9773C51.5646 18.6108 51.4737 18.1577 51.4737 17.6179V13.4545H52.7479V17.4645C52.7479 17.9105 52.8714 18.2656 53.1186 18.5298C53.3658 18.794 53.6868 18.9261 54.0817 18.9261C54.3203 18.9261 54.5575 18.8665 54.7933 18.7472C55.032 18.6278 55.2294 18.4474 55.3857 18.206C55.5447 17.9645 55.6229 17.6577 55.62 17.2855ZM58.6104 20V13.4545H59.8846V20H58.6104ZM59.2539 12.4446C59.0323 12.4446 58.842 12.3707 58.6829 12.223C58.5266 12.0724 58.4485 11.8935 58.4485 11.6861C58.4485 11.4759 58.5266 11.2969 58.6829 11.1491C58.842 10.9986 59.0323 10.9233 59.2539 10.9233C59.4755 10.9233 59.6644 10.9986 59.8207 11.1491C59.9798 11.2969 60.0593 11.4759 60.0593 11.6861C60.0593 11.8935 59.9798 12.0724 59.8207 12.223C59.6644 12.3707 59.4755 12.4446 59.2539 12.4446ZM64.4197 20.1321C63.7749 20.1321 63.2195 19.9943 62.7536 19.7188C62.2905 19.4403 61.9325 19.0497 61.6797 18.5469C61.4297 18.0412 61.3047 17.4489 61.3047 16.7699C61.3047 16.0994 61.4297 15.5085 61.6797 14.9972C61.9325 14.4858 62.2848 14.0866 62.7365 13.7997C63.1911 13.5128 63.7223 13.3693 64.3303 13.3693C64.6996 13.3693 65.0575 13.4304 65.4041 13.5526C65.7507 13.6747 66.0618 13.8665 66.3374 14.1278C66.6129 14.3892 66.8303 14.7287 66.9893 15.1463C67.1484 15.5611 67.228 16.0653 67.228 16.6591V17.1108H62.0249V16.1562H65.9794C65.9794 15.821 65.9112 15.5241 65.7749 15.2656C65.6385 15.0043 65.4467 14.7983 65.1996 14.6477C64.9553 14.4972 64.6683 14.4219 64.3388 14.4219C63.9808 14.4219 63.6683 14.5099 63.4013 14.6861C63.1371 14.8594 62.9325 15.0866 62.7876 15.3679C62.6456 15.6463 62.5746 15.9489 62.5746 16.2756V17.0213C62.5746 17.4588 62.6513 17.831 62.8047 18.1378C62.9609 18.4446 63.1783 18.679 63.4567 18.8409C63.7351 19 64.0604 19.0795 64.4325 19.0795C64.674 19.0795 64.8942 19.0455 65.093 18.9773C65.2919 18.9062 65.4638 18.8011 65.6087 18.6619C65.7536 18.5227 65.8643 18.3509 65.9411 18.1463L67.147 18.3636C67.0504 18.7187 66.8771 19.0298 66.6271 19.2969C66.38 19.5611 66.0689 19.767 65.6939 19.9148C65.3217 20.0597 64.897 20.1321 64.4197 20.1321ZM69.9158 16.1136V20H68.6417V13.4545H69.8647V14.5199H69.9457C70.0962 14.1733 70.332 13.8949 70.6531 13.6847C70.9769 13.4744 71.3846 13.3693 71.8761 13.3693C72.3221 13.3693 72.7127 13.4631 73.0479 13.6506C73.3832 13.8352 73.6431 14.1108 73.8278 14.4773C74.0124 14.8437 74.1048 15.2969 74.1048 15.8366V20H72.8306V15.9901C72.8306 15.5156 72.707 15.1449 72.4599 14.8778C72.2127 14.608 71.8732 14.473 71.4414 14.473C71.146 14.473 70.8832 14.5369 70.6531 14.6648C70.4258 14.7926 70.2454 14.9801 70.1119 15.2273C69.9812 15.4716 69.9158 15.767 69.9158 16.1136ZM78.869 13.4545V14.4773H75.2937V13.4545H78.869ZM76.2525 11.8864H77.5266V18.0781C77.5266 18.3253 77.5636 18.5114 77.6374 18.6364C77.7113 18.7585 77.8065 18.8423 77.9229 18.8878C78.0423 18.9304 78.1715 18.9517 78.3107 18.9517C78.413 18.9517 78.5025 18.9446 78.5792 18.9304C78.6559 18.9162 78.7156 18.9048 78.7582 18.8963L78.9883 19.9489C78.9144 19.9773 78.8093 20.0057 78.6729 20.0341C78.5366 20.0653 78.3661 20.0824 78.1616 20.0852C77.8263 20.0909 77.5138 20.0312 77.2241 19.9062C76.9343 19.7812 76.6999 19.5881 76.521 19.3267C76.342 19.0653 76.2525 18.7372 76.2525 18.3423V11.8864ZM83.0291 20.1321C82.3842 20.1321 81.8288 19.9943 81.3629 19.7188C80.8999 19.4403 80.5419 19.0497 80.2891 18.5469C80.0391 18.0412 79.9141 17.4489 79.9141 16.7699C79.9141 16.0994 80.0391 15.5085 80.2891 14.9972C80.5419 14.4858 80.8942 14.0866 81.3459 13.7997C81.8004 13.5128 82.3317 13.3693 82.9396 13.3693C83.3089 13.3693 83.6669 13.4304 84.0135 13.5526C84.3601 13.6747 84.6712 13.8665 84.9467 14.1278C85.2223 14.3892 85.4396 14.7287 85.5987 15.1463C85.7578 15.5611 85.8374 16.0653 85.8374 16.6591V17.1108H80.6342V16.1562H84.5888C84.5888 15.821 84.5206 15.5241 84.3842 15.2656C84.2479 15.0043 84.0561 14.7983 83.8089 14.6477C83.5646 14.4972 83.2777 14.4219 82.9482 14.4219C82.5902 14.4219 82.2777 14.5099 82.0107 14.6861C81.7464 14.8594 81.5419 15.0866 81.397 15.3679C81.255 15.6463 81.1839 15.9489 81.1839 16.2756V17.0213C81.1839 17.4588 81.2607 17.831 81.4141 18.1378C81.5703 18.4446 81.7876 18.679 82.0661 18.8409C82.3445 19 82.6697 19.0795 83.0419 19.0795C83.2834 19.0795 83.5036 19.0455 83.7024 18.9773C83.9013 18.9062 84.0732 18.8011 84.218 18.6619C84.3629 18.5227 84.4737 18.3509 84.5504 18.1463L85.7564 18.3636C85.6598 18.7187 85.4865 19.0298 85.2365 19.2969C84.9893 19.5611 84.6783 19.767 84.3033 19.9148C83.9311 20.0597 83.5064 20.1321 83.0291 20.1321Z" fill="white" />
                      <path d="M125.24 11.8496C127.42 11.8496 129.15 13.5045 129.15 15.5C129.15 17.4955 127.42 19.1504 125.24 19.1504C123.06 19.1502 121.331 17.4953 121.331 15.5C121.331 13.5047 123.06 11.8498 125.24 11.8496Z" stroke="white" strokeWidth="0.7" />
                      <mask id="path-4-inside-1_1038_350" fill="white">
                        <path d="M125.241 11.5L125.46 11.5049C127.71 11.612 129.5 13.3599 129.5 15.5C129.5 17.6401 127.71 19.388 125.46 19.4951L125.241 19.5H110.759C108.407 19.4998 106.5 17.709 106.5 15.5C106.5 13.291 108.407 11.5002 110.759 11.5H125.241Z" />
                      </mask>
                      <path d="M125.241 11.5L125.46 11.5049C127.71 11.612 129.5 13.3599 129.5 15.5C129.5 17.6401 127.71 19.388 125.46 19.4951L125.241 19.5H110.759C108.407 19.4998 106.5 17.709 106.5 15.5C106.5 13.291 108.407 11.5002 110.759 11.5H125.241Z" fill="white" fillOpacity="0.01" />
                      <path d="M125.241 11.5L125.257 10.8002L125.249 10.8H125.241V11.5ZM125.46 11.5049L125.493 10.8057L125.484 10.8053L125.476 10.8051L125.46 11.5049ZM125.46 19.4951L125.476 20.1949L125.484 20.1947L125.493 20.1943L125.46 19.4951ZM125.241 19.5V20.2H125.249L125.257 20.1998L125.241 19.5ZM110.759 19.5L110.759 20.2H110.759V19.5ZM110.759 11.5V10.8H110.759L110.759 11.5ZM125.241 11.5L125.226 12.1998L125.444 12.2047L125.46 11.5049L125.476 10.8051L125.257 10.8002L125.241 11.5ZM125.46 11.5049L125.427 12.2041C127.345 12.2954 128.8 13.7732 128.8 15.5H129.5H130.2C130.2 12.9466 128.076 10.9286 125.493 10.8057L125.46 11.5049ZM129.5 15.5H128.8C128.8 17.2268 127.345 18.7046 125.427 18.7959L125.46 19.4951L125.493 20.1943C128.076 20.0714 130.2 18.0534 130.2 15.5H129.5ZM125.46 19.4951L125.444 18.7953L125.226 18.8002L125.241 19.5L125.257 20.1998L125.476 20.1949L125.46 19.4951ZM125.241 19.5V18.8H110.759V19.5V20.2H125.241V19.5ZM110.759 19.5L110.759 18.8C108.751 18.7998 107.2 17.2817 107.2 15.5H106.5H105.8C105.8 18.1363 108.062 20.1997 110.759 20.2L110.759 19.5ZM106.5 15.5H107.2C107.2 13.7183 108.751 12.2002 110.759 12.2L110.759 11.5L110.759 10.8C108.062 10.8003 105.8 12.8637 105.8 15.5H106.5ZM110.759 11.5V12.2H125.241V11.5V10.8H110.759V11.5Z" fill="white" mask="url(#path-4-inside-1_1038_350)" />
                      <path d="M128.044 15.7475C128.18 15.6108 128.18 15.3892 128.044 15.2525L125.816 13.0251C125.68 12.8884 125.458 12.8884 125.321 13.0251C125.185 13.1618 125.185 13.3834 125.321 13.5201L127.301 15.5L125.321 17.4799C125.185 17.6166 125.185 17.8382 125.321 17.9749C125.458 18.1116 125.68 18.1116 125.816 17.9749L128.044 15.7475ZM122.685 15.5V15.85H127.796V15.5V15.15H122.685V15.5Z" fill="white" />
                    </svg>
                  </button>
                </div>

                {/* Botón visible en mobile/tablet, donde no hay panel de imagen
                    para alojar el botón de escritorio de arriba. */}
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden">
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            </div>

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
          <div className="flex w-full flex-col overflow-y-auto bg-[#fafafa] px-6 py-10 sm:px-10 lg:w-[68.5%] lg:px-14 lg:py-14">
            {/* Grilla centrada en Y respecto al panel completo (pedido
                2026-08-18) — mismo truco que el "sandwiche" del paso 1:
                flex-1 + justify-center en vez de padding fijo, así el
                centro de las tarjetas queda alineado con el botón
                "Siguiente" (que sí está centrado en top-1/2) sea cual sea
                el alto de pantalla. */}
            <div className="flex flex-1 flex-col justify-center">
              {/* Tarjetas al 80% de su tamaño (pedido 2026-08-18) — `zoom` en
                  vez de `transform: scale()` porque zoom sí reduce el tamaño
                  real de la caja (el grid recalcula el layout), mientras que
                  scale solo lo dibuja más chico y deja el hueco del tamaño
                  original. */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" style={{ zoom: 0.8 }}>
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
                onClick={() => { setConfigStep(0); goToStep('configurar') }}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden"
              >
                Continuar con &quot;{templateElegido.nombre}&quot; <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <RoadmapPanel activeIndex={1} color="#B9C96F" onNext={() => { setConfigStep(0); goToStep('configurar') }} onStepClick={handleStepClick} compactButton triangleOpacity={0.5} />
          <SideStrip color="#B9C96F" />
        </div>
      )}

      {/* ── PASO 2.5: Configurá tu tienda — partido en 2 sub-pantallas
          (pedido 2026-08-18, mismo punto del roadmap para las dos):
          0. Contacto y Redes — formulario real (ya no disabled/preview),
             mismos campos/labels/placeholders que la pantalla de Contacto y
             Redes del Panel Admin. Se manda en el POST a /api/create-tenant
             y ahí se inserta en store_config, así que cuando el dueño entra
             por primera vez a su panel ya lo encuentra cargado.
          1. Recomendaciones — informativa, igual que antes (Cobranzas,
             Envíos, Catálogo, Apariencia + Para Escalar). ── */}
      {step === 'configurar' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          <div className="flex w-full flex-col overflow-y-auto bg-[#f2f2f2] px-6 py-10 sm:px-10 lg:w-[68.5%] lg:px-14 lg:py-14">
            {/* Centrado en Y respecto al panel completo (mismo truco que el
                paso 1 y el paso 2: flex-1 + justify-center) — pedido
                2026-08-18: el formulario quedaba muy arriba, tiene que
                quedar centrado respecto al botón "Siguiente". */}
            <div className="flex flex-1 flex-col justify-center">
            {configStep === 0 ? (
              // Centrado respecto al lienzo gris completo y con ancho fluido
              // (mx-auto + max-w, no un ancho fijo pegado a la izquierda) —
              // pedido 2026-08-18: "pensá que es para ancho total del lienzo,
              // para que escale y se adapte a distintos dispositivos". La
              // tarjeta interna pasa de max-w-xl a w-full para ocupar todo
              // este contenedor ya centrado, en vez de quedar angosta. El
              // fondo de la tarjeta pasa de blanco al mismo gris del lienzo
              // (#f2f2f2) — pedido 2026-08-18 — los inputs individuales
              // siguen en blanco para que se sigan distinguiendo como
              // campos editables.
              <div className="mx-auto w-full max-w-3xl space-y-8 text-black">
                <h1 className="text-2xl font-bold">Te invitamos a completar algunos datos de tu tienda.</h1>

                <section>
                  <h2 className="text-2xl font-bold">Contacto y Redes</h2>
                  <div className="mt-4 w-full space-y-4 rounded-xl border border-zinc-200 bg-[#f2f2f2] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-zinc-700">Contacto y redes sociales</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">WhatsApp</label>
                        <input
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          placeholder="5491112345678 (sin + ni espacios)"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-zinc-400">También es el número al que llegan los avisos de WhatsApp — configurables en Notificaciones.</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">Instagram</label>
                        <input
                          value={instagram}
                          onChange={e => setInstagram(e.target.value)}
                          placeholder="https://instagram.com/tutienda"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">Facebook</label>
                        <input
                          value={facebook}
                          onChange={e => setFacebook(e.target.value)}
                          placeholder="https://facebook.com/tutienda"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">TikTok</label>
                        <input
                          value={tiktok}
                          onChange={e => setTiktok(e.target.value)}
                          placeholder="https://tiktok.com/@tutienda"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">Dirección</label>
                        <input
                          value={direccion}
                          onChange={e => setDireccion(e.target.value)}
                          placeholder="Av. Corrientes 1234, CABA"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-zinc-400">Aparece en el pie de tu tienda (home, catálogo, contacto y páginas legales).</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-zinc-600">Dirección de despacho (aparece en PDFs)</label>
                        <input
                          value={direccionDespacho}
                          onChange={e => setDireccionDespacho(e.target.value)}
                          placeholder="Av. Corrientes 1234, CABA"
                          className="w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              // Centrado en X respecto al lienzo, igual que la pantalla 1
              // (pedido 2026-08-18) — antes quedaba pegado a la izquierda.
              <div className="mx-auto w-full max-w-3xl space-y-8 text-black">
                <button
                  type="button"
                  onClick={() => setConfigStep(0)}
                  className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  ← Volver
                </button>

                <h1 className="text-2xl font-bold">Te recomendamos algunas configuraciones importantes que no pueden faltar en tu tienda.</h1>

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

                <section>
                  <h2 className="text-2xl font-bold">Para Escalar</h2>
                  <p className="mt-3 leading-relaxed">
                    Para campañas publicitarias en Meta, Google Ads o TikTok, podés instalar los píxeles de seguimiento ingresando el Meta Pixel ID, Google Ads ID o TikTok Pixel ID. También podés vincular Google Analytics ingresando tu Measurement ID.
                  </p>
                </section>
              </div>
            )}
            </div>

            {/* Botón visible en mobile/tablet, donde no hay panel derecho
                para alojar el botón circular de "Siguiente". */}
            <button
              type="button"
              onClick={() => (configStep === 0 ? setConfigStep(1) : goToStep('productos'))}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 lg:hidden"
            >
              Continuar <ArrowRight size={16} />
            </button>
          </div>

          <RoadmapPanel
            activeIndex={2}
            color="#3B9DA2"
            onNext={() => (configStep === 0 ? setConfigStep(1) : goToStep('productos'))}
            onStepClick={handleStepClick}
            compactButton
            triangleOpacity={0.5}
          />
          <SideStrip color="#3B9DA2" />
        </div>
      )}

      {/* ── PASO 3.5: Cargá tus productos (diseño Figma "Registracion 4") —
          pantalla informativa (imagen ilustrativa de la tienda en
          tablet/celular), todavía sin carga real de productos — esa carga
          en sí se hace después, desde el Panel Admin. ── */}
      {step === 'productos' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-[#f2f2f2]">
          <div className="relative w-full lg:w-[68.5%]">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagen ilustrativa exportada de Figma, no dato dinámico */}
            <img
              src="/img/onboarding/onboarding-04-productos.jpg"
              alt="Vista previa de tu tienda en tablet y celular"
              className="h-full w-full object-cover object-center"
            />
            {/* Botón visible en mobile/tablet, donde no hay panel derecho
                para alojar el botón circular de "Siguiente". */}
            <button
              type="button"
              onClick={() => goToStep('escalar')}
              className="absolute inset-x-6 bottom-6 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:inset-x-10 lg:hidden"
            >
              Continuar <ArrowRight size={16} />
            </button>
          </div>

          <RoadmapPanel activeIndex={3} color="#C9B67C" onNext={() => goToStep('escalar')} onStepClick={handleStepClick} />
          <SideStrip color="#C9B67C" />
        </div>
      )}

      {/* ── PASO 4.5: Escalá con tus Ventas (diseño Figma "Registracion 5") —
          mismo patrón visual que el Paso 1 (foto + leyenda superpuesta +
          franja lateral), pero sin RoadmapPanel: acá la leyenda del último
          ítem del roadmap ("Escalá con tus Ventas") pasa a ser el título
          grande de la pantalla, como cierre del recorrido. Dos CTAs: la roja
          crea la tienda directo con el plan por defecto (prueba gratis, sin
          elegir plan); la negra manda al selector de planes de siempre. */}
      {step === 'escalar' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          <div className="relative flex w-full flex-col px-6 py-12 sm:px-16 sm:py-16 lg:w-1/2 lg:px-24">
            {/* Título visible solo en mobile/tablet (en desktop va superpuesto
                a la foto, como en el Figma) — el diseño de Figma es solo
                desktop, esto es para no dejar la pantalla sin contexto en
                pantallas chicas. */}
            <h1 className="text-3xl font-extrabold leading-tight text-zinc-900 lg:hidden">Escalá con tus Ventas</h1>
            <p className="mt-1 text-base font-medium text-zinc-500 lg:hidden">B2B Mayoristas y B2C Minoristas</p>

            <div className="mt-10 w-full space-y-4 lg:absolute lg:left-24 lg:right-24 lg:top-1/2 lg:mt-0 lg:w-auto lg:-translate-y-1/2">
              {isPlaceholderPaid ? (
                // Ya eligió y pagó un plan desde la landing (/api/ir-a-plan)
                // antes de llegar acá — no tiene sentido ofrecerle de nuevo
                // prueba gratis ni elegir plan, solo falta completar la
                // tienda con lo que ya cargó en los pasos anteriores.
                <button
                  type="button"
                  onClick={handleFinalizarTienda}
                  disabled={finalizando}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fe4648] py-4 text-sm font-medium text-white transition-colors hover:brightness-95 disabled:opacity-60"
                >
                  {finalizando && <Loader2 size={15} className="animate-spin" />}
                  {finalizando ? 'Creando tu tienda...' : 'Finalizar mi tienda'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fe4648] py-4 text-sm font-medium text-white transition-colors hover:brightness-95 disabled:opacity-60"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {saving ? 'Creando tu tienda...' : `Crear mi tienda - Probar Gratis ${TRIAL_DAYS} días`}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep('plan')}
                    className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 py-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
                  >
                    Crear mi tienda
                  </button>
                </>
              )}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
            </div>

            {/* Logo fijo abajo a la izquierda, igual que en el paso 1. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/onboarding/g-logo-slogan.svg" alt="gounuri.com" className="absolute bottom-10 left-6 hidden h-36 w-auto sm:left-16 sm:block lg:left-24" />
          </div>

          {/* Panel de foto — misma pareja foto+franja que el paso 1, ancho
              41.1% (709 de 1728), sin overlay ni filtro sobre la imagen. */}
          <div className="relative hidden lg:block lg:w-[41.1%]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('/img/onboarding/onboarding-05-escalar.jpg')` }}
            />
            <div className="absolute inset-0 flex items-center justify-center px-6 text-white">
              <div className="text-left">
                <h2 className="text-[4.3rem] font-extrabold leading-[1.05]">
                  Escalá con
                  <br />
                  tus Ventas
                </h2>
                <p className="mt-2 text-xl font-semibold">B2B Mayoristas y B2C Minoristas</p>
              </div>
            </div>
          </div>

          <SideStrip color="#FE4648" />
        </div>
      )}

      {/* ── PASO 6: Plan (diseño Figma "Planes para cada etapa", node
          1015:133 — el usuario confirmó que es una repetición del bloque de
          precios que ya existe en la landing, así que se reusa Pricing.tsx
          tal cual en vez de reconstruirlo: mode="select" cambia únicamente
          el CTA de cada tarjeta, de un <a> a /api/ir-a-plan a un
          onSelect(planId, term) que crea la tienda con ese plan/plazo y
          sigue al paso "Pago" sin salir de /onboarding. ── */}
      {step === 'plan' && (
        <div className="mx-auto max-w-6xl px-6 py-12">
          <button
            type="button"
            onClick={() => goToStep('escalar')}
            className="mb-6 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            ← Volver
          </button>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {saving && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600">
              <Loader2 size={15} className="animate-spin" /> Creando tu tienda...
            </div>
          )}

          <Pricing mode="select" onSelect={handleSelectPlan} />
        </div>
      )}

      {/* ── PASO 7: Pago (diseño Figma "Pago con Tarjeta", node 1002:61) —
          el diseño de Figma muestra campos de tarjeta (número, vencimiento,
          CVC), pero el backend real de gounuri.com sólo tiene implementado
          el cobro vía Mercado Pago Preapproval (mismo flujo que
          /perfil/plan): se ingresa el email de la cuenta de Mercado Pago y
          se redirige al checkout hospedado por MP. Se decidió con el
          usuario (elección explícita: "Conectar con Mercado Pago real")
          construir este paso conectado al pago real en vez de armar un
          formulario de tarjeta visual que no procesaría nada de verdad. Los
          cálculos (subtotal, descuento por plazo, total) usan
          priceForTerm() de @/lib/plans, la misma fuente que ya usan
          Pricing.tsx y PlanSelector.tsx. */}
      {step === 'pago' && (
        <div className="relative flex min-h-[calc(100vh-72px)] overflow-hidden bg-white">
          {/* Panel izquierdo — formulario de pago. Métodos configurables desde
              superadmin (2026-08-22, ver @/lib/platformBilling): si Mercado
              Pago está apagado se ofrece transferencia en su lugar (mismo
              componente que /perfil/plan/PlanSelector.tsx), y si los dos
              están prendidos se muestran ambos. paymentSettings es null
              mientras carga — no se pinta ningún método todavía para no
              mostrar de entrada un formulario de MP que capaz ni corresponde. */}
          <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-16 sm:py-16 lg:w-[45.5%] lg:px-24">
            <h1 className="text-3xl font-extrabold leading-tight text-zinc-900">
              {paymentSettings?.mercadopagoEnabled ? 'Pagar con Mercado Pago' : 'Activá tu plan'}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              {paymentSettings?.mercadopagoEnabled
                ? 'gounuri.com no ve ni almacena los datos de tu tarjeta. Ingresá el email de tu cuenta de Mercado Pago y te vamos a redirigir a su checkout seguro para completar el pago.'
                : 'Coordinamos el pago por transferencia bancaria — por WhatsApp o por mail.'}
            </p>

            <div className="mt-8 space-y-5">
              {paymentSettings?.mercadopagoEnabled && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                    Email de tu cuenta de Mercado Pago <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-2xl border-none bg-[#f0f0f1] px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    value={payerEmail}
                    onChange={e => setPayerEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoFocus
                    required
                  />
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep('plan')}
                  className={`rounded-2xl border border-zinc-300 px-6 py-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 ${paymentSettings?.mercadopagoEnabled ? '' : 'flex-1'}`}
                >
                  ← Volver
                </button>
                {paymentSettings?.mercadopagoEnabled && (
                  <button
                    type="button"
                    onClick={handlePagar}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-60"
                    style={{ background: '#454b53' }}
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {saving ? 'Redirigiendo a Mercado Pago...' : 'Pagar'}
                  </button>
                )}
              </div>

              {paymentSettings && paymentSettings.manualTransferEnabled && (
                <div>
                  {paymentSettings.mercadopagoEnabled && (
                    <div className="my-2 flex items-center gap-3">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="text-xs text-zinc-400">o por transferencia</span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                  )}
                  <TransferPaymentBlock
                    paymentSettings={paymentSettings}
                    planId={plan}
                    planNombre={planElegido.nombre}
                    term={billingTerm}
                    monto={pagoTotal}
                    accion="activar mi tienda nueva"
                  />
                </div>
              )}

              {paymentSettings && !paymentSettings.mercadopagoEnabled && !paymentSettings.manualTransferEnabled && (
                <p className="text-sm text-zinc-500">
                  Todavía no tenemos un método de pago habilitado — escribinos a{' '}
                  <a href={`mailto:${paymentSettings.contactEmail}`} className="font-medium text-zinc-900 underline">
                    {paymentSettings.contactEmail}
                  </a>{' '}
                  y lo coordinamos.
                </p>
              )}
            </div>
          </div>

          {/* Panel derecho — resumen "Activar Plan" */}
          <div className="hidden w-full flex-col justify-center bg-[#f2f2f2] px-14 py-16 lg:flex lg:w-[45.6%]">
            <div className="flex items-center gap-2 text-zinc-500">
              <Wallet size={18} />
              <span className="text-sm font-medium">Activar Plan</span>
            </div>

            <p className="mt-4 text-4xl font-extrabold text-zinc-900">{formatPrecio(pagoTotal)}</p>
            <p className="mt-1 text-sm text-zinc-600">
              Plan {planElegido.nombre} / suscripción {pagoTermLabel}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Periodo : {fmtFecha(pagoInicio)} - {fmtFecha(pagoFin)}
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center justify-between text-zinc-600">
                <span>
                  {formatPrecio(planElegido.precioARS)} x {billingTerm} {billingTerm === 1 ? 'mes' : 'meses'}
                </span>
                <span>{formatPrecio(pagoSinDescuento)}</span>
              </div>
              {pagoDescuentoMonto > 0 && (
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Descuento pago {pagoTermLabel} {pagoDescuentoPct}%</span>
                  <span>-{formatPrecio(pagoDescuentoMonto)}</span>
                </div>
              )}
              <hr className="border-zinc-300" />
              <div className="flex items-center justify-between font-medium text-zinc-900">
                <span>SubTotal</span>
                <span>{formatPrecio(pagoTotal)}</span>
              </div>
              <hr className="border-zinc-300" />
              <div className="flex items-center justify-between text-base font-bold text-zinc-900">
                <span>Total a pagar</span>
                <span>{formatPrecio(pagoTotal)}</span>
              </div>
            </div>
          </div>

          <SideStrip color="#C4C4C4" />
        </div>
      )}
    </main>
  )
}
