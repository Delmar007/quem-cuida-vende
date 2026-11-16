'use server'

import { createClient } from '@/lib/supabase/server'
import { getLocalStores } from '@/lib/stores-storage'
import { mergeAndGroupStreetsByLetter, mergeAndGroupShoppingsByLetter } from '@/lib/streets'

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

export async function getCommercialShoppingsByLetterAction(): Promise<Record<string, string[]>> {
  const extraShoppings: string[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('stores')
      .select('reference_point')
      .eq('is_active', true)

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row?.reference_point && typeof row.reference_point === 'string') {
          extraShoppings.push(row.reference_point)
        }
      }
    }
  } catch {
    // fallback silencioso
  }

  try {
    const localStores = getLocalStores()
    for (const s of localStores) {
      if (s?.is_active !== false && s?.reference_point) {
        extraShoppings.push(s.reference_point)
      }
    }
  } catch {
    // fallback silencioso
  }

  return mergeAndGroupShoppingsByLetter(extraShoppings)
}
