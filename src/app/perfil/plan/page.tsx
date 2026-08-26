import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPlatformPaymentSettings } from '@/lib/platformBilling'
import PlanSelector from './PlanSelector'

export const dynamic = 'force-dynamic'

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id

  // Logueado pero sin tienda todavía (2026-08-26, pedido de ARam): quien
  // clickeó "Crear mi tienda" en la landing llega derecho acá vía
  // /api/auth/confirmar o /auth/callback (cookie gounuri_intent=pago, ver
  // @/lib/site) SIN tener tenant -- antes esto redirigía a /perfil sin
  // mostrar nada. Ahora se muestran las mismas tarjetas; "Pagar con
  // Mercado Pago" dispara /api/ir-a-plan (mismo mecanismo que ya usa la
  // sección de precios pública: recién se crea la tienda cuando el webhook
  // confirma el pago) en vez de /api/billing/subscribe, que necesita un
  // tenant existente -- ver PlanSelector.tsx (prop noTenantYet).
  if (!tenantId) {
    const paymentSettings = await getPlatformPaymentSettings(service)
    return (
      <main className="min-h-screen bg-zinc-50">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-6">
            <Link href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
              gounuri<span className="text-zinc-400">.com</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <PlanSelector
            currentPlan={null}
            trialing={false}
            paymentSettings={paymentSettings}
            billingTerm={null}
            nextBillingDate={null}
            mpPreapprovalId={null}
            billingPausedByUser={false}
            legacyManualBilling={false}
            paymentHistory={[]}
            noTenantYet
          />
        </div>
      </main>
    )
  }

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

  const paymentSettings = await getPlatformPaymentSettings(service)

  // Historial de pagos — ver memoria de proyecto "Gounuri billing/subscriptions".
  // Se alimenta del webhook (tópico "Pagos" de MP, todavía a activar a mano en
  // el dashboard) + el primer cobro que se registra al autorizarse el
  // preapproval. Si el tópico no está activo, esto puede venir vacío o
  // incompleto — PlanSelector ya maneja el caso de lista vacía sin mostrar
  // la sección.
  const { data: _charges } = await service
    .from('billing_charges')
    .select('id, amount, status, created_at, mp_payment_id, mp_preapproval_id')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(12)
  const paymentHistory = (_charges ?? []).map(c => ({
    id: String(c.id),
    amount: c.amount ?? 0,
    status: c.status ?? '',
    created_at: c.created_at,
    mpPaymentId: c.mp_payment_id ?? null,
    mpPreapprovalId: c.mp_preapproval_id ?? null,
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
        {/* Pantalla general de suscripcion (2026-08-26, pedido de ARam) --
            pensada como una landing/pricing page, no como el panel de
            gestion de la suscripcion de un tenant puntual (eso vive en
            Panel Admin /facturacion/suscripcion) -- por eso no muestra el
            nombre de la tienda ni el resumen de vencimiento/renovacion. */}
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
    </main>
  )
}
