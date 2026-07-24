import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ComoFunciona from '@/components/ComoFunciona'
import Pricing from '@/components/Pricing'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <ComoFunciona />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
