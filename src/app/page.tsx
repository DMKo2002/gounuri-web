import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TrustBadges from '@/components/TrustBadges'
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
// Revisado 2026-08-28 a pedido de Aram: el titulo largo anterior (96 chars)
// se truncaba en el SERP antes de mostrar "0%...", asi que ahora el titulo
// es corto (marca + propuesta) y el pitch de 0% comision / 0% retencion /
// 0% letra chica se movio a la description, donde Google deja ~155-160
// caracteres sin cortar. "confiscado" paso a "retenido": es mas preciso
// (retencion temporal de fondos, no perdida definitiva) y coincide con el
// termino que usan los comerciantes afectados cuando buscan el problema.
// Tambien se saco "indumentaria": Gounuri sirve para cualquier rubro, no
// solo moda.
export const metadata: Metadata = {
  title: 'Gounuri — Tu tienda online en minutos',
  description:
    '0% comisión de venta · 0% dinero retenido · 0% letra chica. Creá tu tienda online para cualquier rubro, con MercadoPago y diseño profesional.',
  alternates: { canonical: 'https://gounuri.com' },
  openGraph: {
    title: 'Gounuri — Tu tienda online en minutos',
    description:
      'Creá tu tienda online para cualquier rubro: catálogo, pedidos, pagos y diseño profesional.',
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
      <TrustBadges />
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
