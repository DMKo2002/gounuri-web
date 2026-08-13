import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import DatosTiendaForm from './DatosTiendaForm'

export const dynamic = 'force-dynamic'

// Mismos campos que Panel Admin > Contacto y Redes (Panel Admin/src/app/
// dashboard/contacto/page.tsx) — misma tabla (store_config), mismo tenant,
// así que editar acá o allá es lo mismo dato. Se agregó para que el dueño
// pueda cargar esto sin tener que entrar al Panel Admin.
export default async function DatosTiendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) redirect('/perfil')

  const { data: _tenants } = await service.from('tenants').select('name').eq('id', tenantId).limit(1)
  const tenant = _tenants?.[0]
  if (!tenant) return <main className="p-8 text-zinc-500">No se encontró la tienda.</main>

  const { data: _configs } = await service
    .from('store_config')
    .select('id, whatsapp_number, notification_email, instagram_url, facebook_url, tiktok_url, pickup_address, branches')
    .eq('tenant_id', tenantId)
    .limit(1)
  const config = _configs?.[0]
  if (!config) return <main className="p-8 text-zinc-500">No se encontró la configuración de la tienda.</main>

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
          <Link href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900">Mi cuenta</Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Datos de contacto</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {tenant.name} — esto aparece en el pie de tu tienda, la página de contacto y los PDFs de envío.
          También se puede editar desde el Panel Admin en Personalización → Contacto y Redes.
        </p>

        <div className="mt-8">
          <DatosTiendaForm
            configId={config.id}
            initial={{
              whatsapp: config.whatsapp_number ?? '',
              email: config.notification_email ?? '',
              instagram: config.instagram_url ?? '',
              facebook: config.facebook_url ?? '',
              tiktok: config.tiktok_url ?? '',
              pickupAddress: config.pickup_address ?? '',
              branches: Array.isArray(config.branches) ? config.branches : [],
            }}
          />
        </div>
      </div>
    </main>
  )
}
