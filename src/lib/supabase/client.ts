import { createBrowserClient } from '@supabase/ssr'
import { fastSupabaseFetch } from './fast-fetch'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fastSupabaseFetch,
      },
    }
  )
}
