'use client'

// Popup "empezamos a configurar tu tienda?" — aparece en /perfil mientras
// el tenant no tenga CBU/alias cargado (ver /perfil/cobros) y no lo hayan
// cerrado antes. Se puede cerrar sin completar nada; el dismiss se guarda en
// tenants.cbu_popup_dismissed_at así no vuelve a aparecer (server-side, no
// localStorage — para que no reaparezca si entran desde otro dispositivo).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SetupPopup({ show, tenantId }: { show: boolean; tenantId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [visible, setVisible] = useState(show)
  const [dismissing, setDismissing] = useState(false)

  if (!visible) return null

  async function handleDismiss() {
    setDismissing(true)
    await supabase.from('tenants').update({ cbu_popup_dismissed_at: new Date().toISOString() }).eq('id', tenantId)
    setVisible(false)
  }

  function handleConfigurar() {
    router.push('/perfil/cobros')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
            <Wallet size={18} className="text-white" />
          </div>
          <button onClick={handleDismiss} disabled={dismissing} className="text-zinc-400 hover:text-zinc-700" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">¿Empezamos a configurar tu tienda?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Cargá el CBU o alias donde vas a recibir la plata de tus clientes cuando paguen por transferencia.
          Podés hacerlo ahora o más tarde desde Mi cuenta.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={dismissing}
            className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Más tarde
          </button>
          <button
            onClick={handleConfigurar}
            className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Configurar ahora
          </button>
        </div>
      </div>
    </div>
  )
}
