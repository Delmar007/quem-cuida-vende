'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getLocalSessionUser, setLocalSessionUser } from '@/lib/local-auth'
import { getLocalStoresByOwner } from '@/lib/stores-storage'

export interface UserOfficeData {
  id: string
  email: string
  displayName: string
  phone: string
  birthDate: string
  avatarUrl: string | null
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  followedStoreIds: string[]
  favoriteProductIds: string[]
  hasStore: boolean
}

const FOLLOWED_STORES_COOKIE = 'kittanda_followed_stores'
const FAVORITE_PRODUCTS_COOKIE = 'kittanda_favorite_products'
const USER_OFFICE_COOKIE = 'kittanda_user_office_profile'

export async function getFollowedStoreIdsFromServer(): Promise<string[]> {
  const cookieStore = await cookies()
  let cookieIds: string[] = []
  try {
    const raw = cookieStore.get(FOLLOWED_STORES_COOKIE)?.value
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw))
      if (Array.isArray(parsed)) cookieIds = parsed
    }
  } catch {
    // ignore
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    if (user) {
      const metaIds = user.user_metadata?.followed_store_ids
      if (Array.isArray(metaIds)) {
        return Array.from(new Set([...cookieIds, ...metaIds]))
      }
    }
  } catch {
    // ignore
  }

  const localUser = await getLocalSessionUser()
  if (localUser?.user_metadata && Array.isArray((localUser.user_metadata as any).followed_store_ids)) {
    return Array.from(new Set([...cookieIds, ...(localUser.user_metadata as any).followed_store_ids]))
  }

  return cookieIds
}

export async function getUserOfficeDataAction(): Promise<UserOfficeData> {
  const cookieStore = await cookies()
  let user: any = null
  let profileRow: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profileRow = prof
    }
  } catch {
    // fallback
  }

  if (!user) {
    user = await getLocalSessionUser()
  }

  // Fallback para cookie local caso o visitante use o Office mesmo antes de logar ou com sessão local
  let cookieProfile: Partial<UserOfficeData> = {}
  try {
    const rawProf = cookieStore.get(USER_OFFICE_COOKIE)?.value
    if (rawProf) {
      cookieProfile = JSON.parse(decodeURIComponent(rawProf))
    }
  } catch {
    // ignore
  }

  let cookieFollowed: string[] = []
  try {
    const rawF = cookieStore.get(FOLLOWED_STORES_COOKIE)?.value
    if (rawF) {
      const parsed = JSON.parse(decodeURIComponent(rawF))
      if (Array.isArray(parsed)) cookieFollowed = parsed
    }
  } catch {
    // ignore
  }

  let cookieFavorites: string[] = []
  try {
    const rawFav = cookieStore.get(FAVORITE_PRODUCTS_COOKIE)?.value
    if (rawFav) {
      const parsed = JSON.parse(decodeURIComponent(rawFav))
      if (Array.isArray(parsed)) cookieFavorites = parsed
    }
  } catch {
    // ignore
  }

  const meta = user?.user_metadata || {}
  const followedStoreIds = Array.from(
    new Set([
      ...(Array.isArray(meta.followed_store_ids) ? meta.followed_store_ids : []),
      ...cookieFollowed,
    ])
  )
  const favoriteProductIds = Array.from(
    new Set([
      ...(Array.isArray(meta.favorite_product_ids) ? meta.favorite_product_ids : []),
      ...cookieFavorites,
    ])
  )

  let hasStore = Boolean(
    meta.has_store ||
      (user?.id && cookieStore.get(`kittanda_has_store_${user.id}`)?.value === 'true')
  )

  if (!hasStore && user?.id) {
    try {
      const supabase = await createClient()
      const { data: userStores } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
      if (userStores && userStores.length > 0) {
        hasStore = true
      }
    } catch {
      // ignore
    }
    if (!hasStore) {
      const localOwned = getLocalStoresByOwner(user.id)
      if (localOwned.length > 0) hasStore = true
    }
  }

  return {
    id: user?.id || 'guest',
    email: user?.email || cookieProfile.email || '',
    displayName:
      profileRow?.display_name ||
      meta.full_name ||
      meta.name ||
      cookieProfile.displayName ||
      '',
    phone: profileRow?.phone || meta.phone || cookieProfile.phone || '',
    birthDate: profileRow?.birth_date || meta.birth_date || cookieProfile.birthDate || '',
    avatarUrl:
      profileRow?.avatar_url ||
      meta.avatar_url ||
      meta.picture ||
      cookieProfile.avatarUrl ||
      null,
    cep: meta.cep || cookieProfile.cep || '',
    street: meta.street || cookieProfile.street || '',
    number: meta.number || cookieProfile.number || '',
    neighborhood: meta.neighborhood || cookieProfile.neighborhood || '',
    city: meta.city || cookieProfile.city || '',
    state: meta.state || cookieProfile.state || '',
    followedStoreIds,
    favoriteProductIds,
    hasStore,
  }
}

