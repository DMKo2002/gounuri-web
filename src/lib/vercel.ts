// Alta del dominio {slug}.gounuri.com en Vercel al crear un tenant.
//
// El middleware compartido (tienda-core/src/middleware.ts) ya sabe resolver
// CUALQUIER hostname *.gounuri.com contra tenants.slug — pero eso solo sirve
// si Vercel efectivamente le manda tráfico a algún proyecto para ese
// hostname. Sin este alta, {slug}.gounuri.com no está registrado en ningún
// proyecto y la URL no resuelve (bug encontrado 2026-08-12: el email de
// bienvenida y el panel prometen "tuslug.gounuri.com siempre funciona" pero
// nadie lo daba de alta en Vercel).
//
// Copia reducida de Panel Admin/src/lib/vercel.ts (misma cuenta de Vercel,
// mismos proyectos) — acá solo hace falta agregar el dominio, no toda la
// gestión de dominios propios (eso vive en el Panel Admin).

const VERCEL_API = 'https://api.vercel.com'

export const TEMPLATE_PROJECT_IDS: Record<string, string> = {
  minimalista: 'prj_oFrOvv350PGVvze23LEzthdgEJ7C',
  mono: 'prj_VEJBBp29Kaetf9kPrkGHjfQaLAtm',
  atelier: 'prj_Nn1TWSkkRzpvWascAkLn0TyCrsGR',
  axis: 'prj_kc2k00wA0zW738nTLynxtERZvFgG',
  glow: 'prj_eZ4GW1Ntepw9ffwy3WB8PVsC7RYk',
  bazaar: 'prj_dW7DmOnprm7ue304lhl3VMfqfyn8',
}

function vercelHeaders(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new Error('[vercel] Falta VERCEL_TOKEN en las variables de entorno')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function teamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID
  return teamId ? `?teamId=${teamId}` : ''
}

// Best-effort: agrega {slug}.gounuri.com al proyecto de Vercel del template
// elegido. Si el dominio ya estaba agregado (409 domain_already_in_use en
// este mismo proyecto), lo tratamos como éxito — no como error.
export async function addSlugDomain(template: string, slug: string): Promise<void> {
  const projectId = TEMPLATE_PROJECT_IDS[template]
  if (!projectId) throw new Error(`[vercel] Template desconocido o sin proyecto de Vercel mapeado: "${template}"`)

  const domain = `${slug}.gounuri.com`
  const res = await fetch(`${VERCEL_API}/v10/projects/${projectId}/domains${teamQuery()}`, {
    method: 'POST',
    headers: vercelHeaders(),
    body: JSON.stringify({ name: domain }),
  })
  if (res.ok) return

  const json = await res.json().catch(() => ({}))
  if (json?.error?.code === 'domain_already_in_use' && json?.error?.projectId === projectId) return

  throw new Error(json?.error?.message || `Error agregando ${domain} en Vercel (HTTP ${res.status})`)
}
