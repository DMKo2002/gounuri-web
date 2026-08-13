'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Initial {
  transferEnabled: boolean
  cbu: string
  alias: string
}

const inputClass = 'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none'
const labelClass = 'block text-xs font-medium text-zinc-600 mb-1'

export default function CobrosForm({ configId, initial }: { configId: string; initial: Initial }) {
  const supabase = createClient()

  const [transferEnabled, setTransferEnabled] = useState(initial.transferEnabled)
  const [cbu, setCbu] = useState(initial.cbu)
  const [alias, setAlias] = useState(initial.alias)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const { error: updateError } = await supabase
      .from('store_config')
      .update({
        transfer_enabled: transferEnabled,
        transfer_cbu: cbu.trim() || null,
        transfer_alias: alias.trim() || null,
      })
      .eq('id', configId)
    setSaving(false)
    if (updateError) {
      setError(updateError.message || 'No se pudo guardar. Reintentá o escribinos.')
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <button
        type="button"
        onClick={() => setTransferEnabled(v => !v)}
        className="flex w-full items-center justify-between py-1"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-zinc-900">Habilitar transferencia bancaria</p>
          <p className="text-xs text-zinc-400">Tus clientes van a poder elegir pagar así en el checkout.</p>
        </div>
        <span
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${transferEnabled ? 'bg-zinc-900' : 'bg-zinc-200'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${transferEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </span>
      </button>

      {transferEnabled && (
        <div className="grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>CBU</label>
            <input className={inputClass} value={cbu} onChange={e => setCbu(e.target.value)} placeholder="0000000000000000000000" />
          </div>
          <div>
            <label className={labelClass}>Alias</label>
            <input className={inputClass} value={alias} onChange={e => setAlias(e.target.value)} placeholder="mi.alias.mp" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-black disabled:opacity-60">
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
