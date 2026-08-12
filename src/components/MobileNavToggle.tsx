'use client'

// Menú hamburguesa para mobile — a partir de 900px de ancho .nav-links
// (FEATURES, COMO FUNCIONA, etc.) desaparece del todo sin ningún reemplazo
// (ver .nav-links{display:none} en globals.css), así que en el celular no
// había forma de navegar por esas secciones. Esto agrega el botón de 3
// rayitas que las despliega.

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { href: '/#features', label: 'FEATURES' },
  { href: '/#como-funciona', label: 'COMO FUNCIONA' },
  { href: '/templates', label: 'TEMPLATE' },
  { href: '/demo', label: 'DEMO' },
  { href: '/#planes', label: 'PLANES' },
  { href: '/migracion', label: 'MIGRACION' },
]

export default function MobileNavToggle() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        className="nav-mobile-toggle"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div className="nav-mobile-panel">
          <ul>
            {LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
