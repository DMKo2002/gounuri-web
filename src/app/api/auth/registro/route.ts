// POST /api/auth/registro — alta de cuenta para crear una tienda en gounuri.com.
//
// Mismo patrón que el registro mayorista de las tiendas (@creart/tienda-core
// /api/registro): Turnstile + admin.generateLink (en vez de signUp) para
// controlar nosotros el contenido del mail de confirmación y no depender del
// genérico de Supabase. La cuenta queda SIN sesión hasta que confirman el
// mail — generateLink nunca loguea al usuario en el browser.
//
// Simplificado 2026-08-13: ya no pide nombre/apellido/DNI/celular/nombre de
// tienda acá — solo mail+contraseña (esos datos opcionales se completan
// después desde /perfil/datos). La fila en gounuri_accounts (tabla separada
// de customers y de users) la crea sola el trigger
// handle_new_gounuri_account() apenas se crea el auth.users — no hace falta
// insertarla a mano acá.
//
// 2026-08-17 (a): auth.users es una sola base de Auth compartida entre
// gounuri.com y TODAS las tiendas de los tenants — si alguien ya compró en
// alguna tienda con este mail, generateLink(type:'signup') falla con
// "already registered" aunque nunca haya sido dueño de tienda (gounuri_
// accounts, chequeado arriba, sigue vacío para ese mail). Para esos casos,
// en vez de bloquear, vincularCuentaExistente() engancha un perfil de
// gounuri_accounts a esa misma cuenta de Auth ya existente.
//
// 2026-08-17 (b): el chequeo de "¿ya existe fila en gounuri_accounts?" de
// arriba bloqueaba SIEMPRE con "iniciá sesión", incluso cuando esa fila
// quedó a medio confirmar (confirmed_at null — típicamente porque el mail
// falló al enviarse, ej. RESEND_API_KEY sin configurar en su momento). Esas
// cuentas quedaban sin salida: no pueden loguearse (nunca confirmaron) ni
// reintentar el registro (siempre 409). Ahora, si la fila existe pero no
// está confirmada, reenviarConfirmacion() manda un link nuevo en vez de
// bloquear.

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, emailConfirmacionRegistro, emailCuentaVinculada } from '@/lib/email'

// Genera un magic link sobre una cuenta de Auth YA EXISTENTE (a diferencia
// de generateLink(type:'signup'), no crea un auth.users nuevo) y arma
// nuestra propia URL de /auth/verificar a partir del hashed_token — mismo
// patrón que el link de confirmación del signup normal, pero sirve tanto
// para "reenviar confirmación" (misma persona, mismo registro) como para
// "enganchar cuenta existente" (identidad de Auth compartida con una
// tienda de un tenant, ver comentario 2026-08-17(a) arriba).
async function generarLinkDeAcceso(
  service: ReturnType<typeof createServiceClient>,
  normalizedEmail: string,
  siteUrl: string,
): Promise<{ userId: string; confirmationUrl: string } | null> {
  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}/auth/verificar` },
  })

  if (error || !data?.user) {
    console.error('[registro] no se pudo generar magic link:', error?.message)
    return null
  }

  const hashedToken = data.properties?.hashed_token
  const confirmationUrl = hashedToken
    ? `${siteUrl}/auth/verificar?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
    : data.properties?.action_link

  if (!confirmationUrl) {
    console.error('[registro] magic link sin hashed_token ni action_link para', normalizedEmail)
    return null
  }

  return { userId: data.user.id, confirmationUrl }
}

