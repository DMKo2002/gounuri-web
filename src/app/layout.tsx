import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'Gounuri — Tu tienda online',
  description:
    'Plataforma para crear tiendas online en Argentina, para cualquier rubro. Catálogo, pedidos, pagos con MercadoPago y diseño profesional, todo en un solo lugar.',
  metadataBase: new URL('https://www.gounuri.com'),
  openGraph: {
    title: 'Gounuri — Tu tienda online',
    description:
      'Creá tu tienda online para cualquier rubro: catálogo, pedidos, pagos y diseño profesional.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Datos estructurados (schema.org Organization) -- ayuda a Google a
            identificar gounuri.com como la entidad "Gounuri" (SaaS de
            tiendas online, Argentina) y a distinguirla de otras empresas
            que tambien se llaman asi (ej. una marca coreana de regalos). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Gounuri',
              url: 'https://www.gounuri.com',
              logo: 'https://www.gounuri.com/img/onboarding/g-logo-slogan.svg',
              description:
                'Plataforma para crear tiendas online en Argentina, para cualquier rubro: catalogo, pedidos, pagos con MercadoPago y diseno profesional.',
              areaServed: 'AR',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'AR',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
