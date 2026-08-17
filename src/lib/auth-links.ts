// Helper compartido para generar un magic link sobre una cuenta de Auth YA
// EXISTENTE (a diferencia de generateLink(type:'signup'), no crea un
// auth.users nuevo) — usado tanto por /api/auth/registro (reenvío de
// confirmación propio + enganche de cuenta compartida con una tienda de un
// tenant) como por /api/auth/reenviar-confirmacion (botón "Reenviar mail"
// del login). Ver conversación 2026-08-17.
import { createServiceClient } from '@/lib/supabase/service'

export async function generarLinkDeAcceso(
  service: ReturnType<typeof createServiceClient>,
  normalizedEmail: string,
  siteUrl: string,
): Promise<{ userId: string; confirmationUrl: string } | null> {
  const { data, error } = await service.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}/auth/verificar` },
  })

  if (error || !data?.user) {
    console.error('[auth-links] no se pudo generar magic link:', error?.message)
    return null
  }

  const hashedToken = data.properties?.hashed_token
  const confirmationUrl = hashedToken
    ? `${siteUrl}/auth/verificar?token_hash=${encodeURIComponent(hashedToken)}&type=magiclink`
    : data.properties?.action_link

  if (!confirmationUrl) {
    console.error('[auth-links] magic link sin hashed_token ni action_link para', normalizedEmail)
    return null
  }

  return { userId: data.user.id, confirmationUrl }
}
