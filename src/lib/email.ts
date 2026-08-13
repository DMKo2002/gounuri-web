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
  <tr><td style="background:#101010;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.01em;">
      <span style="color:#fff;">gounuri</span><span style="color:#767676;">.com</span>
    </p>
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

// ── Bienvenida con datos de la tienda creada ────────────────────────────────

export function emailBienvenidaTienda({
  nombre,
  storeName,
  storeUrl,
  panelUrl,
  loginEmail,
  planNombre,
  trialDays,
}: {
  nombre: string
  storeName: string
  storeUrl: string
  panelUrl: string
  loginEmail: string
  planNombre: string
  trialDays: number
}): string {
  return layout(`
  <tr><td style="padding:40px 40px 8px;">
    <p style="margin:0 0 18px;font-size:12px;color:#999;letter-spacing:0.1em;text-transform:uppercase;">¡Ya está lista!</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#101010;line-height:1.3;">Bienvenido/a, ${nombre}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Tu tienda <strong>${storeName}</strong> ya está creada, con <strong>${trialDays} días gratis</strong> del plan ${planNombre} para probarla sin tarjeta.
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
  </td></tr>`)
}
