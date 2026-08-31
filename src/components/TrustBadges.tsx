const BADGES = [
  {
    valor: '0%',
    titulo: 'Comisión de venta',
    texto: 'Todo lo que vendés es tuyo. No te cobramos porcentaje por pedido.',
  },
  {
    valor: '0%',
    titulo: 'Dinero retenido',
    texto: 'Tu plata no queda retenida. Cobrás y disponés al toque.',
  },
  {
    valor: '0%',
    titulo: 'Letra chica',
    texto: 'Un plan mensual fijo, sin condiciones escondidas.',
  },
]

export default function TrustBadges() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-3">
          {BADGES.map(({ valor, titulo, texto }) => (
            <div key={titulo} className="text-center sm:text-left">
              <p className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {valor}
              </p>
              <h3 className="mt-2 font-semibold text-white">{titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
