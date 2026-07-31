// Normaliza errores de Supabase Auth a un mensaje legible.
//
// Por qué existe: en producción vimos la barra de error mostrando "{}"
// literal — Supabase puede devolver un AuthError cuyo .message no es un
// string usable (rate limit, respuesta sin cuerpo, etc.). Sin esta guarda,
// `err.message` termina mostrando basura. Siempre logueamos el error crudo
// a consola para poder diagnosticar sin exponerlo al usuario.
export function friendlyAuthError(err: unknown, fallback = 'Ocurrió un error. Probá de nuevo en unos segundos.'): string {
  console.error('[auth]', err)

  const message = (err as { message?: unknown } | null)?.message
  if (typeof message !== 'string' || message.trim() === '') return fallback

  if (message.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
  if (message.includes('Email not confirmed')) return 'Confirmá tu email antes de ingresar — revisá tu casilla.'
  if (message.toLowerCase().includes('rate limit') || message.includes('429')) {
    return 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
  }
  if (message.includes('already registered')) return 'Ya existe una cuenta con ese email. Ingresá desde el login.'

  return message
}
