'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function signOut() {
    setLoading(true)
    await createClient().auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 disabled:opacity-50"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
      Cerrar sesión
    </button>
  )
}

export function BajaButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function darDeBaja() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/baja', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'No se pudo procesar la baja')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <div>
        <button
          onClick={() => setConfirming(true)}
          className="text-sm text-red-600 underline underline-offset-2 hover:text-red-700"
        >
          Darme de baja de la suscripción
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">
        Se cancela el débito automático y tu tienda pasa al plan gratuito (150 MB).
        Si tu uso actual supera ese límite, vas a tener 15 días para ajustarlo. ¿Confirmás?
      </p>
      <div className="mt-3 flex gap-3">
        <button
          onClick={darDeBaja}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Sí, dar de baja
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:border-zinc-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
