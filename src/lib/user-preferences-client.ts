'use client'

import { syncUserPreferencesAction } from '@/app/actions/user-office'

const LS_FOLLOWED_STORES = 'kittanda_followed_stores'
const LS_FAVORITE_PRODUCTS = 'kittanda_favorite_products'

function getCookieArray(name: string): string[] {
  if (typeof document === 'undefined') return []
  try {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    if (match) {
      const parsed = JSON.parse(decodeURIComponent(match[2]))
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

function setCookieArray(name: string, items: string[]) {
  if (typeof document === 'undefined') return
  try {
    const encoded = encodeURIComponent(JSON.stringify(items))
    document.cookie = `${name}=${encoded}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  } catch {
    // ignore
  }
}

export function getClientFollowedStores(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const lsRaw = localStorage.getItem(LS_FOLLOWED_STORES)
    const lsArr = lsRaw ? JSON.parse(lsRaw) : []
    const cookieArr = getCookieArray(LS_FOLLOWED_STORES)
    return Array.from(
      new Set([
        ...(Array.isArray(lsArr) ? lsArr : []),
        ...cookieArr,
      ])
    )
  } catch {
    return []
  }
}

export function setClientFollowedStores(ids: string[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids.filter(Boolean)))
  try {
    localStorage.setItem(LS_FOLLOWED_STORES, JSON.stringify(unique))
  } catch {
    // ignore
  }
  setCookieArray(LS_FOLLOWED_STORES, unique)
  window.dispatchEvent(new CustomEvent('kittanda:followed-stores-changed', { detail: unique }))
  syncUserPreferencesAction({ followedStoreIds: unique }).catch(() => {})
}

export function toggleClientFollowStore(storeId: string): boolean {
  const current = getClientFollowedStores()
  const exists = current.includes(storeId)
  const next = exists ? current.filter((id) => id !== storeId) : [...current, storeId]
  setClientFollowedStores(next)
  return !exists
}

export function getClientFavoriteProducts(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const lsRaw = localStorage.getItem(LS_FAVORITE_PRODUCTS)
    const lsArr = lsRaw ? JSON.parse(lsRaw) : []
    const cookieArr = getCookieArray(LS_FAVORITE_PRODUCTS)
    return Array.from(
      new Set([
        ...(Array.isArray(lsArr) ? lsArr : []),
        ...cookieArr,
      ])
    )
  } catch {
    return []
  }
}

export function setClientFavoriteProducts(ids: string[]) {
  if (typeof window === 'undefined') return
  const unique = Array.from(new Set(ids.filter(Boolean)))
  try {
    localStorage.setItem(LS_FAVORITE_PRODUCTS, JSON.stringify(unique))
  } catch {
    // ignore
  }
  setCookieArray(LS_FAVORITE_PRODUCTS, unique)
  window.dispatchEvent(new CustomEvent('kittanda:favorite-products-changed', { detail: unique }))
  syncUserPreferencesAction({ favoriteProductIds: unique }).catch(() => {})
}

export function toggleClientFavoriteProduct(productId: string): boolean {
  const current = getClientFavoriteProducts()
  const exists = current.includes(productId)
  const next = exists ? current.filter((id) => id !== productId) : [...current, productId]
  setClientFavoriteProducts(next)
  return !exists
}
