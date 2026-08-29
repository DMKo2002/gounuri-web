import type { MetadataRoute } from 'next'

// Sitemap dinamico de gounuri.com (la landing/marketing, no las tiendas de
// los tenants). Google/Search Console lo lee en /sitemap.xml automaticamente
// (convencion de Next.js App Router, no hace falta registrar la ruta).
//
// Solo van aca las paginas de contenido publico pensadas para descubrimiento
// organico. Las de flujo transaccional/privado (/registro, /login,
// /onboarding, /perfil, /recuperar) quedan afuera a proposito -- no aportan
// valor de busqueda y generarian contenido "fino" duplicado en el indice.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.gounuri.com'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/templates`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/migracion`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/migracion/formulario`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
