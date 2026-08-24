// Política de Privacidad standalone de gounuri.com — 2026-08-24, pedido de
// David después de revisar el estado de temas legales de la plataforma.
//
// IMPORTANTE — BORRADOR PARA REVISIÓN LEGAL, NO PUBLICAR SIN REVISAR:
// este texto lo redactó Claude como punto de partida, tomando como base lo
// que ya existía en /terminos (sección 8, que cubre el mismo tema de forma
// más breve, mezclado con el resto del contrato). NO es asesoramiento legal
// y no reemplaza la revisión de un abogado especializado en protección de
// datos / derecho del consumidor argentino antes de publicarlo. En
// particular, la sección 12 (Registro Nacional de Bases de Datos) da por
// hecho que las bases de Gounuri están inscriptas ante el RNBD de la AAIP
// (art. 21, Ley 25.326) — verificar que eso sea cierto antes de publicar
// esta página, o ajustar el texto si todavía no se hizo ese trámite.
//
// Mantiene el mismo layout que /terminos (misma clase .tc-page en
// globals.css, mismo Navbar/Footer) para que las dos páginas legales se
// vean consistentes entre sí.

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { CONTACTO_EMAIL } from '@/lib/site'

export const metadata = {
  title: 'Política de Privacidad — Gounuri',
}

