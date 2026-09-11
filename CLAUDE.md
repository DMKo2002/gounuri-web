# Regla de nombres de archivo para imágenes (SEO)

Al agregar o modificar cualquier imagen estática del sitio (en `public/`),
el nombre del archivo SIEMPRE debe empezar con el prefijo `gounuri-`
(guion medio, no guion bajo — es la convención que recomienda Google para
separar palabras en URLs de imágenes).

Ejemplos:
- `hero-01.jpg` → `gounuri-hero-01.jpg`
- `atelier.webp` → `gounuri-template-atelier.webp`
- `avatar-1.png` → `gounuri-glow-avatar-1.png`

## Cuándo aplica

- Toda imagen de marca/marketing propia del sitio: hero, onboarding,
  screenshots de templates, logo, íconos, etc.
- Aplica a cualquier imagen nueva que se agregue, no solo a las que ya
  existían.

## Cuándo NO aplica

- Contenido subido por el usuario/tenant (fotos de producto, logo de su
  tienda, etc. — ej. en Supabase Storage). Eso es contenido del cliente,
  no del sitio, y no se renombra.
- Archivos que siguen una convención de Next.js y no se pueden renombrar
  (ej. `src/app/icon.png`).

## Contexto

2026-09-11: se renombraron ~50 imágenes existentes en gounuri-web a este
esquema para mejorar la indexación en Google Imágenes (las imágenes venían
con nombres genéricos como `logo.jpg`, `hero-01.jpg`, sin ninguna relación
con la marca).
