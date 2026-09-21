'use client'

// Accordion suave para reemplazar <details>/<summary> nativos, que abren y
// cierran de un salto sin transición posible en CSS puro. Mismo look que
// .faq-item de antes (mismas clases faq-icon, mismo texto de pregunta y
// respuesta) pero con una animación de despliegue via CSS grid-template-rows
// (0fr -> 1fr), que es la única forma de animar una altura "auto" sin medir
// nada en JS. Pedido por David (2026-09-21): las solapas de /faq se sentían
// "muy bruscas" al abrir.

import { useId, useState } from 'react'

type AccordionItemProps = {
  question: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function AccordionItem({ question, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className="acc-item" data-open={open}>
      <button
        type="button"
        className="acc-summary"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(v => !v)}
      >
        <span>{question}</span>
        <span className="faq-icon" aria-hidden="true" />
      </button>
      <div id={panelId} className="acc-panel" role="region">
        <div className="acc-panel-inner">{children}</div>
      </div>
    </div>
  )
}
