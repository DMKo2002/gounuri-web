import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactoMigracionForm from '@/components/ContactoMigracionForm'

export const metadata: Metadata = {
  title: 'Contactá a un especialista — Gounuri',
  description:
    'Dejanos tus datos y los de tu tienda actual. Un especialista de Gounuri va a revisar tu caso y coordinar la migración con vos.',
}

export default function MigracionFormularioPage() {
  return (
    <main>
      <Navbar />
      <section className="contact-page">
        <div className="contact-card">
          <ContactoMigracionForm />
        </div>
      </section>
      <Footer />
    </main>
  )
}
