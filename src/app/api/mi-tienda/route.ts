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

  const { data: _tenants } = await service.from('tenants').select('slug, domain, domain_status').eq('id', tenantId).limit(1)
  const tenant = _tenants?.[0]
  if (!tenant) return NextResponse.redirect(`${origin}/perfil`)

  // Ojo: tenant.domain puede estar seteado (lo tipeó en el onboarding, o está
  // "pending" desde Configuración > Dominio) sin que el DNS esté configurado
  // todavía — solo redirigir ahí si Vercel ya lo confirmó como verified.
  // Si no, siempre hay algo en vivo en slug.gounuri.com.
  const url = tenant.domain && tenant.domain_status === 'verified'
    ? `https://${tenant.domain}`
    : `https://${tenant.slug}.gounuri.com`
  return NextResponse.redirect(url)
}
