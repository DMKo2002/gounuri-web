// POST /api/auth/registro — alta de cuenta para crear una tienda en gounuri.com.
//
// Mismo patrón que el registro mayorista de las tiendas (@creart/tienda-core
// /api/registro): Turnstile + admin.generateLink (en vez de signUp) para
// controlar nosotros el contenido del mail de confirmación y no depender del
// genérico de Supabase. La cuenta queda SIN sesión hasta que confirman el
// mail — generateLink nunca loguea al usuario en el browser.
//
// Los datos personales (nombre, apellido, DNI, celular, nombre de tienda
// elegido) se guardan en gounuri_accounts — tabla separada de customers
// (clientes de cada tienda) y de users (rol dentro del panel).

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, emailConfirmacionRegistro } from '@/lib/email'

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
    const { nombre, apellido, dni, celular, storeName, email, password, confirmar, turnstileToken } = body

    if (!nombre?.trim() || !apellido?.trim() || !dni?.trim() || !celular?.trim() || !storeName?.trim() || !email?.trim() || !password)
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

    // ¿Ya existe una cuenta de gounuri con este email? La fuente de verdad es
    // gounuri_accounts, no Supabase Auth (que no siempre distingue "ya existe"
    // por diseño de privacidad).
    const { data: existingRows } = await service
      .from('gounuri_accounts')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)
    if (existingRows?.[0]) {
      return NextResponse.json({ error: 'Ya existe una cuenta de gounuri con ese email. Iniciá sesión.' }, { status: 409 })
    }

    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const siteUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'signup',
      email: normalizedEmail,
      password,
      options: {
        redirectTo: `${siteUrl}/auth/verificar`,
        data: { full_name: `${nombre} ${apellido}`.trim() },
      },
    })

    if (linkError) {
      const msg = linkError.message ?? ''
      if (msg.includes('already registered') || msg.includes('email_exists') || msg.includes('already been registered')) {
        return NextResponse.json({ error: 'Ya existe una cuenta con ese email — puede ser de una compra anterior en alguna tienda de Gounuri. Iniciá sesión, o escribinos si el problema persiste.' }, { status: 409 })
      }
      return NextResponse.json({ error: linkError.message }, { status: 400 })
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

    const { error: insertErr } = await service.from('gounuri_accounts').insert({
      auth_user_id: linkData.user.id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      celular: celular.trim(),
      email: normalizedEmail,
      store_name: storeName.trim(),
    })

    if (insertErr) {
      console.error('[registro] error insertando gounuri_accounts:', insertErr.message)
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Ya existe una cuenta de gounuri con ese email. Iniciá sesión.' }, { status: 409 })
      }
      return NextResponse.json({ error: 'No se pudo completar el registro. Intentá de nuevo o contactanos.' }, { status: 500 })
    }

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Confirmá tu cuenta en gounuri',
      html: emailConfirmacionRegistro({ nombre: nombre.trim(), confirmationUrl }),
    }).catch(e => { console.error('[email confirmacion] error:', e); return { ok: false } })
    console.log(`[registro] email confirmacion a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[registro] error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
