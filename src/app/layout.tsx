import type { Metadata } from 'next'
import './globals.css'
import GoogleAnalytics from '@/components/GoogleAnalytics'

export const metadata: Metadata = {
  title: 'Gounuri — Tu tienda online',
  description:
    'Plataforma para crear tiendas online de indumentaria en Argentina. Catálogo, pedidos, pagos con MercadoPago y diseño profesional, todo en un solo lugar.',
  metadataBase: new URL('https://gounuri.com'),
  openGraph: {
    title: 'Gounuri — Tu tienda online',
    description:
      'Creá tu tienda online de indumentaria: catálogo, pedidos, pagos y diseño profesional.',
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
      </head>
      <body className="font-sans antialiased">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
