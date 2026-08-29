import { redirect } from 'next/navigation'

// 2026-08-29: este formulario era una copia del de migración con campos
// específicos de "tienda actual" (nombre, URL, cantidad de productos) que
// ya no hacen falta -- se generalizó a un contacto simple (nombre, tel,
// email, nota) y se mudó a /contacto. Se deja este redirect en vez de
// borrar la ruta para no romper links/bookmarks ya indexados por Google
// (ver src/app/sitemap.ts, ya actualizado a la nueva dirección).
export default function ContactoMigracionRedirect() {
  redirect('/contacto')
}
