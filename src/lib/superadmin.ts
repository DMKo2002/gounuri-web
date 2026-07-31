// Espejo de "Panel Admin/src/lib/superadmin.ts" — mismo criterio, mismo env
// var. Server-only (usado desde Server Components, no lleva NEXT_PUBLIC_).
// Si SUPERADMIN_EMAILS no está seteada en el proyecto de Vercel de
// gounuri-web, cae al mismo default que el Panel.
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.SUPERADMIN_EMAILS ?? 'dmko2002@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase())
  return list.includes(email.toLowerCase())
}
