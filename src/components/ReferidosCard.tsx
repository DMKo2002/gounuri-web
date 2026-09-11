'use client'

// Tarjeta de "Invitar y ganar" para gounuri.com/perfil (2026-09, programa
// de referidos) — pedido de David: "lo primero que se vea" en Mi Cuenta.
// Espejo del mismo componente en Panel Admin (components/ReferidosCard.tsx)
// pero con la estética negro/blanco propia de gounuri.com/perfil (esta
// pantalla no usa los tokens primary-* del Panel Admin).

import { useEffect, useState } from 'react'
import { Gift, Copy, Check, MessageCircle, Loader2 } from 'lucide-react'

interface MiCodigoResponse {
  code: string
  link: string
  mesesGratisDisponibles: number
  waShareUrl: string
}

export default function ReferidosCard() {
  const [data, setData] = useState<MiCodigoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [usando, setUsando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    fetch('/api/referidos/mi-codigo')
      .then(res => res.json())
      .then(json => { if (!cancelado && !json.error) setData(json) })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
  }, [])

  async function copiar(texto: string, cual: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopied(cual)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard puede fallar en contextos raros — no rompe nada más
    }
  }

  async function usarMesGratis() {
    setUsando(true)
    setMensaje(null)
    setError(null)
    try {
      const res = await fetch('/api/referidos/usar-mes-gratis', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'No se pudo canjear el mes gratis.')
      } else {
        setMensaje('¡Listo! Sumamos un mes más a tu suscripción.')
        setData(prev => prev ? { ...prev, mesesGratisDisponibles: Math.max(0, prev.mesesGratisDisponibles - 1) } : prev)
      }
    } catch {
      setError('No se pudo canjear el mes gratis. Probá de nuevo.')
    } finally {
      setUsando(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-400">
        <Loader2 size={16} className="animate-spin" /> Cargando tu link de invitación…
      </div>
    )
  }

  if (!data) return null

  const tieneSaldo = data.mesesGratisDisponibles > 0

  return (
    <div className={`mb-6 rounded-xl border p-5 ${tieneSaldo ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          <Gift size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          {tieneSaldo ? (
            <>
              <p className="text-sm font-semibold text-zinc-900">
                Tenés {data.mesesGratisDisponibles} {data.mesesGratisDisponibles === 1 ? 'mes gratis' : 'meses gratis'} disponibles
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">Por invitar a alguien a Gounuri. Usalo cuando quieras.</p>
              <button
                onClick={usarMesGratis}
                disabled={usando}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
              >
                {usando ? <Loader2 size={14} className="animate-spin" /> : null}
                Usar un mes ahora
              </button>
              {mensaje && <p className="mt-2 text-xs text-emerald-600">{mensaje}</p>}
              {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-900">Invitá y ganá 2 meses gratis</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Compartí tu link — cuando quien se registre confirme su primer pago, sumás 2 meses gratis.
              </p>
            </>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2">
              <span className="truncate text-xs text-zinc-600">{data.link}</span>
              <button onClick={() => copiar(data.link, 'link')} className="shrink-0 text-zinc-400 hover:text-zinc-700" title="Copiar link">
                {copied === 'link' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => copiar(data.code, 'code')}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-700 hover:border-zinc-400"
              title="Copiar código"
            >
              {data.code} {copied === 'code' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            </button>
            <a
              href={data.waShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              <MessageCircle size={14} /> Compartir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
