import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantUsage } from '@/lib/usage'
import { billingEnabled } from '@/lib/billing'
import PlanSelector from './PlanSelector'
import UsageBars from './UsageBars'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id
  if (!tenantId) redirect('/perfil')

  const { data: _tenants } = await service
    .from('tenants')
    .select('name, plan, plan_status, status')
    .eq('id', tenantId)
    .limit(1)
  const tenant = _tenants?.[0]
  if (!tenant) return <main className="p-8 text-zinc-500">No se encontró la tienda.</main>

  // Mismo criterio que Panel Admin/src/lib/usage.ts: en trial (plan_status
  // sigue en 'trial' tanto en el período gratis como en la gracia post-trial,
  // solo cambia recién cuando el webhook confirma el primer pago) o
  // suspendida, el botón del plan actual debe permitir "activarlo", no
  // aparecer deshabilitado como si ya estuviera pago.
  const trialing = tenant.plan_status === 'trial' || tenant.status === 'suspended'
  const currentPlan = tenant.plan ?? 'standard'

  const usage = await getTenantUsage(service, tenantId, currentPlan)

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
          <Link href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900">Mi cuenta</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-zinc-500">{tenant.name}</p>

        <div className="mt-6">
          <UsageBars usage={usage} />
        </div>

        <div className="mt-8">
          <PlanSelector currentPlan={currentPlan} trialing={trialing} billingEnabled={billingEnabled()} />
        </div>
      </div>
    </main>
  )
}
