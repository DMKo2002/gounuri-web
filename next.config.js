/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Frame-Options',        value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  // Fuerza gounuri.com (apex, sin www) a redirigir a www.gounuri.com.
  // Google Search Console tiene las dos propiedades verificadas por
  // separado (gounuri.com y www.gounuri.com) y ambas servian el mismo
  // contenido con status 200 -- sin este redirect, cada pagina publica
  // queda duplicada entre los dos dominios. Las paginas ya declaran
  // <link rel="canonical"> hacia la version www (ver metadataBase en
  // layout.tsx y alternates.canonical en cada page.tsx), pero un
  // redirect real a nivel de dominio es el arreglo de fondo: asi el
  // apex ni siquiera llega a indexarse como "duplicada sin canonica",
  // pasa a mostrarse en GSC como "pagina con redireccion" (esperado).
  async redirects() {
    return [
      // /demo ya no existe (la pagina se sacó) -- redirige al lugar donde
      // hoy se ven demos reales de cada template, en vez de dejar un 404
      // en una URL que Google todavia tiene indexada. Va primero y con
      // destino absoluto (no relativo) para resolver en un solo salto
      // sea cual sea el dominio de origen (apex o www).
      {
        source: '/demo',
        destination: 'https://www.gounuri.com/templates',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'gounuri.com' }],
        destination: 'https://www.gounuri.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
