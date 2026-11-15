const RESERVED_ROOT_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'feed',
  'login',
  'loja',
  'office',
  'oficce',
  'painel',
  'perfil',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
])

export function toStoreSlug(rawName: string): string {
  const base = rawName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  const slug = base || 'minha_loja'
  return RESERVED_ROOT_SLUGS.has(slug) ? `${slug}_loja` : slug
}

export function isReservedRootSlug(slug: string): boolean {
  return RESERVED_ROOT_SLUGS.has(slug.toLowerCase())
}

export function getStorePublicPath(store: { id: string; slug?: string | null }): string {
  const cleanSlug = store.slug?.trim()
  if (cleanSlug && !isReservedRootSlug(cleanSlug)) {
    return `/${cleanSlug}`
  }
  return `/loja/${store.id}`
}
