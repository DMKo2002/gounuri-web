import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ComoFunciona from '@/components/ComoFunciona'
import Pricing from '@/components/Pricing'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'
import { TiendaAtelier } from '@/components/tiendas/TiendaAtelier'
import { TiendaMono } from '@/components/tiendas/TiendaMono'
import { TiendaGlow } from '@/components/tiendas/TiendaGlow'
import { TiendaMinimalista } from '@/components/tiendas/TiendaMinimalista'
import { TiendaAxis } from '@/components/tiendas/TiendaAxis'
import { TiendaBazaar } from '@/components/tiendas/TiendaBazaar'

// Metadata propia de la home -- antes heredaba el default del layout raiz,
// identico al que tambien hereda /registro (y cualquier otra pagina sin
// override). Dos paginas con el mismo titulo/descripcion hacen que Google
// no tenga claro cual es "la" pagina representativa del sitio y a veces
// termina indexando la que no queres (ver /registro/layout.tsx, que ahora
// tiene su propio titulo + noindex por la misma razon).
export const metadata: Metadata = {
  title: 'Tu tienda online en minutos - Gounuri.com',
  description:
    'Plataforma para crear tiendas online de indumentaria en Argentina. Catálogo, pedidos, pagos con MercadoPago y diseño profesional, todo en un solo lugar.',
  alternates: { canonical: 'https://gounuri.com' },
  openGraph: {
    title: 'Tu tienda online en minutos - Gounuri.com',
    description:
      'Creá tu tienda online de indumentaria: catálogo, pedidos, pagos y diseño profesional.',
    url: 'https://gounuri.com',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TiendaAtelier />
      <TiendaMono />
      <Features />
      <TiendaGlow />
      <ComoFunciona />
      <TiendaMinimalista />
      <TiendaAxis />
      <Pricing />
      <TiendaBazaar />
      <CTA />
      <Footer />
    </main>
  )
}
