import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ContactoForm from '@/components/ContactoForm'

export const metadata: Metadata = {
  title: 'Contactanos — Gounuri',
  description: 'Dejanos tus datos y un especialista de Gounuri se va a contactar con vos.',
}

export default function ContactoPage() {
  return (
    <main>
      <Navbar />
      <section className="contact-page">
        <div className="contact-card">
          <ContactoForm />
        </div>
      </section>
      <Footer />
    </main>
  )
}
