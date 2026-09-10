import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { BLOG_POSTS } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — Gounuri',
  description: 'Notas sobre vender online en Argentina: costos reales, comisiones, medios de pago y las decisiones detrás de Gounuri.',
  alternates: { canonical: '/blog' },
}

function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BlogIndexPage() {
  return (
    <main>
      <Navbar />
      <section className="blog-index">
        <h1>Blog</h1>
        <p className="blog-index-intro">
          Notas sobre vender online en Argentina — costos reales, comisiones,
          medios de pago y las decisiones detrás de Gounuri.
        </p>

        {BLOG_POSTS.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
            <p className="blog-card-title">{post.title}</p>
            <p className="blog-card-excerpt">{post.excerpt}</p>
            <p className="blog-card-meta">
              {formatFecha(post.date)} · Lectura de {post.readingTime}
            </p>
          </Link>
        ))}
      </section>
      <Footer />
    </main>
  )
}