export default function Privacidad() {
  return (
    <>
      <Navbar />
      <main className="tc-page">
      <h1>POLÍTICA DE PRIVACIDAD DE GOUNURI.COM</h1>
      <p className="tc-updated">Última actualización: Agosto de 2026</p>
      <blockquote>Esta Política de Privacidad describe cómo GOUNURI.COM ("Gounuri", "la Plataforma") recopila, utiliza, almacena y protege los datos personales de quienes se registran, acceden o utilizan sus servicios. Se complementa con los <a href="/terminos">Términos y Condiciones</a> de la Plataforma, que regulan el vínculo contractual con el Tenant.</blockquote>
      <h2 id="sec-1">1. Responsable del Tratamiento</h2>
      <p><strong>1.1.</strong> GOUNURI.COM es el responsable del tratamiento de los datos personales que se detallan en este documento, en los términos de la Ley Nacional de Protección de Datos Personales Nº 25.326 y su normativa reglamentaria.</p>
      <p><strong>1.2.</strong> Ante cualquier consulta relacionada con esta Política de Privacidad, el Usuario puede contactarse a través de <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>.</p>
      <h2 id="sec-2">2. Alcance: los Dos Roles de Gounuri Frente a los Datos</h2>
      <p><strong>2.1. Gounuri como Responsable:</strong> respecto de los datos personales que el Tenant (la persona física o jurídica que crea una cuenta y una tienda en Gounuri) proporciona directamente a la Plataforma para darse de alta, administrar su cuenta y facturar el servicio SaaS contratado. Esta Política de Privacidad regula ese tratamiento.</p>
      <p><strong>2.2. Gounuri como Encargado del Tratamiento:</strong> respecto de los datos personales de los Clientes Finales (los compradores de cada tienda) que el Tenant recopila, almacena y gestiona a través de la infraestructura de Gounuri. En ese caso, el Tenant reviste el carácter de Responsable de dicha base de datos, y es quien define las políticas de privacidad de su propia tienda (configurables desde su Panel Admin, sección "Legal"). Gounuri únicamente aloja y procesa esa información por cuenta del Tenant, conforme a sus instrucciones y a los fines de prestar el servicio.</p>
      <h2 id="sec-3">3. Datos que Recopilamos</h2>
      <p><strong>3.1. Datos de registro y cuenta:</strong> nombre, dirección de correo electrónico, contraseña (almacenada de forma cifrada), y, si el Usuario elige registrarse mediante Google o Facebook, la información básica de perfil que dichos proveedores comparten con Gounuri (nombre y correo electrónico).</p>
      <p><strong>3.2. Datos de la tienda y facturación:</strong> nombre comercial, dominio, datos de contacto, y la información necesaria para procesar el cobro de la suscripción al servicio.</p>
      <p><strong>3.3. Datos técnicos y de uso:</strong> dirección IP, tipo de dispositivo y navegador, páginas visitadas, y datos de interacción con la Plataforma, recopilados mediante cookies y tecnologías similares con fines de seguridad, funcionamiento y análisis.</p>
      <h2 id="sec-4">4. Finalidad del Tratamiento</h2>
      <p>Los datos personales recopilados se utilizan para: crear y administrar la cuenta del Usuario; prestar, mantener y mejorar el servicio; procesar pagos y facturación; enviar comunicaciones transaccionales (confirmación de cuenta, avisos de facturación, notificaciones de servicio) y, cuando corresponda, comunicaciones comerciales; brindar soporte técnico; prevenir fraude y uso indebido de la Plataforma; y cumplir con obligaciones legales aplicables.</p>
      <h2 id="sec-5">5. Con Quién Compartimos Información</h2>
      <p><strong>5.1.</strong> Gounuri no vende ni comercializa datos personales. Los comparte únicamente con proveedores que colaboran en la prestación del servicio, entre ellos:</p>
      <ul>
      <li>Proveedores de infraestructura en la nube y hosting (Vercel, Supabase).</li>
      <li>Procesadores de pago (MercadoPago) para la facturación del servicio SaaS.</li>
      <li>Proveedores de envío de correo electrónico transaccional (Resend).</li>
      <li>Servicios de verificación antibots (Cloudflare Turnstile).</li>
      <li>Proveedores de autenticación externa (Google, Facebook), únicamente si el Usuario elige iniciar sesión con esas cuentas.</li>
      </ul>
      <p><strong>5.2.</strong> Estos proveedores acceden a los datos estrictamente necesarios para prestar su servicio a Gounuri, y están sujetos a sus propias políticas de privacidad y a obligaciones de confidencialidad.</p>
      <p><strong>5.3.</strong> Gounuri podrá además divulgar datos personales cuando así lo exija la ley, una orden judicial o un requerimiento de autoridad competente.</p>
      <h2 id="sec-6">6. Transferencia Internacional de Datos</h2>
      <p>Parte de la infraestructura tecnológica utilizada por Gounuri (hosting, bases de datos, procesamiento) puede alojar información en servidores ubicados fuera de la República Argentina. Al utilizar la Plataforma, el Usuario acepta esta transferencia internacional de datos, que Gounuri realiza adoptando los recaudos razonables para resguardar su confidencialidad y seguridad, en línea con los principios de la Ley 25.326.</p>
      <h2 id="sec-7">7. Plazo de Conservación</h2>
      <p>Los datos personales se conservan mientras la cuenta del Usuario permanezca activa y durante el plazo adicional necesario para cumplir con obligaciones legales, contables o fiscales. Finalizada la relación y transcurridos dichos plazos, Gounuri podrá eliminar definitivamente la información, salvo que exista una obligación legal que imponga su conservación por un período mayor.</p>
      <h2 id="sec-8">8. Derechos del Titular de los Datos (Derechos ARCO)</h2>
      <p>De conformidad con la Ley 25.326, el Usuario tiene derecho a acceder, rectificar, actualizar y solicitar la supresión de sus datos personales en poder de Gounuri. Para ejercer estos derechos, puede enviar una solicitud a <a href={`mailto:${CONTACTO_EMAIL}`}>{CONTACTO_EMAIL}</a>, indicando el derecho que desea ejercer y los datos que permitan identificar su cuenta. Gounuri dará respuesta dentro de los plazos previstos por la normativa vigente.</p>
      <h2 id="sec-9">9. Seguridad de la Información</h2>
      <p>Gounuri implementa medidas técnicas y organizativas razonables para proteger los datos personales contra accesos no autorizados, pérdida, alteración o divulgación indebida. No obstante, ningún sistema es completamente infalible, por lo que Gounuri no puede garantizar la seguridad absoluta de la información transmitida a través de internet.</p>
      <h2 id="sec-10">10. Cookies</h2>
      <p>Gounuri.com utiliza cookies propias y de terceros para el funcionamiento de la sesión, la seguridad (Cloudflare Turnstile) y el análisis del uso del sitio. El Usuario puede configurar su navegador para restringir o bloquear cookies, aunque esto podría afectar el funcionamiento de algunas secciones de la Plataforma. Cada tienda creada por un Tenant cuenta, además, con su propia Política de Cookies configurable desde su Panel Admin, aplicable a sus Clientes Finales.</p>
      <h2 id="sec-11">11. Menores de Edad</h2>
      <p>Los servicios de Gounuri están dirigidos a personas mayores de 18 años con capacidad legal para contratar. Gounuri no recopila deliberadamente datos personales de menores de edad.</p>
      <h2 id="sec-12">12. Registro Nacional de Bases de Datos</h2>
      <p>En cumplimiento del artículo 21 de la Ley 25.326, las bases de datos personales de titularidad de Gounuri se encuentran inscriptas ante el Registro Nacional de Bases de Datos, en el ámbito de la Agencia de Acceso a la Información Pública (AAIP).</p>
      <h2 id="sec-13">13. Modificaciones a esta Política</h2>
      <p>Gounuri podrá modificar esta Política de Privacidad en cualquier momento. Los cambios entrarán en vigencia desde su publicación en este sitio. Se recomienda al Usuario revisar este documento periódicamente.</p>
      <h2 id="sec-14">14. Autoridad de Control</h2>
      <p>La Agencia de Acceso a la Información Pública (AAIP), órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan en relación con el incumplimiento de las normas sobre protección de datos personales.</p>
      <h2 id="sec-15">15. Ley Aplicable y Jurisdicción</h2>
      <p>Esta Política de Privacidad se rige por las leyes de la República Argentina. Para cualquier controversia derivada de su interpretación o aplicación, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires (CABA), renunciando a cualquier otro fuero o jurisdicción.</p>
      </main>
      <Footer />
    </>
  )
}
