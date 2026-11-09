import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './config'

export function createAdminClient() {
  const supabaseUrl = SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase Service Role Key não configurada no servidor.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
