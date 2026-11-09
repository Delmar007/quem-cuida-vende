import { createBrowserClient } from '@supabase/ssr'
import { fastSupabaseFetch } from './fast-fetch'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        fetch: fastSupabaseFetch,
      },
    }
  )
}
