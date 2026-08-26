import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getTenantUsage } from '@/lib/usage'
import { getPlatformPaymentSettings } from '@/lib/platformBilling'
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
    .select('name, plan, plan_status, status, billing_term, next_billing_date, mp_preapproval_id, billing_paused_by_user, legacy_manual_billing')
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
  const paymentSettings = await getPlatformPaymentSettings(service)

  // Historial de pagos — ver memoria de proyecto "Gounuri billing/subscriptions".
  // Se alimenta del webhook (tópico "Pagos" de MP, todavía a activar a mano en
  // el dashboard) + el primer cobro que se registra al autorizarse el
  // preapproval. Si el tópico no está activo, esto puede venir vacío o
  // incompleto — PlanSelector ya maneja el caso de lista vacía sin mostrar
  // la sección.
  const { data: _charges } = await service
    .from('billing_charges')
    .select('id, amount, status, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(12)
  const paymentHistory = (_charges ?? []).map(c => ({
    id: String(c.id),
    amount: c.amount ?? 0,
    status: c.status ?? '',
    created_at: c.created_at,
  }))

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

        {/* Las tarjetas de plan van primero (2026-08-26, pedido de ARam) — esta
            pantalla es para elegir/suscribir un plan, el uso del mes es
            secundario acá. */}
        <div className="mt-6">
          <PlanSelector
            currentPlan={currentPlan}
            trialing={trialing}
            paymentSettings={paymentSettings}
            billingTerm={tenant.billing_term ?? null}
            nextBillingDate={tenant.next_billing_date ?? null}
            mpPreapprovalId={tenant.mp_preapproval_id ?? null}
            billingPausedByUser={tenant.billing_paused_by_user ?? false}
            legacyManualBilling={tenant.legacy_manual_billing ?? false}
            paymentHistory={paymentHistory}
          />
        </div>

        <div className="mt-8">
          <UsageBars usage={usage} />
        </div>
      </div>
    </main>
  )
}
