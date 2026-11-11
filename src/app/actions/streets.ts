'use server'

import { createClient } from '@/lib/supabase/server'
import { getLocalStores } from '@/lib/stores-storage'
import { mergeAndGroupStreetsByLetter } from '@/lib/streets'

export async function getCommercialStreetsByLetterAction(): Promise<Record<string, string[]>> {
  const extraStreets: string[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('stores')
      .select('street')
      .eq('is_active', true)

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row?.street && typeof row.street === 'string') {
          extraStreets.push(row.street)
        }
      }
    }
  } catch {
    // fallback silencioso
  }

  try {
    const localStores = getLocalStores()
    for (const s of localStores) {
      if (s?.is_active !== false && s?.street) {
        extraStreets.push(s.street)
      }
    }
  } catch {
    // fallback silencioso
  }

  return mergeAndGroupStreetsByLetter(extraStreets)
}
