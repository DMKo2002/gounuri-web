import type { MetadataRoute } from 'next'

// robots.txt dinamico de gounuri.com (convencion Next.js App Router, se
// sirve solo en /robots.txt). Bloquea rutas de API y de flujo
// privado/transaccional post-login que no aportan nada indexadas y solo
// gastan crawl budget; todo el resto (home, templates, faq, registro,
// login, legales) queda abierto.
export default function robots(): MetadataRoute.Robots {
  const base = 'https://gounuri.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/onboarding', '/perfil', '/recuperar', '/auth/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