export async function saveUserOfficeProfileAction(input: {
  displayName: string
  phone: string
  birthDate: string
  avatarUrl: string | null
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()

  const payload = {
    displayName: input.displayName.trim(),
    phone: input.phone.trim(),
    birthDate: input.birthDate.trim(),
    avatarUrl: input.avatarUrl || null,
    cep: input.cep.trim(),
    street: input.street.trim(),
    number: input.number.trim(),
    neighborhood: input.neighborhood.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
  }

  // Salvar sempre em cookie para persistência imediata
  try {
    // Evita gravar base64 gigante no cookie se avatarUrl for data URL muito grande
    const cookieSafePayload = {
      ...payload,
      avatarUrl:
        payload.avatarUrl && payload.avatarUrl.length < 2048 ? payload.avatarUrl : null,
    }
    cookieStore.set(USER_OFFICE_COOKIE, encodeURIComponent(JSON.stringify(cookieSafePayload)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } catch {
    // ignore
  }

  let user: any = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (user) {
      let finalAvatarUrl = payload.avatarUrl

      // Se for base64 (data:image/...), fazer upload para o bucket 'stores' no Supabase Storage
      if (finalAvatarUrl && finalAvatarUrl.startsWith('data:image/')) {
        try {
          const matches = finalAvatarUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/)
          if (matches) {
            const contentType = matches[1]
            const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
            const buffer = Buffer.from(matches[2], 'base64')
            const filePath = `avatars/${user.id}-${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage
              .from('stores')
              .upload(filePath, buffer, { contentType, upsert: true })
            if (!upErr) {
              const { data: pubUrl } = supabase.storage.from('stores').getPublicUrl(filePath)
              if (pubUrl?.publicUrl) {
                finalAvatarUrl = pubUrl.publicUrl
              }
            }
          }
        } catch {
          // ignore storage upload error
        }
      }

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: payload.displayName,
          phone: payload.phone,
          birth_date: payload.birthDate || null,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })

      await supabase.auth.updateUser({
        data: {
          full_name: payload.displayName,
          name: payload.displayName,
          phone: payload.phone,
          birth_date: payload.birthDate,
          avatar_url: finalAvatarUrl,
          cep: payload.cep,
          street: payload.street,
          number: payload.number,
          neighborhood: payload.neighborhood,
          city: payload.city,
          state: payload.state,
        },
      })
    }
  } catch {
    // ignore
  }

  const localUser = await getLocalSessionUser()
  if (localUser) {
    await setLocalSessionUser({
      ...localUser,
      user_metadata: {
        ...localUser.user_metadata,
        full_name: payload.displayName,
        name: payload.displayName,
        phone: payload.phone,
        birth_date: payload.birthDate,
        avatar_url: payload.avatarUrl || localUser.user_metadata?.avatar_url,
        cep: payload.cep,
        street: payload.street,
        number: payload.number,
        neighborhood: payload.neighborhood,
        city: payload.city,
        state: payload.state,
      } as any,
    })
  }

  revalidatePath('/', 'layout')
  revalidatePath('/office')
  return { success: true }
}

export async function syncUserPreferencesAction(input: {
  followedStoreIds?: string[]
  favoriteProductIds?: string[]
}): Promise<{ success: boolean }> {
  const cookieStore = await cookies()

  if (input.followedStoreIds) {
    cookieStore.set(
      FOLLOWED_STORES_COOKIE,
      encodeURIComponent(JSON.stringify(input.followedStoreIds)),
      {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      }
    )
  }

  if (input.favoriteProductIds) {
    cookieStore.set(
      FAVORITE_PRODUCTS_COOKIE,
      encodeURIComponent(JSON.stringify(input.favoriteProductIds)),
      {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      }
    )
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const updateData: Record<string, any> = {}
      if (input.followedStoreIds) updateData.followed_store_ids = input.followedStoreIds
      if (input.favoriteProductIds) updateData.favorite_product_ids = input.favoriteProductIds
      await supabase.auth.updateUser({ data: updateData })
    }
  } catch {
    // ignore
  }

  const localUser = await getLocalSessionUser()
  if (localUser) {
    await setLocalSessionUser({
      ...localUser,
      user_metadata: {
        ...localUser.user_metadata,
        ...(input.followedStoreIds ? { followed_store_ids: input.followedStoreIds } : {}),
        ...(input.favoriteProductIds ? { favorite_product_ids: input.favoriteProductIds } : {}),
      } as any,
    })
  }

  revalidatePath('/')
  revalidatePath('/office')
  return { success: true }
}
