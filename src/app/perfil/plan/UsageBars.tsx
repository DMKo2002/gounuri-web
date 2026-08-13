import type { TenantUsage } from '@/lib/usage'

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
  return `${Math.round(mb)} MB`
}

function Bar({ label, value, limit, pct, formatValue }: { label: string; value: number; limit: number; pct: number; formatValue: (n: number) => string }) {
  const clamped = Math.min(pct, 100)
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-zinc-900'
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-zinc-600">{label}</span>
        <span className="text-zinc-900">{formatValue(value)} <span className="text-zinc-400">/ {formatValue(limit)}</span></span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

export default function UsageBars({ usage }: { usage: TenantUsage }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Uso este mes</h2>
      <div className="mt-4 space-y-4">
        <Bar label="Almacenamiento" value={usage.storageMB} limit={usage.storageLimitMB} pct={usage.storagePct} formatValue={formatMB} />
        <Bar label="Productos" value={usage.productCount} limit={usage.productLimit} pct={usage.productPct} formatValue={n => Math.round(n).toLocaleString('es-AR')} />
        <Bar label="Visitas" value={usage.visitCount} limit={usage.visitLimit} pct={usage.visitPct} formatValue={n => Math.round(n).toLocaleString('es-AR')} />
      </div>
    </div>
  )
}
