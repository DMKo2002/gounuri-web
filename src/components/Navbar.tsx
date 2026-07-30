import Link from 'next/link'
import NavAuth from '@/components/NavAuth'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
          gounuri<span className="text-zinc-400">.com</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          <a href="/#features" className="hover:text-zinc-900 transition-colors">Features</a>
          <a href="/#como-funciona" className="hover:text-zinc-900 transition-colors">Cómo funciona</a>
          <Link href="/templates" className="hover:text-zinc-900 transition-colors">Templates</Link>
          <Link href="/demo" className="hover:text-zinc-900 transition-colors">Demo</Link>
          <a href="/#planes" className="hover:text-zinc-900 transition-colors">Planes</a>
        </nav>

        <NavAuth />
      </div>
    </header>
  )
}
