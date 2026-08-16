// Los 6 templates de tienda disponibles. Cada demo vive en {slug}.gounuri.com
// (el middleware compartido rutea subdominios por tenants.slug — solo hace
// falta agregar el dominio en el proyecto de Vercel de cada template).
//
// NOTA: descripciones borrador — ajustar con Aram/David en la etapa de diseño.

export interface TemplateDef {
  slug: string
  nombre: string
  descripcion: string
  publico: string
}

export const TEMPLATES: TemplateDef[] = [
  {
    slug: 'minimalista',
    nombre: 'Minimalista',
    descripcion: 'Diseño limpio y aireado donde las prendas son las protagonistas. Home con hero a pantalla completa y moodboard.',
    publico: 'Marcas nuevas o catálogos chicos que buscan una imagen prolija sin distracciones.',
  },
  {
    slug: 'atelier',
    nombre: 'Atelier',
    descripcion: 'Estética editorial y elegante, con tipografía refinada y mucho espacio en blanco.',
    publico: 'Boutiques, moda de autor y marcas con identidad premium.',
  },
  {
    slug: 'mono',
    nombre: 'Mono',
    descripcion: 'Contraste fuerte, tipografía grande y actitud. Pensado para impactar de entrada.',
    publico: 'Streetwear, urbano y marcas jóvenes con personalidad marcada.',
  },
  {
    slug: 'axis',
    nombre: 'Axis',
    descripcion: 'Un diseño dinámico que incorpora video para generar impacto visual desde el primer momento. Ideal para marcas que quieren mostrar sus productos, campañas o identidad de forma más atractiva y envolvente.',
    publico: 'Catálogos grandes y venta mayorista donde importa encontrar rápido.',
  },
  {
    slug: 'glow',
    nombre: 'Glow',
    descripcion: 'Cálido y luminoso, con detalles suaves y foco en las fotos de producto.',
    publico: 'Moda femenina, accesorios y marcas con estética delicada.',
  },
  {
    slug: 'bazaar',
    nombre: 'Bazaar',
    descripcion: 'Vivo y versátil, con secciones destacadas para ofertas y novedades.',
    publico: 'Multimarca, ferias y tiendas con rotación alta de productos.',
  },
]

export function demoUrl(slug: string): string {
  return `https://${slug}.gounuri.com`
}
