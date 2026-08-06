'use client'

import { useEffect, useRef } from 'react'

/**
 * Reproduce el comportamiento de las secciones "Tienda" (Mono/Glow/Minimalista/
 * Axis/Bazaar/Atelier): cuando la seccion entra en viewport, agrega la clase
 * 'in-view' (dispara las transiciones de entrada del CSS) y arranca un loop
 * infinito que alterna la variable CSS --shop-progress entre 0 y 1 cada 3s
 * (crossfade entre el estado 2A y 2B de fotos/wordmark/captions).
 */
export function useShopAnimation<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const section = ref.current
    if (!section) return

    let interval: ReturnType<typeof setInterval> | undefined

    function startLoop() {
      let state = 0
      section!.style.setProperty('--shop-progress', String(state))
      interval = setInterval(() => {
        state = state ? 0 : 1
        section!.style.setProperty('--shop-progress', String(state))
      }, 3000)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add('in-view')
            startLoop()
            io.disconnect()
          }
        })
      },
      { threshold: 0.25 }
    )
    io.observe(section)

    return () => {
      io.disconnect()
      if (interval) clearInterval(interval)
    }
  }, [])

  return ref
}
