// Contenido del blog de gounuri.com — 2026-09-10.
//
// No hay CMS ni MDX en el proyecto todavía, así que los posts viven acá
// como datos estructurados (bloques tipados) en vez de archivos .md/.mdx.
// Si el blog crece y esto se vuelve incómodo de mantener a mano, migrar a
// MDX o a una tabla en Supabase es el próximo paso natural — por ahora,
// con pocos posts, esto alcanza y no agrega una dependencia nueva.

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'callout'; lead: string; sub: string }
  | { type: 'closing'; text: string }
  | { type: 'legal'; text: string }

export type BlogPost = {
  slug: string
  title: string
  excerpt: string
  date: string // YYYY-MM-DD
  readingTime: string
  body: BlogBlock[]
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'cuanto-te-cobran-por-vender-online',
    title: 'Cuánto te cobran realmente por vender online (y por qué elegimos hacerlo distinto)',
    excerpt:
      'Comisiones, plazos de acreditación y letra chica: la cuenta completa, hecha con números reales, para que decidas con información y no con promesas.',
    date: '2026-09-10',
    readingTime: '4 min',
    body: [
      {
        type: 'p',
        text: 'Todo el mundo te dice que "tenés que vender online". Pocos te cuentan qué pasa después de esa frase: cuánto de lo que facturás en realidad te llega, y cuánto se va en el camino sin que lo notes hasta que hacés la cuenta.',
      },
      {
        type: 'p',
        text: 'Nosotros la hicimos. Y la compartimos completa, con números reales, porque creemos que un comerciante que entiende exactamente en qué se le va la plata toma mejores decisiones que uno al que le prometen "vender más" sin explicarle el resto.',
      },
      { type: 'h2', text: 'La cuenta que casi nadie hace' },
      {
        type: 'p',
        text: 'Supongamos que vendiste $5.000.000 este mes. Un número redondo, alcanzable para muchos negocios chicos y medianos en Argentina hoy.',
      },
      {
        type: 'p',
        text: 'Si cobrás con tarjeta a través de Mercado Pago, la comisión de cobro (3,99% en crédito) ya se lleva $199.500. Quedan $4.800.500.',
      },
      {
        type: 'p',
        text: 'A eso hay que sumarle el plan mensual de tu tienda online. Tomemos un ejemplo real: el plan "Impulso" de una plataforma conocida cuesta $78.999 por mes y cobra, además, un 1% de comisión por cada venta si no usás su método de pago propio. Sobre $5.000.000, ese 1% son otros $50.000.',
      },
      {
        type: 'callout',
        lead: '$328.499 desaparecieron antes de que vieras un peso — el 6,57% de tu venta.',
        sub: 'Y eso sin contar todavía proveedores, impuestos, embalaje ni envío, que son los que realmente definen si te queda ganancia o no.',
      },
      {
        type: 'p',
        text: 'No es un número inventado para asustar. Es la cuenta real, hecha con las tarifas publicadas de los propios proveedores del servicio.',
      },
      { type: 'h2', text: 'Y encima, esa plata tarda en llegar' },
      {
        type: 'p',
        text: 'Hay otra parte de la ecuación que se habla todavía menos: cuánto tardás en tener esa plata disponible. Con Checkout Pro de Mercado Pago, la acreditación de una venta con tarjeta puede demorar hasta 14 días.',
      },
      {
        type: 'p',
        text: 'Para un negocio que tiene que reponer stock la semana que viene, esos 14 días no son un detalle administrativo. Muchas veces significan salir a buscar un adelanto o una línea de crédito para cubrir el bache — y ese financiamiento tiene un costo propio, en intereses, que se suma al 6,57% que ya se fue en comisiones. Así es como una demora de cobro termina convirtiéndose, silenciosamente, en deuda.',
      },
      { type: 'h2', text: 'El caso mayorista es todavía más sensible' },
      {
        type: 'p',
        text: 'Si vendés al por mayor, esta cuenta pega más fuerte. Los márgenes mayoristas suelen moverse entre el 20% y el 40% sobre la venta. Eso significa que ese mismo 1% de comisión que parece chico en términos de facturación, medido contra tu ganancia real, puede representar entre el 2,5% y el 5% de tu margen. La misma comisión, en un negocio con más margen, pesa mucho menos. Por eso en el mayorista se usa tanto la transferencia bancaria en lugar de la tarjeta: evita esa comisión y esa demora.',
      },
      { type: 'h2', text: 'Por qué esto importa más justo ahora' },
      {
        type: 'p',
        text: 'En un año en el que las reglas económicas del país pueden volver a moverse, tener al menos un costo fijo que no cambia — más allá de lo que pase afuera — deja de ser un detalle de precio y pasa a ser una herramienta de planificación. No sabemos qué va a pasar con el dólar o con las tasas el año que viene. Lo que sí podemos controlar es que el costo de tu plataforma no sea una variable más para la que tengas que estar preparado.',
      },
      { type: 'h2', text: 'Nuestra visión con Gounuri' },
      {
        type: 'p',
        text: 'Construimos Gounuri con una premisa simple: lo que vendés es, en su enorme mayoría, lo que te llevás. Planes fijos mensuales, sin comisión por venta y sin que la plataforma retenga fondos propios por encima de lo que ya retiene el medio de pago. Vendas poco o mucho en el mes, el plan no cambia.',
      },
      {
        type: 'p',
        text: 'No competimos ofreciendo más funciones de las que alguien vaya a usar. Competimos ofreciendo algo más difícil de encontrar en el ecommerce argentino de hoy: previsibilidad real y ninguna letra chica. Ya hay tiendas funcionando sobre la plataforma, y seguimos creciendo casi exclusivamente por recomendación de quienes ya la usan.',
      },
      {
        type: 'closing',
        text: 'Si estás evaluando dónde abrir o mudar tu tienda online, hacé la cuenta con tus propios números antes de elegir. Es, literalmente, la primera cuenta que hicimos nosotros antes de construir esto.',
      },
      {
        type: 'legal',
        text: 'Gounuri proporciona una plataforma tecnológica de software como servicio (SaaS) destinada a facilitar la creación, administración y operación de tiendas de comercio electrónico.',
      },
    ],
  },
]

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}
