// Utilidad de email para gounuri.com (Resend) — mismo servicio y variables de
// entorno que ya usa /api/create-tenant (RESEND_API_KEY, EMAIL_FROM), pero
// centralizado acá con templates propios en vez de HTML inline por ruta.

const RESEND_API_URL = 'https://api.resend.com/emails'

export async function sendEmail({
  to,
  subject,
  html,
  fromName = 'gounuri',
  replyTo,
}: {
  to: string
  subject: string
  html: string
  fromName?: string
  replyTo?: string
}): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada — email omitido')
    return { ok: false }
  }
  const baseFrom = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
  const sender = `${fromName} <${baseFrom}>`
  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to,
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    })
    if (!res.ok) console.error('[email] Resend error:', await res.text())
    return { ok: res.ok }
  } catch (e: any) {
    console.error('[email] fetch error:', e.message)
    return { ok: false }
  }
}

// ── Layout compartido ────────────────────────────────────────────────────────

function layout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:520px;background:#fff;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:#101010;padding:30px 40px;text-align:center;">
    <img src="https://www.gounuri.com/img/email/gounuri-logo.png" width="107" height="20" alt="gounuri.com" style="display:block;margin:0 auto;border:0;outline:none;max-width:107px;height:auto;">
  </td></tr>

  ${bodyHtml}

  <!-- Footer -->
  <tr><td style="padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
    <p style="margin:0;font-size:12px;color:#bbb;">
      © gounuri · <a href="https://www.gounuri.com" style="color:#bbb;text-decoration:underline;">gounuri.com</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0"><tr>
    <td style="background:#101010;border-radius:8px;">
      <a href="${href}" style="display:block;padding:14px 32px;color:#fff;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.02em;">
        ${label}
      </a>
    </td>
  </tr></table>`
}

// ── Confirmación de registro ─────────────────────────────────────────────────

export function emailConfirmacionRegistro({
  nombre,
  confirmationUrl,
}: {
  nombre?: string
  confirmationUrl: string
}): string {
  return layout(`
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">Confirmá tu cuenta</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">${nombre ? `Hola, ${nombre}` : '¡Hola!'}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Gracias por registrarte en <strong>gounuri</strong>. Para activar tu cuenta y empezar a crear tu tienda, confirmá tu dirección de email:
    </p>
    ${ctaButton(confirmationUrl, 'Confirmar mi cuenta')}
    <p style="margin:28px 0 0;font-size:12px;color:#bbb;line-height:1.6;">
      Si no creaste esta cuenta, podés ignorar este email.<br>El link es válido por 24 horas.
    </p>
  </td></tr>`)
}

// ── Cuenta ya existente (compradora en alguna tienda) enganchada para
//    también poder crear su propia tienda — ver /api/auth/registro,
//    vincularCuentaExistente() ───────────────────────────────────────────────

export function emailCuentaVinculada({
  confirmationUrl,
}: {
  confirmationUrl: string
}): string {
  return layout(`
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">Cuenta vinculada</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">¡Hola!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Ya tenías una cuenta en <strong>gounuri</strong> con este email — la habilitamos para que también puedas crear y administrar tu propia tienda. Vas a seguir iniciando sesión con la misma contraseña de siempre.
    </p>
    ${ctaButton(confirmationUrl, 'Ir a crear mi tienda')}
    <p style="margin:28px 0 0;font-size:12px;color:#bbb;line-height:1.6;">
      Si no fuiste vos quien hizo esta solicitud, podés ignorar este email — tu cuenta no cambia hasta que confirmes.<br>El link es válido por 24 horas.
    </p>
  </td></tr>`)
}

// ── Baja de suscripción confirmada (2026-08-25) ─────────────────────────────
// Se dispara desde /api/billing/cancel al "dar de baja" desde /perfil/plan —
// hasta acá esta acción no mandaba ningún mail, ni al tenant ni a Gounuri.
export function emailBajaConfirmada({
  tenantName,
  activeUntil,
  panelUrl,
}: {
  tenantName: string
  activeUntil: string | null // ISO
  panelUrl: string
}): string {
  const fechaTxt = activeUntil
    ? new Date(activeUntil).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null
  return layout(`
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">Baja confirmada</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">¡Hola!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      Confirmamos que diste de baja la suscripción de tu tienda <strong>${tenantName}</strong>. No te vamos a volver a cobrar.
    </p>
    ${fechaTxt ? `
    <div style="background:#f7f7f7;border-radius:8px;padding:16px 20px;border-left:3px solid #101010;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:12px;color:#999;letter-spacing:0.05em;text-transform:uppercase;">Seguís con acceso hasta</p>
      <p style="margin:0;font-size:14px;color:#101010;font-weight:600;">${fechaTxt}</p>
    </div>` : ''}
    <p style="margin:0 0 28px;font-size:14px;color:#767676;line-height:1.7;">
      Después de esa fecha tu tienda pasa al plan gratuito — tus datos y tu catálogo quedan intactos. Si te arrepentís, podés volver a suscribirte cuando quieras.
    </p>
    ${ctaButton(`${panelUrl}/dashboard`, 'Ir a mi panel')}
  </td></tr>`)
}

// ── Bienvenida con datos de la tienda creada ────────────────────────────────

export function emailBienvenidaTienda({
  nombre,
  storeName,
  storeUrl,
  panelUrl,
  loginEmail,
  planNombre,
  trialDays,
  paid = false,
  faqUrl = 'https://www.gounuri.com/faq',
}: {
  nombre: string
  storeName: string
  storeUrl: string
  panelUrl: string
  loginEmail: string
  planNombre: string
  trialDays: number
  // Quien eligió y pagó un plan desde la landing antes de completar la
  // tienda (ver /api/finalizar-tienda) ya tiene el plan activo — no tiene
  // sentido hablarle de "días gratis". Default false = copy de siempre
  // (trial), para no cambiar nada en los llamadores existentes.
  paid?: boolean
  // 2026-08-24: pedido de Aram/David — sumar acceso directo al FAQ nuevo
  // (dominio, footer vacío, productos, plan, etc. — ver
  // src/app/faq/page.tsx) desde el primer mail que recibe el tenant, para
  // que la primera pantalla vacía del panel no sea su única guía.
  faqUrl?: string
}): string {
  return layout(`
  <tr><td style="padding:40px 40px 8px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">¡Ya está lista!</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">Bienvenido/a, ${nombre}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      ${paid
        ? `Tu tienda <strong>${storeName}</strong> ya está creada, con el plan ${planNombre} activo.`
        : `Tu tienda <strong>${storeName}</strong> ya está creada, con <strong>${trialDays} días gratis</strong> del plan ${planNombre} para probarla sin tarjeta.`}
    </p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;border-radius:8px;padding:4px 0;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">Tu tienda</p>
          <p style="margin:0;font-size:14px;"><a href="${storeUrl}" style="color:#101010;font-weight:600;text-decoration:none;">${storeUrl.replace(/^https?:\/\//, '')}</a></p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 16px;">
          <p style="margin:0 0 4px;font-size:11px;color:#999;letter-spacing:0.08em;text-transform:uppercase;">Usuario de acceso</p>
          <p style="margin:0;font-size:14px;color:#333;">${loginEmail}</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 40px 40px;">
    ${ctaButton(`${panelUrl}/dashboard`, 'Ir a mi panel')}
    <p style="margin:20px 0 0;font-size:13px;color:#888;line-height:1.6;">
      Desde tu panel administrás productos, pedidos, diseño y todo lo demás de tu tienda.
    </p>
    <p style="margin:20px 0 0;font-size:13px;color:#888;line-height:1.6;">
      <a href="https://www.gounuri.com" style="color:#101010;text-decoration:underline;font-weight:600;">Conocé gounuri.com</a>
      &nbsp;·&nbsp;
      <a href="${faqUrl}" style="color:#101010;text-decoration:underline;font-weight:600;">Preguntas frecuentes</a>
      <br/>
      <span style="color:#bbb;">¿Por qué mi tienda está vacía? ¿Por qué no funciona mi dominio? Está todo ahí.</span>
    </p>
  </td></tr>`)
}

// ── Restablecer contraseña (ver /api/auth/recuperar) ────────────────────────

export function emailRecuperarPassword({
  recoveryUrl,
}: {
  recoveryUrl: string
}): string {
  return layout(`
  <tr><td style="padding:40px 40px 32px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">Restablecer contraseña</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">¡Hola!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Recibimos un pedido para restablecer la contraseña de tu cuenta de <strong>gounuri</strong>. Hacé click para elegir una nueva:
    </p>
    ${ctaButton(recoveryUrl, 'Crear nueva contraseña')}
    <p style="margin:28px 0 0;font-size:12px;color:#bbb;line-height:1.6;">
      Si no pediste esto, podés ignorar este email — tu contraseña no cambia.<br>El link es válido por 1 hora.
    </p>
  </td></tr>`)
}
