import { StoreCategoryWithSubcategories } from '@/lib/categories-storage'

export const CAR_MAIN_CATEGORIES: string[] = [
  'Sedan',
  'Hatch',
  'SUV',
  'Crossover',
  'Picape',
  'Pickup',
  'Camionete',
  'Picape compacta',
  'Picape média',
  'Picape grande',
  'Conversível',
  'Coupé',
  'Fastback',
  'Perua',
  'Minivan',
  'Van',
  'Furgão',
  'Utilitário',
  'Jipe',
  'Off-road',
  'Esportivo',
  'Antigo',
  'Blindado',
]

export const CAR_SUBCATEGORIES_MAP: Record<string, string[]> = {
  sedan: ['Sedan compacto', 'Sedan médio', 'Sedan grande', 'Sedan de luxo'],
  hatch: ['Hatch compacto', 'Hatch médio'],
  suv: ['SUV compacto', 'SUV médio', 'SUV grande', 'SUV de luxo', 'SUV cupê'],
  pickup: [
    'Picape cabine simples',
    'Picape cabine estendida',
    'Picape cabine dupla',
    'Picape cabine tripla',
  ],
  picape: [
    'Picape cabine simples',
    'Picape cabine estendida',
    'Picape cabine dupla',
    'Picape cabine tripla',
  ],
}

export function isUsedOrDealershipCarStore(
  storeCategory?: string | null,
  storeSubcategories?: string[] | null
): boolean {
  const cat = (storeCategory || '').toLowerCase().trim()
  if (cat !== 'carro') return false
  if (!storeSubcategories || storeSubcategories.length === 0) return false
  return storeSubcategories.some((sub) => {
    const s = sub.toLowerCase().trim()
    return s === 'usados' || s === 'concessionária' || s === 'concessionaria'
  })
}

export function buildReadyCarStoreCategories(
  storeId: string = 'car-store'
): StoreCategoryWithSubcategories[] {
  const now = new Date().toISOString()
  const toSlug = (val: string) =>
    val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

  return CAR_MAIN_CATEGORIES.map((catName, idx) => {
    const catId = `car-ready-cat-${idx}`
    const subs = CAR_SUBCATEGORIES_MAP[catName.toLowerCase().trim()] || []
    return {
      id: catId,
      store_id: storeId,
      name: catName,
      slug: toSlug(catName),
      is_active: true,
      display_order: idx,
      created_at: now,
      subcategories: subs.map((subName, sIdx) => ({
        id: `car-ready-sub-${idx}-${sIdx}`,
        category_id: catId,
        store_id: storeId,
        name: subName,
        slug: toSlug(subName),
        is_active: true,
        display_order: sIdx,
        created_at: now,
      })),
    }
  })
}
