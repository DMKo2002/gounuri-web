'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Branch { name: string; address: string; phone?: string }

interface Initial {
  whatsapp: string
  email: string
  instagram: string
  facebook: string
  tiktok: string
  pickupAddress: string
  branches: Branch[]
}

const inputClass = 'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none'
const labelClass = 'block text-xs font-medium text-zinc-600 mb-1'

export default function DatosTiendaForm({ configId, initial }: { configId: string; initial: Initial }) {
  const supabase = createClient()

  const [whatsapp, setWhatsapp] = useState(initial.whatsapp)
  const [email, setEmail] = useState(initial.email)
  const [instagram, setInstagram] = useState(initial.instagram)
  const [facebook, setFacebook] = useState(initial.facebook)
  const [tiktok, setTiktok] = useState(initial.tiktok)
  const [pickupAddress, setPickupAddress] = useState(initial.pickupAddress)
  const [branches, setBranches] = useState<Branch[]>(initial.branches)

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
        whatsapp_number: whatsapp.trim() || null,
        notification_email: email.trim() || null,
        instagram_url: instagram.trim() || null,
        facebook_url: facebook.trim() || null,
        tiktok_url: tiktok.trim() || null,
        pickup_address: pickupAddress.trim() || null,
        branches,
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
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900">Contacto y redes sociales</h2>

        <div>
          <label className={labelClass}>WhatsApp</label>
          <input className={inputClass} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5491112345678 (sin + ni espacios)" />
          <p className="mt-1 text-xs text-zinc-400">También es el número donde llegan los avisos de pedidos nuevos.</p>
        </div>
        <div>
          <label className={labelClass}>Email de contacto</label>
          <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="hola@tutienda.com" />
        </div>
        <div>
          <label className={labelClass}>Instagram</label>
          <input className={inputClass} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/tutienda" />
        </div>
        <div>
          <label className={labelClass}>Facebook</label>
          <input className={inputClass} value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/tutienda" />
        </div>
        <div>
          <label className={labelClass}>TikTok</label>
          <input className={inputClass} value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/@tutienda" />
        </div>
        <div>
          <label className={labelClass}>Dirección</label>
          <input className={inputClass} value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} placeholder="Av. Corrientes 1234, CABA" />
          <p className="mt-1 text-xs text-zinc-400">Se muestra si no cargás sucursales abajo.</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Sucursales</h2>
            <p className="text-xs text-zinc-400">Aparecen listadas en el pie de tu tienda.</p>
          </div>
          <button
            type="button"
            onClick={() => setBranches(prev => [...prev, { name: '', address: '', phone: '' }])}
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-900 hover:text-zinc-600"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>

        {branches.length === 0 && <p className="text-xs text-zinc-400">No hay sucursales cargadas</p>}

        {branches.map((branch, i) => (
          <div key={i} className="grid grid-cols-1 gap-3 border-b border-zinc-100 pb-4 last:border-0 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Nombre</label>
              <input
                className={inputClass}
                value={branch.name}
                onChange={e => setBranches(prev => prev.map((b, idx) => idx === i ? { ...b, name: e.target.value } : b))}
                placeholder="Sucursal Centro"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Dirección</label>
              <input
                className={inputClass}
                value={branch.address}
                onChange={e => setBranches(prev => prev.map((b, idx) => idx === i ? { ...b, address: e.target.value } : b))}
                placeholder="Av. Corrientes 1234, CABA"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-zinc-500">Teléfono (opcional)</label>
                <input
                  className={inputClass}
                  value={branch.phone ?? ''}
                  onChange={e => setBranches(prev => prev.map((b, idx) => idx === i ? { ...b, phone: e.target.value } : b))}
                  placeholder="11 1234-5678"
                />
              </div>
              <button
                type="button"
                onClick={() => setBranches(prev => prev.filter((_, idx) => idx !== i))}
                className="mb-2 text-zinc-300 hover:text-red-500"
                aria-label="Quitar sucursal"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-black disabled:opacity-60">
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
