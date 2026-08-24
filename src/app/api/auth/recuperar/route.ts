// POST /api/auth/recuperar — envía un mail para restablecer la contraseña de
// una cuenta de gounuri.com. Mismo patrón que /api/auth/registro y
// /api/auth/reenviar-confirmacion: admin.generateLink server-side + Resend (no
// el mail genérico de Supabase), y respuesta SIEMPRE genérica para no revelar
// qué emails tienen cuenta.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, emailRecuperarPassword } from '@/lib/email'

const MENSAJE_GENERICO =
  'Si hay una cuenta con ese email, te enviamos un link para restablecer tu contraseña. Revisá tu casilla (y spam) en unos minutos.'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = body?.email
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Ingresá tu email.' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const service = createServiceClient()

    // Fuente de verdad: la cuenta de dueño existe y ya confirmó en
    // gounuri_accounts. Si no existe o nunca confirmó, no hay contraseña que
    // restablecer — respondemos genérico igual, para no revelar el email.
    const { data: rows } = await service
      .from('gounuri_accounts')
      .select('id, confirmed_at')
      .eq('email', normalizedEmail)
      .limit(1)
    const cuenta = rows?.[0]

    if (!cuenta || !cuenta.confirmed_at) {
      return NextResponse.json({ ok: true, message: MENSAJE_GENERICO })
    }

    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const siteUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

    const { data: linkData, error: linkError } = await service.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${siteUrl}/recuperar/confirmar` },
    })

    if (linkError || !linkData?.properties) {
      console.error('[recuperar] generateLink error:', linkError?.message)
      return NextResponse.json({ ok: true, message: MENSAJE_GENERICO }) // no revelar
    }

    const hashedToken = linkData.properties.hashed_token
    const recoveryUrl = hashedToken
      ? `${siteUrl}/recuperar/confirmar?token_hash=${encodeURIComponent(hashedToken)}&type=recovery`
      : linkData.properties.action_link ?? siteUrl

    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: 'Restablecé tu contraseña en gounuri',
      html: emailRecuperarPassword({ recoveryUrl }),
    }).catch(e => { console.error('[email recuperar] error:', e); return { ok: false } })
    console.log(`[recuperar] a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)

    return NextResponse.json({ ok: true, message: MENSAJE_GENERICO })
  } catch (err: any) {
    console.error('[recuperar] error:', err?.message ?? err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
