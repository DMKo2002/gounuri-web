// Lee platform_billing_settings (fila única, id=1) — cómo le pueden pagar a
// GOUNURI las tiendas su suscripción: transferencia y/o Mercado Pago, editable
// desde Panel Admin /superadmin/pagos (2026-08-22). Reemplaza el viejo toggle
// único BILLING_ENABLED (env var) — se puede prender/apagar cada método sin
// redeploy, y tener los dos activos a la vez.
//
// Import type-only para no crear un ciclo con supabase/service.ts (que no
// depende de esto).
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PlatformPaymentSettings {
  manualTransferEnabled: boolean
  mercadopagoEnabled: boolean
  transferCbu: string | null
  transferAlias: string | null
  whatsappNumber: string | null
  contactEmail: string
}

// Si la fila todavía no existe (migración no corrida en este entorno) o la
// consulta falla, arrancamos en el mismo estado que el viejo BILLING_ENABLED
// desactivado: transferencia sí, MP no — así /perfil/plan nunca queda roto,
// en el peor caso muestra un poco menos de datos (sin CBU/alias todavía).
const FALLBACK: PlatformPaymentSettings = {
  manualTransferEnabled: true,
  mercadopagoEnabled: false,
  transferCbu: null,
  transferAlias: null,
  whatsappNumber: '541131351972',
  contactEmail: 'info@gounuri.com',
}

export async function getPlatformPaymentSettings(service: SupabaseClient): Promise<PlatformPaymentSettings> {
  const { data, error } = await service
    .from('platform_billing_settings')
    .select('manual_transfer_enabled, mercadopago_enabled, transfer_cbu, transfer_alias, whatsapp_number, contact_email')
    .eq('id', 1)
    .single()

  if (error || !data) {
    console.error('[platformBilling] no se pudo leer platform_billing_settings, uso fallback:', error?.message)
    return FALLBACK
  }

  return {
    manualTransferEnabled: data.manual_transfer_enabled,
    mercadopagoEnabled: data.mercadopago_enabled,
    transferCbu: data.transfer_cbu,
    transferAlias: data.transfer_alias,
    whatsappNumber: data.whatsapp_number,
    contactEmail: data.contact_email,
  }
}
