import { REGISTRO_URL } from '@/lib/site'

const PASOS = [
  {
    numero: '01',
    titulo: 'Registrate',
    texto:
      'Creá tu cuenta con email y contraseña, y elegí el nombre y el diseño de tu tienda.',
  },
  {
    numero: '02',
    titulo: 'Activamos tu tienda',
    texto:
      'Revisamos tu solicitud y activamos tu cuenta. Te avisamos por email apenas esté lista.',
  },
  {
    numero: '03',
    titulo: 'Cargá tus productos',
    texto:
      'Subí tu catálogo con fotos, talles, colores y precios desde el panel. Sin conocimientos técnicos.',
  },
  {
    numero: '04',
    titulo: 'Empezá a vender',
    texto:
      'Compartí el link de tu tienda y recibí pedidos con pagos por MercadoPago o transferencia.',
  },
]

export default function ComoFunciona() {
  return (
    <section id="como-funciona" className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Cómo funciona
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-zinc-600">
          De cero a tienda online en cuatro pasos.
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map(({ numero, titulo, texto }) => (
            <div key={numero} className="relative">
              <span className="text-4xl font-bold text-zinc-200">{numero}</span>
              <h3 className="mt-3 font-semibold text-zinc-900">{titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{texto}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a href={REGISTRO_URL} className="btn-black !px-7 !py-3">
            Empezar ahora
          </a>
        </div>
      </div>
    </section>
  )
}
