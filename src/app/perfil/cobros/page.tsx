import { redirect } from 'next/navigation'
import Link from 'next/link'
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
          <Link href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900">Mi cuenta</Link>
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
      </div>
    </main>
  )
}
