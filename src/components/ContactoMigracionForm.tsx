'use client'

// Formulario de contacto de migración. Por ahora es solo front-end (igual
// que en el sitio viejo) — falta conectarlo a un backend/CRM real.
// TODO: conectar a backend/CRM para procesar el envío.

import { useState } from 'react'

export default function ContactoMigracionForm() {
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: reemplazar por el envío real (fetch a backend / CRM) cuando esté disponible.
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="contact-success show" id="contactSuccess">
        <h2>¡Listo, recibimos tu consulta!</h2>
        <p>Un especialista de Gounuri va a revisar los datos de tu tienda y se va a contactar con vos personalmente por WhatsApp a la brevedad.</p>
        <p className="contact-legend">Si no tenés novedades en las próximas 24-48hs hábiles, escribinos directamente por WhatsApp.</p>
      </div>
    )
  }

  return (
    <form id="contactForm" onSubmit={handleSubmit}>
      <h1>Contactá a un especialista</h1>
      <p className="contact-lead">Dejanos tus datos y los de tu tienda actual. Un especialista de Gounuri va a revisar tu caso y coordinar la migración con vos.</p>

      <fieldset className="contact-fieldset">
        <legend>Tus datos</legend>
        <div className="contact-row">
          <div className="contact-field">
            <label htmlFor="nombre">Nombre completo</label>
            <input type="text" id="nombre" name="nombre" required autoComplete="name" />
          </div>
          <div className="contact-field">
            <label htmlFor="telefono">Teléfono / WhatsApp</label>
            <input type="tel" id="telefono" name="telefono" required autoComplete="tel" placeholder="+54 9 11 1234 5678" />
          </div>
        </div>
        <div className="contact-field">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required autoComplete="email" />
        </div>
      </fieldset>

      <fieldset className="contact-fieldset">
        <legend>Tu tienda actual</legend>
        <div className="contact-row">
          <div className="contact-field">
            <label htmlFor="tienda">Nombre de la tienda</label>
            <input type="text" id="tienda" name="tienda" />
          </div>
          <div className="contact-field">
            <label htmlFor="url">URL de la tienda actual <span className="optional">(opcional)</span></label>
            <input type="url" id="url" name="url" placeholder="https://" />
          </div>
        </div>
        <div className="contact-field">
          <label htmlFor="productos">Cantidad aprox. de productos <span className="optional">(opcional)</span></label>
          <input type="text" id="productos" name="productos" inputMode="numeric" placeholder="Ej: 150" />
        </div>
        <div className="contact-field">
          <label htmlFor="comentarios">Contanos un poco más <span className="optional">(opcional)</span></label>
          <textarea id="comentarios" name="comentarios" placeholder="Motivo de la migración, plazos, dudas puntuales..." />
        </div>
      </fieldset>

      {/* TODO: conectar a backend/CRM para procesar el envío. Por ahora el formulario es solo front-end. */}
      <button type="submit" className="contact-submit">
        Enviar consulta
        <svg viewBox="0 0 27 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26.3536 5.35355C26.5488 5.15829 26.5488 4.84171 26.3536 4.64645L23.1716 1.46447C22.9763 1.2692 22.6597 1.2692 22.4645 1.46447C22.2692 1.65973 22.2692 1.97631 22.4645 2.17157L25.2929 5L22.4645 7.82843C22.2692 8.02369 22.2692 8.34027 22.4645 8.53553C22.6597 8.7308 22.9763 8.7308 23.1716 8.53553L26.3536 5.35355ZM0 5.5H26V4.5H0V5.5Z" fill="white"/></svg>
      </button>

      <p className="contact-legend">Luego de recibir tus datos, nos contactamos personalmente por WhatsApp para coordinar los próximos pasos de tu migración.</p>
    </form>
  )
}
