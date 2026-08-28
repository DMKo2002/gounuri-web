// GET /api/check-nombre?name=... — chequeo liviano de disponibilidad del
// nombre de tienda, para avisar en el paso 1 del onboarding ANTES de que el
// dueño complete el resto del formulario (template, contacto, pagos, plan).
//
// Antes esto solo se sabía recién en el POST final a /api/create-tenant o
// /api/finalizar-tienda (409 si el slug ya existe) — el dueño llegaba hasta
// el último paso del onboarding para recién ahí enterarse de que el nombre
// ya estaba en uso. Reportado por David 2026-08-28.
//
// Solo lectura, no reserva el nombre — sigue existiendo una ventana chica
// entre este chequeo y el POST real donde otra persona podría tomar el
// mismo nombre (ver el 23505/409 que ya maneja create-tenant para ese
// caso). Misma normalización de slug que create-tenant/finalizar-tienda —
// si se cambia acá, cambiar en los tres lugares.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const name = url.searchParams.get('name') ?? ''
  if (!name.trim()) return NextResponse.json({ available: true })

  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    || 'tienda'

  try {
    const service = createServiceClient()
    const { data } = await service.from('tenants').select('id').eq('slug', slug).limit(1)
    return NextResponse.json({ available: !data?.[0], slug })
  } catch (e) {
    console.error('[check-nombre] error:', e)
    // Si el chequeo falla, no bloqueamos al usuario en el paso 1 — el POST
    // final a create-tenant/finalizar-tienda igual valida esto con un 409.
    return NextResponse.json({ available: true })
  }
}
