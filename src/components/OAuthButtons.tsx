'use client'

// Botón de "Continuar con Google" — mismo componente en /login y /registro
// (da igual si es alta o ingreso: Supabase crea la cuenta sola la primera
// vez). Requiere que Google esté habilitado como provider en Supabase
// Dashboard > Authentication > Providers, con su Client ID/Secret — si no
// está habilitado, Supabase devuelve un error claro al tocar el botón, no
// rompe la página.
//
// 2026-08-27: se sacó el botón de Facebook. Nunca llegó a funcionar y la app
// de Meta necesita revisión/verificación de negocio para salir de modo
// desarrollo, así que se pospuso. Para volver a activarlo: sumar 'facebook'
// al tipo del provider acá, devolver el botón, y habilitarlo en Supabase.
//
// El alta de la fila en gounuri_accounts para estas cuentas la hace el
// trigger handle_new_gounuri_account() en la base (no pasa por
// /api/auth/registro, que es solo para el flujo por mail).
//
// 2026-08-24: prop `disabled` opcional — /registro lo usa para bloquear
// estos botones hasta que el checkbox de "acepto los términos" esté
// tildado (antes se podía crear cuenta por Google sin haber visto ningún
// aviso de términos, ya que ese texto vivía debajo del form de
// mail/contraseña, después de estos botones). /login no pasa la prop —
// sigue sin gating, como siempre.

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.66z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3a7.4 7.4 0 0 1-11-3.9H.98v3.1A12 12 0 0 0 12 24z"/>
      <path fill="#FBBC05" d="M5.07 14.19a7.2 7.2 0 0 1 0-4.38v-3.1H.98a12 12 0 0 0 0 10.58l4.09-3.1z"/>
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 .98 6.71l4.09 3.1A7.16 7.16 0 0 1 12 4.77z"/>
    </svg>
  )
}

export default function OAuthButtons({ disabled = false }: { disabled?: boolean }) {
  const supabase = createClient()
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'google') {
    if (disabled) return
    setError(null)
    setLoadingProvider(provider)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) {
      setLoadingProvider(null)
      setError('No se pudo iniciar sesión con Google. Probá con mail o más tarde.')
    }
    // Si no hay error, el browser ya está siendo redirigido al provider —
    // no hace falta hacer nada más acá.
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={disabled || loadingProvider !== null}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
      >
        <IconGoogle />
        {loadingProvider === 'google' ? 'Redirigiendo...' : 'Continuar con Google'}
      </button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
