import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { fastSupabaseFetch } from './fast-fetch'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        fetch: fastSupabaseFetch,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // A exceção acontece quando tenta setar um cookie a partir do Server Component.
            // Para atualizar cookies o middleware deve fazer o refresh da sessão.
          }
        },
      },
    }
  )
}
