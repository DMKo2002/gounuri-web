// GET /api/mi-tienda — redirige a la tienda del usuario logueado.
// Lo usa el botón "Ir a mi tienda" del navbar (el slug se resuelve acá,
// server-side, para no exponer queries de tenants al browser).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  const origin = new URL(req.url).origin

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) return NextResponse.redirect(`${origin}/perfil`)

  const { data: _tenants } = await service.from('tenants').select('slug, domain').eq('id', tenantId).limit(1)
  const tenant = _tenants?.[0]
  if (!tenant) return NextResponse.redirect(`${origin}/perfil`)

  const url = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.gounuri.com`
  return NextResponse.redirect(url)
}
