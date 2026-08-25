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
      <TiendaBazaar />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
