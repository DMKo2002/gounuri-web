import { LOGIN_URL, REGISTRO_URL } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              gounuri<span className="text-zinc-400">.com</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Plataforma de tiendas online para moda e indumentaria.
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#planes" className="hover:text-zinc-900 transition-colors">Planes</a>
            <a href={LOGIN_URL} className="hover:text-zinc-900 transition-colors">Ingresar</a>
            <a href={REGISTRO_URL} className="hover:text-zinc-900 transition-colors">Crear tienda</a>
          </nav>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} Gounuri. Hecho en Argentina.
        </p>
      </div>
    </footer>
  )
}
