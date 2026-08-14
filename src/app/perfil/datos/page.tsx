import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import DatosPersonalesForm from './DatosPersonalesForm'

export const dynamic = 'force-dynamic'

// Datos opcionales del dueño (nombre, apellido, DNI, CUIT, empresa,
// celular) — ya no se piden en el registro (ver /registro y
// /api/auth/registro), quedan acá para quien los quiera cargar. Viven en
// gounuri_accounts, que no tiene ningún acceso directo desde el browser
// (tiene DNI/CUIT) — por eso el guardado pasa por /api/perfil/datos en vez
// de escribir Supabase directo, a diferencia de /perfil/tienda.
export default async function DatosPersonalesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: _rows } = await service
    .from('gounuri_accounts')
    .select('nombre, apellido, dni, cuit, empresa, celular')
    .eq('auth_user_id', user.id)
    .limit(1)
  const account = _rows?.[0]

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-6">
          {/* <a> normal — ver nota en /perfil/cobros/page.tsx sobre por qué
              no usamos <Link> acá. */}
          <a href="/perfil" className="text-lg font-semibold tracking-tight text-zinc-900">
            gounuri<span className="text-zinc-400">.com</span>
          </a>
          <span className="text-zinc-300">/</span>
          <a href="/perfil" className="text-sm text-zinc-500 hover:text-zinc-900">Mi cuenta</a>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mis datos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Opcional — completalo si necesitás que figure en facturación u otros trámites con tu tienda.
        </p>

        <div className="mt-8">
          <DatosPersonalesForm
            initial={{
              nombre: account?.nombre ?? '',
              apellido: account?.apellido ?? '',
              dni: account?.dni ?? '',
              cuit: account?.cuit ?? '',
              empresa: account?.empresa ?? '',
              celular: account?.celular ?? '',
            }}
          />
        </div>
      </div>
    </main>
  )
}
