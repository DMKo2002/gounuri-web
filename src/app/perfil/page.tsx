import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, LayoutDashboard, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { PANEL_URL } from '@/lib/site'
import { isSuperAdmin } from '@/lib/superadmin'
import { SignOutButton, BajaButton } from './PerfilActions'

export const dynamic = 'force-dynamic'

const PLAN_NOMBRES: Record<string, string> = {
  free: 'Gratis',
  mini: 'Mini',
  standard: 'Standard',
  premium: 'Premium',
  basic: 'Standard', // legacy
}

const ESTADOS: Record<string, { label: string; clase: string }> = {
  active: { label: 'Al día', clase: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  past_due: { label: 'Pago pendiente', clase: 'bg-amber-50 border-amber-200 text-amber-700' },
  canceled: { label: 'Suscripción cancelada', clase: 'bg-zinc-100 border-zinc-200 text-zinc-600' },
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service.from('users').select('tenant_id, role').eq('id', user.id).limit(1)
  const tenantId = _rows?.[0]?.tenant_id

  if (!tenantId) {
    // Superadmin sin tenant propio: gounuri.com/perfil es para dueños de
    // tienda, no para el panel de administración de la plataforma.
    if (isSuperAdmin(user.email)) {
      return (
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <p className="text-zinc-600">
              Esta cuenta es de administrador de la plataforma — no tiene una tienda propia.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <a href={`${PANEL_URL}/superadmin`} className="text-sm font-medium text-zinc-900 underline underline-offset-2">
                Ir al panel de superadmin
              </a>
              <SignOutButton />
            </div>
          </div>
        </main>
      )
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="text-zinc-600">Tu cuenta no tiene una tienda asociada todavía.</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a href="/onboarding" className="text-sm font-medium text-zinc-900 underline underline-offset-2">
              Crear mi tienda
            </a>
            <SignOutButton />
          </div>
        </div>
      </main>
    )
  }

  const { data: _tenants } = await service
    .from('tenants')
    .select('name, slug, domain, plan, plan_status, template, created_at, mp_preapproval_id')
    .eq('id', tenantId)
    .limit(1)
  const tenant = _tenants?.[0]
  if (!tenant) return <main className="p-8 text-zinc-500">No se encontró la tienda.</main>

  const tiendaUrl = tenant.domain ? `https://${tenant.domain}` : `https://${tenant.slug}.gounuri.com`
  const planNombre = PLAN_NOMBRES[tenant.plan ?? ''] ?? 'Standard'
  const estado = tenant.plan_status ? ESTADOS[tenant.plan_status] : null
  const tieneSuscripcion = !!tenant.mp_preapproval_id && (tenant.plan_status === 'active' || tenant.plan_status === 'past_due')

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{tenant.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

        {tenant.plan_status === 'past_due' && (
          <div className="mt-6 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 sm:flex-row sm:items-center sm:justify-between">
            <span>Hay un pago pendiente de tu suscripción — evitá que se suspenda tu tienda.</span>
            <a
              href={`${PANEL_URL}/dashboard/uso`}
              className="shrink-0 rounded-lg bg-amber-600 px-4 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              Actualizar método de pago
            </a>
          </div>
        )}

        {/* Accesos */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={tiendaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-900 hover:shadow-sm"
          >
            <Store className="h-5 w-5 text-zinc-900" />
            <div>
              <p className="font-medium text-zinc-900">Ir a mi tienda</p>
              <p className="text-xs text-zinc-500">{tiendaUrl.replace('https://', '')}</p>
            </div>
            <ExternalLink className="ml-auto h-4 w-4 text-zinc-400" />
          </a>
          <a
            href={`${PANEL_URL}/dashboard`}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-900 hover:shadow-sm"
          >
            <LayoutDashboard className="h-5 w-5 text-zinc-900" />
            <div>
              <p className="font-medium text-zinc-900">Ir al Panel Admin</p>
              <p className="text-xs text-zinc-500">Productos, pedidos y configuración</p>
            </div>
            <ExternalLink className="ml-auto h-4 w-4 text-zinc-400" />
          </a>
        </div>

        {/* Datos */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">Mi cuenta</h2>
          </div>
          <dl className="divide-y divide-zinc-100">
            <Row label="Plan actual">
              <span className="font-medium text-zinc-900">{planNombre}</span>
              {estado && (
                <span className={`ml-2 rounded-full border px-2 py-0.5 text-[11px] font-medium ${estado.clase}`}>
                  {estado.label}
                </span>
              )}
              <a
                href={`${PANEL_URL}/dashboard/uso`}
                className="ml-2 text-xs font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
              >
                Cambiar de plan
              </a>
            </Row>
            <Row label="Template">
              <span className="capitalize text-zinc-900">{tenant.template ?? 'minimalista'}</span>
              <Link href="/templates" className="ml-2 text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600">
                ver todos
              </Link>
            </Row>
            <Row label="Dirección de la tienda">
              <span className="text-zinc-900">{tiendaUrl.replace('https://', '')}</span>
            </Row>
            <Row label="Tienda creada">
              <span className="text-zinc-900">
                {tenant.created_at
                  ? new Date(tenant.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </Row>
          </dl>
        </div>

        {/* Baja */}
        <div className="mt-8">
          {tieneSuscripcion ? (
            <BajaButton />
          ) : (
            <p className="text-xs text-zinc-400">
              No tenés una suscripción con débito automático activa.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}
