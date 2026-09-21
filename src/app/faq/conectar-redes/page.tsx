import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Conectá Instagram y Facebook a tu tienda — Gounuri',
  description: 'Guía paso a paso para pasar tu Instagram a cuenta profesional, crear la Página de Facebook de tu negocio y darle acceso a Gounuri sin compartir tu contraseña.',
  alternates: { canonical: '/faq/conectar-redes' },
}

// 2026-09-21: guía para tenants sobre el flujo de Meta (Instagram + Facebook)
// que un tenant tiene que hacer para que podamos gestionarle contenido/pauta
// con el servicio de CM. Enlazada desde /faq (pregunta sobre Meta Pixel).
// El tenant nunca crea un "Business Manager" propio ni comparte contraseñas —
// solo pasa Instagram a profesional, crea su Página y nos acepta una
// solicitud de acceso compartido. Capturas reales tomadas en vivo probando
// el flujo con una cuenta de prueba; las que mostraban nombre real fueron
// censuradas antes de subirlas.
export default function ConectarRedesPage() {
  return (
    <>
      <Navbar />
      <main className="guide-page">
        <header className="guide-hero">
          <span className="guide-eyebrow"><span className="dot" />Centro de ayuda Gounuri</span>
          <h1>Conectá Instagram y Facebook a tu tienda</h1>
          <p className="guide-lede">
            Esta guía te lleva paso a paso para dejar tu Instagram como cuenta
            profesional, crear la Página de Facebook de tu negocio y darnos
            permiso para gestionar tu contenido y tu pauta. Tarda unos 10
            minutos y no hace falta que sepas nada de marketing digital.
          </p>
          <div className="guide-meta">
            <span>⏱ ~10 minutos</span>
            <span>📱 Se hace desde el celular</span>
            <span>🔒 Nunca compartís tu contraseña con nosotros</span>
          </div>
        </header>

        <div className="guide-checklist">
          <h2>Antes de empezar necesitás</h2>
          <ul>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span><b>El Instagram de tu tienda</b>, con la app instalada en tu celular y la sesión iniciada.</span>
            </li>
            <li>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span><b>Tu Facebook personal de siempre</b> — no hace falta crear ninguna cuenta nueva.</span>
            </li>
          </ul>
        </div>

        <section className="guide-part">
          <div className="guide-part-head">
            <span className="guide-part-num">Parte 1</span>
            <h2>Pasá tu Instagram a cuenta profesional</h2>
          </div>
          <p className="guide-part-sub">Se hace desde la app de Instagram, en el perfil de tu tienda. Es gratis y no cambia nada de lo que ya publicaste.</p>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-1.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-1.jpg" alt="Menú de configuración y privacidad de Instagram" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 1</div>
              <h3>Entrá a Configuración y privacidad</h3>
              <p>Desde tu perfil, tocá el menú (las tres rayitas arriba a la derecha) y elegí <code>Configuración y privacidad</code>.</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-2.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-2.jpg" alt="Sección Para profesionales dentro de configuración" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 2</div>
              <h3>Buscá &quot;Tipo de cuenta y herramientas&quot;</h3>
              <p>Bajá hasta la sección <b>Para profesionales</b> y tocá <code>Tipo de cuenta y herramientas</code>.</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-3.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-3.jpg" alt="Botón cambiar a cuenta profesional" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 3</div>
              <h3>Cambiá a cuenta profesional</h3>
              <p>Tocá <code>Cambiar a cuenta profesional</code> y seguí el asistente. Elegí <b>Empresa</b> cuando te pregunte el tipo de cuenta (no &quot;Creador de contenido&quot; — esa es para influencers).</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-4.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-4.jpg" alt="Selección de categoría del negocio" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 4</div>
              <h3>Elegí la categoría de tu negocio</h3>
              <p>Buscá la que mejor describa lo que vendés (por ejemplo &quot;Compras y ventas al por menor&quot; o el rubro específico si aparece). Podés ocultarla del perfil si preferís, la selección solo afecta cómo Meta clasifica tu cuenta puertas adentro.</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-5.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-5.jpg" alt="Pantalla de información de contacto" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 5</div>
              <h3>Información de contacto (opcional)</h3>
              <p>Te va a ofrecer sumar mail, teléfono o dirección al perfil público. Es opcional — podés tocar <code>No usar mi información de contacto</code> y seguir sin problema.</p>
            </div>
          </div>
        </section>

        <section className="guide-part">
          <div className="guide-part-head">
            <span className="guide-part-num">Parte 2</span>
            <h2>Creá la Página de Facebook de tu tienda</h2>
          </div>
          <p className="guide-part-sub">En algún paso del asistente anterior, Instagram te va a ofrecer vincular una Página de Facebook — podés crearla ahí mismo, o hacerlo aparte desde <code>facebook.com/pages/create</code> con tu Facebook personal.</p>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-6.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-6.jpg" alt="Inicio de Facebook con la página y el pixel como accesos directos" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 6</div>
              <h3>Tu página ya aparece en tus accesos directos</h3>
              <p>Una vez creada, la vas a ver listada junto a tu perfil personal en la barra lateral de Facebook — es tuya, separada de tu cuenta personal.</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-7.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-7.jpg" alt="Menú de perfiles de Facebook" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 7</div>
              <h3>Podés moverte entre tu perfil y tu página</h3>
              <p>Desde el menú de tu foto de perfil (arriba a la derecha) podés ver todos tus perfiles: tu cuenta personal y la página de tu negocio, sin mezclarse.</p>
            </div>
          </div>

          <div className="guide-step">
            <figure>
              <a href="/faq/conectar-redes/paso-8.jpg" target="_blank" rel="noopener">
                <img src="/faq/conectar-redes/paso-8.jpg" alt="Selector de perfil de Facebook" />
                <span className="guide-zoom-hint">🔍 Ver más grande</span>
              </a>
            </figure>
            <div>
              <div className="guide-step-num">Paso 8</div>
              <h3>Confirmá que la página quedó creada</h3>
              <p>En &quot;Seleccionar perfil&quot; vas a ver tu página listada por su nombre. Guardá el link de esa página (lo vas a necesitar en el paso siguiente).</p>
            </div>
          </div>
        </section>

        <section className="guide-part">
          <div className="guide-part-head">
            <span className="guide-part-num">Parte 3</span>
            <h2>Danos acceso a tu página</h2>
          </div>
          <p className="guide-part-sub">Este es el único paso que nos involucra a nosotros — y es el único que necesitamos de vos. Nunca te pedimos tu contraseña.</p>

          <div className="guide-textstep">
            <span className="guide-badge">1</span>
            <div>
              <h3>Pasanos el link de tu página</h3>
              <p>Copiá la URL de la página que creaste (desde el navegador, o &quot;Compartir&quot; en la app) y mandánosla por WhatsApp.</p>
            </div>
          </div>
          <div className="guide-textstep">
            <span className="guide-badge">2</span>
            <div>
              <h3>Nosotros te pedimos acceso</h3>
              <p>Desde nuestro lado enviamos una solicitud de acceso compartido a esa página — vos seguís siendo la única dueña, nosotros solo pedimos permiso para gestionar contenido, comentarios, anuncios y estadísticas.</p>
            </div>
          </div>
          <div className="guide-textstep">
            <span className="guide-badge">3</span>
            <div>
              <h3>Aprobá la notificación</h3>
              <p>Entrá a <code>business.facebook.com</code> con tu Facebook de siempre (no hace falta crear nada) y fijate la campanita de notificaciones — ahí vas a ver nuestra solicitud para aprobar con un clic.</p>
            </div>
          </div>
        </section>

        <section className="guide-part">
          <div className="guide-part-head">
            <h2>Preguntas frecuentes y errores comunes</h2>
          </div>
          <p className="guide-faq-intro">Meta (la empresa de Instagram y Facebook) a veces tira mensajes raros que no significan que algo esté roto. Estos son los más comunes.</p>

          <details className="faq-item">
            <summary><span>&quot;Creaste demasiadas páginas recientemente&quot;</span><span className="faq-icon" aria-hidden="true" /></summary>
            <p><span className="guide-tag gotcha">Gotcha</span>Es un freno automático de Meta contra el spam, no un error real de tu cuenta.</p>
            <p>Esperá entre 15 y 30 segundos y volvé a intentar. Si persiste, probá con un nombre de página distinto — a veces el problema es reintentar muy rápido con el mismo nombre.</p>
          </details>

          <details className="faq-item">
            <summary><span>Al iniciar sesión en Instagram desde Business Suite me tira &quot;Sorry, something went wrong&quot;</span><span className="faq-icon" aria-hidden="true" /></summary>
            <p><span className="guide-tag gotcha">Gotcha</span>Es un error conocido con cuentas y páginas recién creadas.</p>
            <p>Cuando el Instagram, la página y el acceso se arman todos el mismo día, Meta suele aplicar restricciones temporales antifraude que se destraban solas en 24 a 48 horas. No hace falta rehacer nada — probá de nuevo al otro día.</p>
          </details>

          <details className="faq-item">
            <summary><span>¿Necesito crear una cuenta de &quot;Meta Business&quot; para darles acceso?</span><span className="faq-icon" aria-hidden="true" /></summary>
            <p><span className="guide-tag info">Aclaración</span>No. Apenas tenés una Página de Facebook, ya contás con un Business Suite básico habilitado automáticamente para administrarla — no hay que crear nada aparte ni llenar ningún formulario de &quot;crear negocio&quot;.</p>
          </details>

          <details className="faq-item">
            <summary><span>No me llega ninguna notificación a Facebook normal</span><span className="faq-icon" aria-hidden="true" /></summary>
            <p><span className="guide-tag info">Aclaración</span>Las solicitudes de acceso a páginas no aparecen en las notificaciones comunes de Facebook. Entrá directamente a <code>business.facebook.com</code> logueada con tu cuenta y revisá la campanita ahí — es donde vive este tipo de aviso.</p>
          </details>

          <details className="faq-item">
            <summary><span>¿Le doy acceso completo a mi página?</span><span className="faq-icon" aria-hidden="true" /></summary>
            <p><span className="guide-tag info">Aclaración</span>No hace falta, y no te lo vamos a pedir. Solo necesitamos <b>Contenido</b>, <b>Actividad de la comunidad</b>, <b>Anuncios</b> y <b>Estadísticas</b> — lo justo para publicar, responder comentarios, gestionar pauta y mostrarte resultados. Vos seguís siendo la única dueña de la página en todo momento.</p>
          </details>
        </section>

        <footer className="guide-foot">
          <span>Guía armada por el equipo de Gounuri</span>
          <span>¿Trabada en algún paso? Escribinos por WhatsApp</span>
        </footer>
      </main>
      <Footer />
    </>
  )
}
