// Uso del tenant (storage, productos, visitas) para mostrar en /perfil/plan
// — versión de solo lectura de Panel Admin/src/lib/usage.ts (getTenantUsage).
// A propósito NO escribe nada (over_limit_since, limit_warned_at, etc.) —
// esos efectos (gracia por exceso, suspensión) los sigue manejando
// exclusivamente el cron de Panel Admin (/api/cron/enforce); acá es solo
// para pintar los mismos números en gounuri.com.
//
// Los límites por plan están duplicados de Panel Admin/src/lib/plans.ts (no
// vale la pena traer todo ese archivo solo por 3 números) — si cambian los
// límites allá, hay que actualizar acá también.

import type { SupabaseClient } from '@supabase/supabase-js'

interface PlanLimits {
  storageMB: number
  maxProductos: number
  visitasMes: number
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:     { storageMB: 150,   maxProductos: 30,  visitasMes: 5_000 },
  mini:     { storageMB: 300,   maxProductos: 50,  visitasMes: 15_000 },
  standard: { storageMB: 1_024, maxProductos: 300, visitasMes: 75_000 },
  premium:  { storageMB: 3_072, maxProductos: 600, visitasMes: 300_000 },
}

function limitsForPlan(plan?: string | null): PlanLimits {
  if (plan && plan in PLAN_LIMITS) return PLAN_LIMITS[plan]
  return PLAN_LIMITS.standard // legacy ('basic', null, etc.)
}

export interface TenantUsage {
  storageMB: number
  storageLimitMB: number
  storagePct: number
  productCount: number
  productLimit: number
  productPct: number
  visitCount: number
  visitLimit: number
  visitPct: number
}

export async function getTenantUsage(service: SupabaseClient, tenantId: string, plan?: string | null): Promise<TenantUsage> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthKey = monthStart.toISOString().slice(0, 10)

  const [storageRes, productsRes, visitsRes] = await Promise.all([
    service.rpc('tenant_storage_bytes', { tid: tenantId }),
    service.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    service.from('tenant_visits').select('count').eq('tenant_id', tenantId).eq('month', monthKey).limit(1),
  ])

  const limits = limitsForPlan(plan)
  const storageMB = Number(storageRes.data ?? 0) / (1024 * 1024)
  const productCount = productsRes.count ?? 0
  const visitCount = Number(visitsRes.data?.[0]?.count ?? 0)

  return {
    storageMB,
    storageLimitMB: limits.storageMB,
    storagePct: (storageMB / limits.storageMB) * 100,
    productCount,
    productLimit: limits.maxProductos,
    productPct: (productCount / limits.maxProductos) * 100,
    visitCount,
    visitLimit: limits.visitasMes,
    visitPct: (visitCount / limits.visitasMes) * 100,
  }
}
