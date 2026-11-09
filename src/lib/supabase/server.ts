import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import dns from 'dns'
import { fastSupabaseFetch } from './fast-fetch'

// Fallback de resolução DNS para contornar cache negativo de roteadores locais
// quando o projeto Kittanda (vooczwqifbbwtspzcdpz.supabase.co) está ativo no Cloudflare/Supabase.
const g = globalThis as any
if (!g.__kittandaDnsPatched) {
  g.__kittandaDnsPatched = true
  const origLookup = dns.lookup.bind(dns)
  ;(dns as any).lookup = function (hostname: string, options: any, callback?: any) {
    let cb = callback
    let opts = options
    if (typeof options === 'function') {
      cb = options
      opts = {}
    }
    origLookup(hostname, opts, (err: any, address: any, family: any) => {
      if (err && hostname === 'vooczwqifbbwtspzcdpz.supabase.co') {
        if (opts && opts.all) {
          return cb(null, [{ address: '104.18.38.10', family: 4 }])
        }
        return cb(null, '104.18.38.10', 4)
      }
      return cb(err, address, family)
    })
  }
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
