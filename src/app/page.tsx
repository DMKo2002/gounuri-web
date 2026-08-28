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
// Titulo largo (96 caracteres) a pedido de Aram para que los "0%" salgan
// tal cual en el resultado de busqueda -- OJO: Google trunca el titulo
// visible en el SERP a mano de ~60 caracteres, asi que en la practica hoy
// se va a ver algo como "Gounuri - Tu tienda online en minutos - 0%..." con
// puntos suspensivos. El texto completo igual queda en el <title> real (lo
// puede leer un lector de pantalla, y Google a veces lo usa completo en
// otros formatos como el Overview de IA), pero visualmente en el link azul
// clasico se va a cortar.
export const metadata: Metadata = {
  title: 'Gounuri - Tu tienda online en minutos - 0% Comisión de venta 0% Dinero confiscado 0% Letra chica',
  description:
    'Creá tu tienda online de indumentaria en Argentina. 0% comisión de venta, 0% dinero confiscado, 0% letra chica. Catálogo, pagos con MercadoPago y diseño profesional.',
  alternates: { canonical: 'https://gounuri.com' },
  openGraph: {
    title: 'Gounuri - Tu tienda online en minutos - 0% Comisión de venta 0% Dinero confiscado 0% Letra chica',
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
