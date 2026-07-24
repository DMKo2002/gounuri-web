# gounuri-web

Landing pública de **gounuri.com** — la cara visible de la plataforma. Estética negro/blanco estilo Vercel.

## Qué es

Next.js 14 App Router + Tailwind. Sitio estático (sin Supabase): el registro y el login viven en el Panel Admin, esta landing solo linkea (`NEXT_PUBLIC_PANEL_URL`).

## Estructura

- `src/app/page.tsx` — home (compone las secciones)
- `src/components/` — Navbar, Hero, Features, ComoFunciona, Pricing, CTA, Footer
- `src/lib/site.ts` — URLs del panel y datos de los 3 planes (un solo lugar para editar precios/features)

## Variables de entorno (Vercel)

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_PANEL_URL` | URL del Panel Admin desplegado, sin barra final |

## Deploy

1. Crear repo en GitHub y pushear `main`
2. Vercel → New Project → importar el repo (framework: Next.js, defaults)
3. Agregar `NEXT_PUBLIC_PANEL_URL` en Settings → Environment Variables
4. Settings → Domains → agregar `gounuri.com` y `www.gounuri.com`, y apuntar el DNS del dominio según lo que indique Vercel (A `76.76.21.21` / CNAME `cname.vercel-dns.com`)

## Pendientes (fases siguientes)

- Banner/screenshot real en el hero (etapa de diseño)
- Página `/tutorial` con demo interactiva split-screen del Panel Admin
- Precios reales + membresía con MercadoPago (límites por plan: 50/200/500 productos)
