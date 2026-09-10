// Seccion "Nuestros clientes" -- reemplaza a <TrustBadges />, que repetia
// el mismo mensaje "0% comision / 0% dinero retenido / 0% letra chica" que
// ya se muestra animado (efecto "typed") en el strip inferior del Hero:
// quedaban las dos frases pegadas, una debajo de la otra, en la home.
// (2026-09-10, a pedido de ARam.)
//
// En su lugar, esta seccion muestra en un loop horizontal infinito ("cinta"
// sin fin, se pausa al pasar el mouse) los logos de las tiendas reales que
// ya usan Gounuri, cada una con link a su tienda en vivo -- para que quede
// claro que el negocio es real y ya tiene clientes usandolo.
//
// Para agregar un cliente nuevo mas adelante: sumar un objeto al array
// CLIENTES de abajo con nombre, logo (URL publica de Supabase Storage,
// tabla store_config.logo_url) y url (el dominio propio si domain_status
// = 'verified' en la tabla tenants; el fallback https://<slug>.gounuri.com
// mientras el dominio propio no este conectado; o, si el cliente ya pidio
// mostrar su dominio propio aunque todavia no este activo -- como Iruda y
// HAEJIN-HAEJIN, que lo activan en la semana -- ese dominio directamente).
// Un cliente sin logo aun (logo: null) se muestra como tarjeta de texto con
// su nombre, mismo tamaño, para no romper el loop.
const CLIENTES: { nombre: string; logo: string | null; url: string }[] = [
  {
    nombre: 'Mykonos Love',
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/cf7d362c-10d1-41e3-bd2e-9fac15f82309/logo.png',
    url: 'https://mykonoslove.com',
  },
  {
    nombre: "Conor's Sports",
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/64754e28-42e9-45ea-9f0c-ed1d11fa458c/logo.png',
    url: 'https://conorssports.com',
  },
  {
    nombre: 'Yenine Sweaters',
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/76876126-7cdb-45d7-abc5-335921cc0dc2/logo.png',
    url: 'https://yeninesweaters.com',
  },
  {
    nombre: 'Caloria',
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/14ba1f61-611b-487e-9523-0a472b45dc38/logo.png',
    url: 'https://caloriashop.com',
  },
  {
    nombre: 'HAEJIN-HAEJIN',
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/c6ce99a4-15aa-4a66-9c73-48895e8106d8/logo.png',
    // Dominio propio (haejinne.com) todavia no conectado -- lo activan en
    // la semana. A pedido de ARam se linkea directo, no al fallback.
    url: 'https://haejinne.com',
  },
  {
    nombre: 'My Queen Trend',
    logo: 'https://xvhqiwypejurjdqioyuq.supabase.co/storage/v1/object/public/store-assets/dfc238e6-73a5-4e42-94e9-c16937a078ee/logo.jpg',
    // myqueentrend.com tiene un problema de DNS sin resolver del lado de
    // Hostinger (no es un tema de "todavia no lo activamos" como los de
    // arriba) -- mientras tanto se linkea al fallback que si funciona.
    url: 'https://my-queen-trend.gounuri.com',
  },
  {
    nombre: 'Iruda',
    logo: null,
    // Dominio propio (irudasweaters.com) todavia no conectado -- lo activan
    // en la semana. A pedido de ARam se linkea directo, no al fallback.
    url: 'https://irudasweaters.com',
  },
]

export default function ClientesShowcase() {
  const loop = [...CLIENTES, ...CLIENTES]

  return (
    <section className="border-t border-zinc-200 bg-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <h2 className="text-center text-2xl font-bold text-zinc-900 sm:text-3xl">
          Nuestros clientes
        </h2>
      </div>

      <div className="clientes-marquee">
        <div className="clientes-marquee-track">
          {loop.map((cliente, i) => (
            <a
              key={`${cliente.nombre}-${i}`}
              href={cliente.url}
              target="_blank"
              rel="noopener noreferrer"
              title={cliente.nombre}
              className="clientes-marquee-item"
              aria-hidden={i >= CLIENTES.length ? true : undefined}
              tabIndex={i >= CLIENTES.length ? -1 : undefined}
            >
              {cliente.logo ? (
                <img src={cliente.logo} alt={cliente.nombre} loading="lazy" />
              ) : (
                <span className="text-sm font-semibold text-zinc-700">{cliente.nombre}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
