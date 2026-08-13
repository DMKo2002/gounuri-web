// POST /api/perfil/datos — actualiza los datos personales opcionales del
// dueño (nombre, apellido, DNI, CUIT, empresa, celular) en gounuri_accounts.
//
// gounuri_accounts NO tiene ningún GRANT a anon/authenticated (a propósito,
// tiene DNI/CUIT — ver migración gounuri_accounts_optional_fields_and_trigger),
// así que a diferencia de /perfil/tienda (que escribe store_config directo
// desde el browser) esto tiene que pasar por una ruta server-side con
// service role, verificando acá mismo que el usuario solo pueda tocar su
// propia fila (auth_user_id = user.id).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { nombre, apellido, dni, cuit, empresa, celular } = body

  const service = createServiceClient()
  // upsert en vez de update: por las dudas de que el trigger no haya llegado
  // a crear la fila todavía (cuenta muy vieja, carrera rara), así no falla
  // en silencio — el email va siempre para no violar el NOT NULL si es un
  // insert nuevo.
  const { error } = await service
    .from('gounuri_accounts')
    .upsert({
      auth_user_id: user.id,
      email: user.email,
      nombre: nombre?.trim() || null,
      apellido: apellido?.trim() || null,
      dni: dni?.trim() || null,
      cuit: cuit?.trim() || null,
      empresa: empresa?.trim() || null,
      celular: celular?.trim() || null,
    }, { onConflict: 'auth_user_id' })

  if (error) {
    console.error('[perfil/datos] error guardando:', error.message)
    return NextResponse.json({ error: 'No se pudo guardar. Reintentá o escribinos.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
