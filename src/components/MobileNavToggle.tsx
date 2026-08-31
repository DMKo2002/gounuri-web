'use client'

// Menú hamburguesa para mobile — a partir de 900px de ancho .nav-links
// (FEATURES, COMO FUNCIONA, etc.) desaparece del todo sin ningún reemplazo
// (ver .nav-links{display:none} en globals.css), así que en el celular no
// había forma de navegar por esas secciones. Esto agrega el botón de 3
// rayitas que las despliega.
//
// 2026-08-29 (reportado por ARam, testing en mobile): con sesión iniciada,
// en el celular solo se veía "Ir a mi tienda" en el navbar -- "Mi cuenta"
// vive en NavAuth.tsx con "hidden sm:block" (a propósito, para no repetir
// el problema de overflow del hero con dos botones fijos que no entran en
// pantallas angostas) y por lo tanto no había ninguna forma de llegar a
// /perfil ni, desde ahí, al Panel Admin. En vez de sumar más botones
// pegados al header (que ya está justo de espacio con logo + hamburguesa +
// "Ir a mi tienda"), este menú -- que ya es el lugar pensado para todo lo
// que no entra en el navbar angosto -- ahora suma "Mi cuenta" y "Panel
// Admin" arriba de todo cuando hay sesión.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PanelHandoffLink from '@/components/PanelHandoffLink'

const LINKS = [
  { href: '/#features', label: 'FEATURES' },
  { href: '/#como-funciona', label: 'COMO FUNCIONA' },
  { href: '/templates', label: 'TEMPLATE' },
  { href: '/#planes', label: 'PLANES' },
  { href: '/#contacto', label: 'CONTACTO' },
  { href: '/migracion', label: 'MIGRACION' },
]

export default function MobileNavToggle() {
  const [open, setOpen] = useState(false)
  const [logueado, setLogueado] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => setLogueado(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setLogueado(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

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
            {logueado && (
              <>
                <li><Link href="/perfil" onClick={() => setOpen(false)}>MI CUENTA</Link></li>
                <li><PanelHandoffLink className="block px-1 py-[15px] text-[13.5px] font-semibold tracking-[.03em] text-black">PANEL ADMIN</PanelHandoffLink></li>
              </>
            )}
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
