import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import MigracionHero from '@/components/MigracionHero'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Migración a Gounuri — Gounuri',
  description:
    'Migrá tu tienda a Gounuri de forma rápida y segura, sin perder datos ni ventas. Para mayoristas B2B y minoristas B2C.',
}

export default function MigracionPage() {
  return (
    <main>
      <Navbar />
      <MigracionHero />
      <Footer />
    </main>
  )
}
