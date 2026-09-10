import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CTA from '@/components/CTA'
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog'

export function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPostBySlug(params.slug)
  if (!post) return {}
  return {
    title: `${post.title} — Blog de Gounuri`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  }
}

function formatFecha(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  return (
    <main>
      <Navbar />
      <article className="blog-page">
        <span className="blog-eyebrow">BLOG</span>
        <h1>{post.title}</h1>
        <p className="blog-meta">
          GOUNURI · {formatFecha(post.date)} · Lectura de {post.readingTime}
        </p>

        {post.body.map((block, i) => {
          if (block.type === 'h2') return <h2 key={i}>{block.text}</h2>
          if (block.type === 'callout') {
            return (
              <div key={i} className="blog-callout">
                <p>{block.lead}</p>
                <p>{block.sub}</p>
              </div>
            )
          }
          if (block.type === 'closing') {
            return (
              <p key={i} className="blog-closing">
                {block.text}
              </p>
            )
          }
          if (block.type === 'legal') {
            return (
              <p key={i} className="blog-legal">
                {block.text}
              </p>
            )
          }
          return <p key={i}>{block.text}</p>
        })}
      </article>
      <CTA />
      <Footer />
    </main>
  )
}
