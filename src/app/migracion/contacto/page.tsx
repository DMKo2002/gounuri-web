import { redirect } from 'next/navigation'

// 2026-08-29: esta dirección se renombró a /migracion/formulario (mismo
// formulario completo de migración, sin cambios de contenido -- pide tienda
// actual, URL, cantidad de productos). Se deja este redirect en vez de
// borrar la ruta para no romper links/bookmarks ya indexados por Google
// (ver src/app/sitemap.ts, ya actualizado a la nueva dirección).
export default function ContactoMigracionRedirect() {
  redirect('/migracion/formulario')
}