// Caso "el email ya existe en auth.users, pero no es dueño de tienda
// todavía" — ver comentario 2026-08-17(a) arriba. No tocamos la contraseña
// actual de la cuenta (la que puso en este form se descarta sin usar):
// probamos que es dueño del mail con el magic link, igual de seguro que el
// link de confirmación del signup normal.
async function vincularCuentaExistente(
  service: ReturnType<typeof createServiceClient>,
  normalizedEmail: string,
  siteUrl: string,
): Promise<NextResponse> {
  const link = await generarLinkDeAcceso(service, normalizedEmail, siteUrl)
  if (!link) {
    return NextResponse.json(
      { error: 'Ya existe una cuenta con ese email. Iniciá sesión, o escribinos si el problema persiste.' },
      { status: 409 },
    )
  }

  // Misma fila mínima que insertaría el trigger handle_new_gounuri_account()
  // si el auth.users se hubiera creado recién (acá no se crea uno nuevo,
  // así que el trigger no corre — hay que insertarla a mano). upsert +
  // ignoreDuplicates por las dudas de una doble confirmación en paralelo.
  const { error: insertError } = await service
    .from('gounuri_accounts')
    .upsert({ auth_user_id: link.userId, email: normalizedEmail }, { onConflict: 'auth_user_id', ignoreDuplicates: true })

  if (insertError) {
    console.error('[registro] error vinculando gounuri_accounts a cuenta existente:', insertError.message)
    return NextResponse.json({ error: 'Error al vincular la cuenta. Intentá de nuevo.' }, { status: 500 })
  }

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: 'Ya podés crear tu tienda en gounuri',
    html: emailCuentaVinculada({ confirmationUrl: link.confirmationUrl }),
  }).catch(e => { console.error('[email cuenta-vinculada] error:', e); return { ok: false } })
  console.log(`[registro] email cuenta-vinculada a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)

  return NextResponse.json({ ok: true })
}

// Caso "ya había una fila de gounuri_accounts para este mail, pero nunca
// confirmó" — ver comentario 2026-08-17(b) arriba. Reenvía el link de
// confirmación en vez de dejar la cuenta sin salida.
async function reenviarConfirmacion(
  service: ReturnType<typeof createServiceClient>,
  normalizedEmail: string,
  siteUrl: string,
): Promise<NextResponse> {
  const link = await generarLinkDeAcceso(service, normalizedEmail, siteUrl)
  if (!link) {
    return NextResponse.json(
      { error: 'No pudimos reenviar el mail de confirmación. Probá de nuevo en unos minutos, o escribinos si el problema persiste.' },
      { status: 500 },
    )
  }

  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: 'Confirmá tu cuenta en gounuri',
    html: emailConfirmacionRegistro({ confirmationUrl: link.confirmationUrl }),
  }).catch(e => { console.error('[email confirmacion] error:', e); return { ok: false } })
  console.log(`[registro] reenvío confirmación a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)

  return NextResponse.json({ ok: true })
}

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) { console.warn('[registro] TURNSTILE_SECRET_KEY no configurada — captcha sin validar'); return true }
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await res.json()
  return data.success === true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, confirmar, turnstileToken } = body

    if (!email?.trim() || !password)
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    if (password !== confirmar)
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    if (password.length < 8)
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    if (!turnstileToken)
      return NextResponse.json({ error: 'Completá la verificación de seguridad' }, { status: 400 })
    if (!(await verifyTurnstile(turnstileToken)))
      return NextResponse.json({ error: 'Verificación de seguridad fallida. Intentá de nuevo.' }, { status: 400 })

    const normalizedEmail = String(email).trim().toLowerCase()
    const service = createServiceClient()

    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const siteUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

    // ¿Ya existe una cuenta de gounuri con este email? La fuente de verdad es
    // gounuri_accounts, no Supabase Auth (que no siempre distingue "ya existe"
    // por diseño de privacidad). Si existe pero nunca confirmó el mail
    // (confirmed_at null), reenviamos el link en vez de bloquear sin salida
    // — ver comentario 2026-08-17(b) arriba.
    const { data: existingRows } = await service
      .from('gounuri_accounts')
      .select('id, confirmed_at')
      .eq('email', normalizedEmail)
      .limit(1)
    const existente = existingRows?.[0]
    if (existente) {
      if (existente.confirmed_at) {
        return NextResponse.json({ error: 'Ya existe una cuenta de gounuri con ese email. Iniciá sesión.' }, { status: 409 })
      }
      return await reenviarConfirmacion(service, normalizedEmail, siteUrl)
    }

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password,
      options: {
        redirectTo: `${siteUrl}/auth/verificar`,
      },
    })

    if (linkError) {
      const msg = linkError.message ?? ''
      const yaExisteEnAuth = msg.includes('already registered') || msg.includes('email_exists') || msg.includes('already been registered')
      if (!yaExisteEnAuth) {
        return NextResponse.json({ error: linkError.message }, { status: 400 })
      }

      // El email ya tiene una cuenta de Auth, pero recién arriba confirmamos
      // que NO tiene fila en gounuri_accounts — o sea que esta identidad es
      // de alguien que compró en alguna tienda de un tenant (auth.users es
      // una sola base compartida entre gounuri.com y todas las tiendas), no
      // un dueño de tienda repitiendo el registro. En vez de bloquearlo,
      // enganchamos un perfil de gounuri_accounts a esa MISMA cuenta de
      // Auth (mismo login de siempre) en vez de crear una cuenta nueva —
      // así puede ser cliente de una tienda y dueño de la suya con el mismo
      // mail. Ver comentario 2026-08-17(a) arriba.
      return await vincularCuentaExistente(service, normalizedEmail, siteUrl)
    }
    if (!linkData?.user) {
      return NextResponse.json({ error: 'Error al crear la cuenta. Intentá de nuevo.' }, { status: 500 })
    }

    // hashed_token + nuestra propia URL de verificación → todo server-side,
    // sin depender del action_link de Supabase (llega con tokens en el hash
    // de la URL, que un route handler no puede leer).
    const hashedToken = linkData.properties?.hashed_token
    const confirmationUrl = hashedToken
      ? `${siteUrl}/auth/verificar?token_hash=${encodeURIComponent(hashedToken)}&type=signup`
      : linkData.properties?.action_link

    if (!confirmationUrl) {
      return NextResponse.json({ error: 'Error al generar el link de confirmación. Intentá de nuevo.' }, { status: 500 })
    }

    // La fila de gounuri_accounts (auth_user_id, email) la crea sola el
    // trigger handle_new_gounuri_account() al insertarse el auth.users de
    // arriba (generateLink ya lo crea, aunque quede sin confirmar) — no hace
    // falta insertarla a mano acá.

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Confirmá tu cuenta en gounuri',
      html: emailConfirmacionRegistro({ confirmationUrl }),
    }).catch(e => { console.error('[email confirmacion] error:', e); return { ok: false } })
    console.log(`[registro] email confirmacion a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[registro] error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
