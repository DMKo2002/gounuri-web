import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { PANEL_URL, REGISTRO_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Preguntas frecuentes — Gounuri',
  description: 'Respuestas a las dudas más comunes al armar tu tienda en Gounuri: dominio, footer, productos, pagos, envíos y plan.',
}

type Faq = { q: string; a: string }
type FaqGroup = { title: string; items: Faq[] }

// 2026-08-24: pedido de David/Aram — hasta ahora el único mail que recibe
// un tenant nuevo es la confirmación de cuenta de Supabase Auth, sin
// ninguna guía de "y ahora qué hago". Esta página es el destino del link
// de FAQ del mail de bienvenida (ver emailBienvenidaTenant en
// Panel Admin/src/lib/email.ts) — pensada para las dudas que más
// aparecen recién arrancando, no como un manual completo. PANEL_URL/
// REGISTRO_URL vienen de lib/site.ts (misma fuente que usa el resto del
// sitio) para no hardcodear URLs que ya viven ahí.
const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'Primeros pasos',
    items: [
      {
        q: '¿Por qué mi tienda está vacía?',
        a: `Una tienda nueva arranca sin productos cargados — nadie los carga por vos. Andá a tu Panel Admin → Productos y cargá el primero: nombre, precio, fotos y variantes (talle/color) si aplica. Con el primer producto publicado tu tienda pública deja de verse vacía al instante.`,
      },
      {
        q: '¿Cómo cambio el nombre de mi tienda?',
        a: `Desde el Panel Admin: pasá el mouse por el nombre en la parte de arriba del menú lateral y va a aparecer un lápiz al lado — hacé clic, escribí el nuevo nombre y confirmá. Es distinto del dominio (mitienda.gounuri.com), que se cambia aparte en Dominio.`,
      },
      {
        q: '¿Cómo elijo o cambio el diseño de mi tienda?',
        a: `En Apariencia podés elegir colores, tipografía y el estilo visual general de tu tienda. El template (la estructura de base: Minimalista, Atelier, Axis, etc.) se elige al crear la tienda y no se cambia solo — si querés pasar a otro, escribinos.`,
      },
    ],
  },
  {
    title: 'Dominio y footer',
    items: [
      {
        q: '¿Por qué no funciona mi dominio?',
        a: `Si acabás de conectar un dominio propio (ej. www.mitienda.com), la verificación y la propagación de DNS pueden tardar desde unos minutos hasta 24-48 horas según tu proveedor. Revisá en Dominio que los registros DNS que te dimos estén cargados exactamente como se indican ahí — un solo carácter mal copiado alcanza para que no valide. Mientras tanto tu tienda sigue funcionando normalmente en mitienda.gounuri.com.`,
      },
      {
        q: '¿Por qué no tengo nada en el footer?',
        a: `El pie de tu tienda (dirección, teléfono, WhatsApp, redes sociales, sucursales) se arma con lo que cargues en Contacto y Redes. Si no completaste esos datos, el footer se ve vacío o incompleto — es la sección exacta que lo alimenta.`,
      },
    ],
  },
  {
    title: 'Ventas, pagos y envíos',
    items: [
      {
        q: '¿Cómo configuro los medios de pago?',
        a: `En Cobranzas & Finanzas activás y configurás Mercado Pago, transferencia bancaria y/o efectivo/retiro en local, según cuáles quieras ofrecer.`,
      },
      {
        q: '¿Cómo configuro el costo y las zonas de envío?',
        a: `En Envíos cargás tus métodos de envío (por zona, costo fijo, retiro en local, etc.) — cada método que agregues ahí aparece como opción para tus clientes en el checkout.`,
      },
      {
        q: '¿Dónde veo y gestiono mis pedidos?',
        a: `En Pedidos, desde el menú principal (no dentro de Configuración) — ahí ves cada pedido, cambiás su estado y generás el recibo/etiqueta de envío en PDF.`,
      },
    ],
  },
  {
    title: 'Plan y cuenta',
    items: [
      {
        q: '¿Qué pasa cuando termina mi prueba gratis?',
        a: `Tenés 7 días gratis del plan que elegiste al registrarte. Cuando termina, tenés otros 7 días de gracia para activar un plan pago sin que tu tienda se apague. Pasado ese plazo, la tienda pública se suspende — pero tus datos y tu catálogo quedan intactos, no se pierde nada, y se reactiva apenas activás el plan.`,
      },
      {
        q: '¿Cómo activo o cambio mi plan?',
        a: `En Plan y uso vas a ver tu plan actual, cuánto llevás usado (productos, almacenamiento, visitas) y cómo pasar a un plan pago o cambiar de plan.`,
      },
      {
        q: '¿Puedo darle acceso a un empleado sin darle mi contraseña?',
        a: `Sí. En Cuentas podés crear una cuenta de "staff" con acceso solo a las secciones que elijas (por ejemplo, Pedidos y Productos, sin acceso a Cobranzas) — no hace falta compartir tu usuario.`,
      },
    ],
  },
  {
    title: 'Soporte',
    items: [
      {
        q: '¿Qué hago si algo no funciona o tengo una duda que no está acá?',
        a: `Escribinos a soporte@gounuri.com o al +54 11 2579-2002 y te ayudamos. Contanos el nombre de tu tienda para encontrarte más rápido.`,
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main className="faq-page">
        <h1>Preguntas frecuentes</h1>
        <p className="faq-intro">
          Las dudas más comunes al arrancar con tu tienda. Si no encontrás la
          tuya, escribinos a{' '}
          <a href="mailto:soporte@gounuri.com">soporte@gounuri.com</a>. ¿Ya
          tenés tienda?{' '}
          <a href={`${PANEL_URL}/dashboard`}>Ir a tu Panel Admin →</a>
        </p>

        {FAQ_GROUPS.map(group => (
          <section key={group.title} className="faq-group">
            <h2>{group.title}</h2>
            {group.items.map(item => (
              <details key={item.q} className="faq-item">
                <summary>
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        ))}

        <div className="faq-cta">
          <p>¿Todavía no tenés tienda?</p>
          <a href={REGISTRO_URL}>Creá tu tienda gratis →</a>
        </div>
      </main>
      <Footer />
    </>
  )
}
