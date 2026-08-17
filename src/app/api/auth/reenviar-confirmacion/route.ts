// POST /api/auth/reenviar-confirmacion — botón "Reenviar mail de
// confirmación" que aparece en /login cuando Supabase devuelve "Email not
// confirmed" (ver friendlyAuthError en lib/auth-error.ts). Antes de esto la
// única forma de reintentar era volver a llenar el form de /registro
// entero — ahora hay un botón directo debajo del error. Ver conversación
// 2026-08-17.
//
// Respuesta siempre genérica (mismo mensaje exista o no la cuenta, esté o
// no confirmada) para no revelar qué emails tienen cuenta. El rate limit
// propio de envío de emails de Supabase Auth alcanza como freno de abuso
// acá — no hace falta Turnstile para un botón de "reenviar".

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail, emailConfirmacionRegistro } from '@/lib/email'
import { generarLinkDeAcceso } from '@/lib/auth-links'

const MENSAJE_GENERICO = 'Si hay una cuenta pendiente de confirmar con ese email, te enviamos un link nuevo. Revisá tu casilla (y spam) en unos minutos.'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = body?.email

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Ingresá tu email.' }, { status: 400 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const service = createServiceClient()

    const { data: rows } = await service
      .from('gounuri_accounts')
      .select('id, confirmed_at')
      .eq('email', normalizedEmail)
      .limit(1)
    const existente = rows?.[0]

    // Ni cuenta pendiente de confirmar (ya confirmada, o nunca existió): no
    // hay nada que reenviar. Mismo mensaje que el caso "sí mandamos" para no
    // revelar si el mail existe.
    if (!existente || existente.confirmed_at) {
      return NextResponse.json({ ok: true, message: MENSAJE_GENERICO })
    }

    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const siteUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')

    const link = await generarLinkDeAcceso(service, normalizedEmail, siteUrl)
    if (link) {
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: 'Confirmá tu cuenta en gounuri',
        html: emailConfirmacionRegistro({ confirmationUrl: link.confirmationUrl }),
      }).catch(e => { console.error('[email confirmacion] error:', e); return { ok: false } })
      console.log(`[reenviar-confirmacion] a ${normalizedEmail}: ${emailResult.ok ? 'ENVIADO OK' : 'FALLO'}`)
    }

    return NextResponse.json({ ok: true, message: MENSAJE_GENERICO })
  } catch (err: any) {
    console.error('[reenviar-confirmacion] error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
