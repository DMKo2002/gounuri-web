import type { Metadata } from 'next'

// /registro/page.tsx es 'use client' y por eso no puede exportar su propia
// metadata (Next.js solo la permite en server components) -- vive aca, en
// el layout del segmento, que si puede ser server component aunque la
// pagina que envuelve sea client.
//
// Titulo distinto al de la home (ver src/app/page.tsx) para que dejen de
// competir por el mismo lugar en el indice de Google -- antes ambas
// heredaban el mismo default del layout raiz. noindex porque es una
// pantalla de registro/accion, no contenido que tenga sentido que alguien
// encuentre buscando en Google directamente; sigue funcionando igual para
// quien llega desde un link (ej. el boton "Crear mi tienda" de la home).
export const metadata: Metadata = {
  title: 'Creá tu cuenta - Gounuri.com',
  description: 'Registrate para crear tu tienda online con Gounuri.',
  robots: { index: false, follow: true },
}

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children
}
