'use client'

// Demo interactiva split-screen: a la izquierda un mini Panel Admin simulado,
// a la derecha la tienda reaccionando en vivo. Todo fake y hardcodeado —
// la gracia es que se ENTIENDA qué hace cada feature, no replicar el panel.

import { useState } from 'react'
import { Settings, Palette, PackageX, Tag, ShoppingBag } from 'lucide-react'

const COLORES = [
  { id: 'negro', hex: '#18181b', nombre: 'Negro' },
  { id: 'bordo', hex: '#7f1d1d', nombre: 'Bordó' },
  { id: 'oliva', hex: '#3f6212', nombre: 'Oliva' },
  { id: 'azul', hex: '#1e3a8a', nombre: 'Azul' },
]

const PRODUCTOS = [
  { nombre: 'Remera Oversize', retail: 28_000, wholesale: 16_500, stock: 12, gradiente: 'from-zinc-200 to-zinc-300' },
  { nombre: 'Buzo Canguro', retail: 52_000, wholesale: 31_000, stock: 0, gradiente: 'from-stone-200 to-stone-300' },
  { nombre: 'Pantalón Cargo', retail: 61_000, wholesale: 36_500, stock: 4, gradiente: 'from-neutral-200 to-neutral-300' },
]

function precio(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function DemoInteractiva() {
  const [nombre, setNombre] = useState('Mi Marca')
  const [color, setColor] = useState(COLORES[0])
  const [sinStock, setSinStock] = useState(false)
  const [mayorista, setMayorista] = useState(false)

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ── Mini Panel Admin ── */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-3">
          <Settings className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-900">Panel Admin</span>
          <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">simulado</span>
        </div>

        <div className="space-y-6 p-5">
          {/* Nombre */}
          <div>
            <label className="text-xs font-medium text-zinc-700">Nombre de la tienda</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value.slice(0, 20))}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
          </div>

          {/* Color */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
              <Palette className="h-3.5 w-3.5" /> Color de marca
            </div>
            <div className="mt-2 flex gap-2">
              {COLORES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setColor(c)}
                  title={c.nombre}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color.id === c.id ? 'border-zinc-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-zinc-400">Cambia botones y detalles de la tienda al instante.</p>
          </div>

          {/* Modo sin stock */}
          <ToggleRow
            icon={<PackageX className="h-3.5 w-3.5" />}
            label="Modo sin stock"
            hint="Tus clientes pueden comprar por encargo aunque el stock esté en 0."
            checked={sinStock}
            onChange={setSinStock}
          />

          {/* Precios mayoristas */}
          <ToggleRow
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Ver como cliente mayorista"
            hint="Cada producto tiene precio minorista y mayorista — cada cliente ve el suyo."
            checked={mayorista}
            onChange={setMayorista}
          />
        </div>
      </div>

      {/* ── Tienda simulada ── */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {/* Barra del navegador */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="ml-3 rounded-md bg-white px-3 py-1 text-xs text-zinc-500 border border-zinc-200">
            {nombre.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'mimarca'}.gounuri.com
          </span>
        </div>

        {/* Header de la tienda */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <span className="text-lg font-bold tracking-tight" style={{ color: color.hex }}>
            {nombre || 'Mi Marca'}
          </span>
          <div className="flex items-center gap-3">
            {mayorista && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-medium text-white" style={{ backgroundColor: color.hex }}>
                Cliente mayorista
              </span>
            )}
            <ShoppingBag className="h-5 w-5 text-zinc-400" />
          </div>
        </div>

        {/* Productos */}
        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {PRODUCTOS.map(p => {
            const agotado = p.stock === 0
            const comprable = !agotado || sinStock
            return (
              <div key={p.nombre} className="overflow-hidden rounded-lg border border-zinc-200">
                <div className={`relative aspect-square bg-gradient-to-br ${p.gradiente}`}>
                  {agotado && !sinStock && (
                    <span className="absolute left-2 top-2 rounded bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-white">
                      SIN STOCK
                    </span>
                  )}
                  {agotado && sinStock && (
                    <span className="absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: color.hex }}>
                      POR ENCARGO
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-zinc-900">{p.nombre}</p>
                  <p className="mt-0.5 text-sm font-bold text-zinc-900">
                    {precio(mayorista ? p.wholesale : p.retail)}
                    {mayorista && (
                      <span className="ml-1.5 text-[10px] font-normal text-zinc-400 line-through">{precio(p.retail)}</span>
                    )}
                  </p>
                  <button
                    disabled={!comprable}
                    className="mt-2 w-full rounded-md py-1.5 text-[11px] font-medium text-white transition-opacity disabled:opacity-30"
                    style={{ backgroundColor: comprable ? color.hex : '#a1a1aa' }}
                  >
                    {comprable ? 'Agregar al carrito' : 'Agotado'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ icon, label, hint, checked, onChange }: {
  icon: React.ReactNode
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
          {icon} {label}
        </span>
        <button
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-zinc-900' : 'bg-zinc-300'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-zinc-400">{hint}</p>
    </div>
  )
}
