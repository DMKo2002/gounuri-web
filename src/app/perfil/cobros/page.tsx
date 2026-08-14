import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import CobrosForm from './CobrosForm'

export const dynamic = 'force-dynamic'

// CBU/alias donde el tenant recibe la plata de transferencias de sus
// clientes — mismos campos que Panel Admin > Pagos y Finanzas >
// Transferencia bancaria (Panel Admin/src/app/dashboard/pagos/page.tsx),
// misma tabla (store_config), así que es el mismo dato en los dos lados.
export default async function CobrosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) redirect('/perfil')

  const { data: _configs } = await service
    .from('store_config')
    .select('id, transfer_enabled, transfer_cbu, transfer_alias')
    .eq('tenant_id', tenantId)
    .limit(1)
  const config = _configs?.[0]
  if (!config) return <main className="p-8 text-zinc-500">No se encontró la configuración de la tienda.</main>

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
          {/* <a> normal, no <Link> — vuelve con un request nuevo al server,
              así el popup de CBU (que depende de datos recién guardados acá)
              no se queda con la versión vieja cacheada del lado del cliente. */}
          <a href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </a>
          <span className="text-zinc-300">/</span>
          <a href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900">Mi cuenta</a>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Cómo cobrás por transferencia</h1>
        <p className="mt-1 text-sm text-zinc-500">
          El CBU o alias donde tus clientes te transfieren cuando eligen pagar así en el checkout.
          Vos confirmás cada pago a mano desde Pedidos, en el Panel Admin.
        </p>

        <div className="mt-8">
          <CobrosForm
            configId={config.id}
            initial={{
              transferEnabled: !!config.transfer_enabled,
              cbu: config.transfer_cbu ?? '',
              alias: config.transfer_alias ?? '',
            }}
          />
        </div>

        {/* Siguiente paso del setup inicial — sin esto quien viene del popup
            de "empezamos a configurar tu tienda" se quedaba sin salida. */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-900">Siguiente: datos de contacto</p>
            <p className="text-xs text-zinc-500">WhatsApp, redes y sucursales para el pie de tu tienda.</p>
          </div>
          <a
            href="/perfil/tienda"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Continuar
          </a>
        </div>
        <div className="mt-3 text-center">
          <a href="/perfil" className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
            Prefiero hacerlo más tarde — volver a Mi cuenta
          </a>
        </div>
      </div>
    </main>
  )
}
