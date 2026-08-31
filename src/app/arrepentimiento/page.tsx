// Botón de Arrepentimiento standalone de gounuri.com — 2026-08-29, agregado
// junto con el link nuevo en el footer (ver Footer.tsx), como el "mecanismo
// habilitado en la Plataforma" al que ya hace referencia /terminos §7.1
// (Derecho de Revocación).
//
// IMPORTANTE — BORRADOR PARA REVISIÓN LEGAL, NO PUBLICAR SIN REVISAR: este
// texto lo redactó Claude como punto de partida, no es asesoramiento legal.
// Alcance: esta página cubre únicamente la suscripción SaaS que el Tenant
// contrata directamente con Gounuri (B2B/B2C según el caso, ver §7.1 de
// /terminos). NO reemplaza el Botón de Arrepentimiento que cada tienda debe
// tener para sus propios Clientes Finales — eso se configura por tienda
// desde el Panel Admin y es responsabilidad de cada Tenant (ver /terminos
// §6.2).
//
// Mantiene el mismo layout que /terminos y /privacidad (misma clase
// .tc-page en globals.css, mismo Navbar/Footer).

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CONTACTO_EMAIL, whatsappUrl } from '@/lib/site'

export const metadata = {
  title: 'Botón de Arrepentimiento — Gounuri',
}

export default function Arrepentimiento() {
  return (
    <>
      <Navbar />
      <main className="tc-page">
      <h1>BOTÓN DE ARREPENTIMIENTO</h1>
      <p className="tc-updated">Última actualización: Agosto de 2026</p>
      <blockquote>En cumplimiento de la Resolución 424/2020 de la Secretaría de Comercio Interior y la Disposición 3/2026, GOUNURI.COM pone a disposición del Tenant el mecanismo para ejercer su derecho de revocación sobre la suscripción al servicio SaaS contratado, conforme al art. 34 de la Ley 24.240 de Defensa del Consumidor.</blockquote>
      <p><strong>Alcance.</strong> Este derecho aplica exclusivamente a la contratación del servicio SaaS de Gounuri por parte del Tenant (ver <a href="/terminos#sec-7">Términos y Condiciones, sección 7</a>). Si estás buscando ejercer el derecho de arrepentimiento sobre una compra realizada en una tienda que usa Gounuri, ese trámite se hace directamente con esa tienda, no con Gounuri — buscá el link "Botón de Arrepentimiento" en el pie de página de esa tienda.</p>
      <h2 id="sec-1">1. Plazo</h2>
      <p>El Tenant tiene derecho a revocar la suscripción inicial pagada dentro de los 10 (diez) días corridos contados desde el momento de la contratación, sin necesidad de expresar causa ni de asumir penalidad alguna.</p>
      <h2 id="sec-2">2. Cómo ejercerlo</h2>
      <p>Para ejercer este derecho, el Tenant puede comunicarse por cualquiera de estos medios, indicando el nombre de la cuenta/tienda y la fecha de contratación:</p>
      <ul>
      <li>Email: <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a></li>
      <li>WhatsApp: <a href={whatsappUrl('Hola, quiero ejercer el derecho de arrepentimiento sobre mi suscripción a Gounuri.')} target="_blank" rel="noopener">enviar mensaje</a></li>
      </ul>
      <h2 id="sec-3">3. Confirmación</h2>
      <p>Gounuri confirmará la recepción de la solicitud y el código de trámite correspondiente dentro de las 24 (veinticuatro) horas de recibida, y procederá al reintegro de los importes abonados según los medios de pago utilizados, en los plazos que estos permitan.</p>
      </main>
      <Footer />
    </>
  )
}
