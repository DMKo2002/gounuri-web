'use client'

// Transición de página muy liviana, sin librerías nuevas: al cambiar de
// ruta, el pathname cambia, la key del div cambia, React desmonta/monta el
// contenedor de nuevo y eso vuelve a disparar la animación CSS de entrada
// (fade + slide sutil). No es una transición "cruzada" con librería tipo
// framer-motion (eso implicaría sumar una dependencia nueva al proyecto),
// pero saca el salto brusco de "la página aparece de golpe" que pedía David
// (2026-09-21) sin tocar el bundle size del sitio.

import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  )
}
