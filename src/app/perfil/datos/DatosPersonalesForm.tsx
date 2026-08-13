'use client'

import { useState } from 'react'

interface Initial {
  nombre: string
  apellido: string
  dni: string
  cuit: string
  empresa: string
  celular: string
}

const inputClass = 'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none'
const labelClass = 'block text-xs font-medium text-zinc-600 mb-1'

export default function DatosPersonalesForm({ initial }: { initial: Initial }) {
  const [nombre, setNombre] = useState(initial.nombre)
  const [apellido, setApellido] = useState(initial.apellido)
  const [dni, setDni] = useState(initial.dni)
  const [cuit, setCuit] = useState(initial.cuit)
  const [empresa, setEmpresa] = useState(initial.empresa)
  const [celular, setCelular] = useState(initial.celular)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/perfil/datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, dni, cuit, empresa, celular }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'No se pudo guardar. Reintentá o escribinos.')
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Error de conexión. Reintentá.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Nombre</label>
          <input className={inputClass} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" />
        </div>
        <div>
          <label className={labelClass}>Apellido</label>
          <input className={inputClass} value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" />
        </div>
        <div>
          <label className={labelClass}>DNI</label>
          <input className={inputClass} value={dni} onChange={e => setDni(e.target.value)} placeholder="Sin puntos" />
        </div>
        <div>
          <label className={labelClass}>Celular</label>
          <input className={inputClass} value={celular} onChange={e => setCelular(e.target.value)} placeholder="11 1234 5678" />
        </div>
        <div>
          <label className={labelClass}>CUIT</label>
          <input className={inputClass} value={cuit} onChange={e => setCuit(e.target.value)} placeholder="20-12345678-9" />
        </div>
        <div>
          <label className={labelClass}>Nombre de la empresa</label>
          <input className={inputClass} value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Opcional, si facturás como empresa" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-black disabled:opacity-60">
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  )
}
