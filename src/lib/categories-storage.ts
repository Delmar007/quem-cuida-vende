import fs from 'fs'
import path from 'path'

export interface StoreCategory {
  id: string
  store_id: string
  name: string
  slug: string
  description?: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at?: string
}

export interface StoreSubcategory {
  id: string
  category_id: string
  store_id: string
  name: string
  slug: string
  description?: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at?: string
}

export interface StoreCategoryWithSubcategories extends StoreCategory {
  subcategories: StoreSubcategory[]
  products_count?: number
}

interface CategoriesDataStore {
  categories: StoreCategory[]
  subcategories: StoreSubcategory[]
  initializedStores?: string[]
}

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json')

function ensureDataFile() {
  if (IS_SERVERLESS) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(CATEGORIES_FILE)) {
      const initial: CategoriesDataStore = { categories: [], subcategories: [], initializedStores: [] }
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(initial, null, 2), 'utf-8')
    }
  } catch (err) {
    console.warn('Erro ao verificar diretório de categorias:', err)
  }
}

export function getLocalCategoriesData(): CategoriesDataStore {
  if (IS_SERVERLESS) return { categories: [], subcategories: [], initializedStores: [] }
  ensureDataFile()
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const content = fs.readFileSync(CATEGORIES_FILE, 'utf-8')
      const parsed = JSON.parse(content || '{}')
      return {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        subcategories: Array.isArray(parsed.subcategories) ? parsed.subcategories : [],
        initializedStores: Array.isArray(parsed.initializedStores) ? parsed.initializedStores : [],
      }
    }
  } catch (err) {
    console.warn('Erro ao ler categories.json local:', err)
  }
  return { categories: [], subcategories: [], initializedStores: [] }
}

export function saveLocalCategoriesData(data: CategoriesDataStore) {
  if (IS_SERVERLESS) return
  ensureDataFile()
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Erro ao gravar categories.json local:', err)
  }
}

export function getLocalStoreCategories(storeId: string): StoreCategoryWithSubcategories[] {
  const data = getLocalCategoriesData()
  let cats = data.categories.filter((c) => c.store_id === storeId)

  // Se a loja não tem categorias ainda e nunca foi inicializada ou limpa pelo lojista, cria as categorias padrão
  if (cats.length === 0) {
    const initialized = data.initializedStores || []
    if (!initialized.includes(storeId)) {
      const defaultData = createDefaultStoreCategories(storeId)
      cats = defaultData.categories
      data.categories.push(...defaultData.categories)
      data.subcategories.push(...defaultData.subcategories)
      data.initializedStores = [...initialized, storeId]
      saveLocalCategoriesData(data)
    }
  }

  // Ordenar por display_order
  cats.sort((a, b) => a.display_order - b.display_order)

  const subs = data.subcategories.filter((s) => s.store_id === storeId)

  return cats.map((cat) => ({
    ...cat,
    subcategories: subs
      .filter((s) => s.category_id === cat.id)
      .sort((a, b) => a.display_order - b.display_order),
  }))
}

export function saveLocalCategory(category: StoreCategory): StoreCategory {
  const data = getLocalCategoriesData()
  const index = data.categories.findIndex((c) => c.id === category.id)
  if (index >= 0) {
    data.categories[index] = { ...data.categories[index], ...category, updated_at: new Date().toISOString() }
  } else {
    data.categories.push(category)
  }
  saveLocalCategoriesData(data)
  return category
}

export function deleteLocalCategory(categoryId: string, storeId?: string): boolean {
  const data = getLocalCategoriesData()
  data.categories = data.categories.filter((c) => {
    if (storeId && c.store_id !== storeId) return true
    return c.id !== categoryId
  })
  // Cascade delete subcategories
  data.subcategories = data.subcategories.filter((s) => {
    if (storeId && s.store_id !== storeId) return true
    return s.category_id !== categoryId
  })
  saveLocalCategoriesData(data)
  return true
}

export function saveLocalSubcategory(subcategory: StoreSubcategory): StoreSubcategory {
  const data = getLocalCategoriesData()
  const index = data.subcategories.findIndex((s) => s.id === subcategory.id)
  if (index >= 0) {
    data.subcategories[index] = { ...data.subcategories[index], ...subcategory, updated_at: new Date().toISOString() }
  } else {
    data.subcategories.push(subcategory)
  }
  saveLocalCategoriesData(data)
  return subcategory
}

export function deleteLocalSubcategory(subcategoryId: string, storeId?: string): boolean {
  const data = getLocalCategoriesData()
  data.subcategories = data.subcategories.filter((s) => {
    if (storeId && s.store_id !== storeId) return true
    return s.id !== subcategoryId
  })
  saveLocalCategoriesData(data)
  return true
}

export function clearLocalStoreCategories(storeId: string): boolean {
  const data = getLocalCategoriesData()
  data.categories = data.categories.filter((c) => c.store_id !== storeId)
  data.subcategories = data.subcategories.filter((s) => s.store_id !== storeId)
  if (!data.initializedStores) data.initializedStores = []
  if (!data.initializedStores.includes(storeId)) {
    data.initializedStores.push(storeId)
  }
  saveLocalCategoriesData(data)
  return true
}

/**
 * Cria categorias padrão de alta qualidade para inicialização da loja.
 * Inclui exatamente o exemplo do usuário: Categoria Camisas (Cavada, Manga Longa, Gola Rolê, Polo).
 */
export function createDefaultStoreCategories(storeId: string): {
  categories: StoreCategory[]
  subcategories: StoreSubcategory[]
} {
  const now = new Date().toISOString()
  const safeId = storeId.replace(/[^a-zA-Z0-9_-]/g, '')
  const cat1Id = `cat-${safeId}-camisas`
  const cat2Id = `cat-${safeId}-calcas`
  const cat3Id = `cat-${safeId}-vestidos`

  const categories: StoreCategory[] = [
    {
      id: cat1Id,
      store_id: storeId,
      name: 'Camisas',
      slug: 'camisas',
      description: 'Camisas masculinas, femininas e casuais',
      is_active: true,
      display_order: 1,
      created_at: now,
    },
    {
      id: cat2Id,
      store_id: storeId,
      name: 'Calças',
      slug: 'calcas',
      description: 'Calças jeans, alfaiataria e casuais',
      is_active: true,
      display_order: 2,
      created_at: now,
    },
    {
      id: cat3Id,
      store_id: storeId,
      name: 'Vestidos',
      slug: 'vestidos',
      description: 'Vestidos para festa, dia a dia e trabalho',
      is_active: true,
      display_order: 3,
      created_at: now,
    },
  ]

  const subcategories: StoreSubcategory[] = [
    // Subcategorias de Camisas (exatamente como especificado no prompt do usuário)
    {
      id: `sub-${cat1Id}-cavada`,
      category_id: cat1Id,
      store_id: storeId,
      name: 'Cavada',
      slug: 'cavada',
      is_active: true,
      display_order: 1,
      created_at: now,
    },
    {
      id: `sub-${cat1Id}-manga-longa`,
      category_id: cat1Id,
      store_id: storeId,
      name: 'Manga Longa',
      slug: 'manga-longa',
      is_active: true,
      display_order: 2,
      created_at: now,
    },
    {
      id: `sub-${cat1Id}-gola-role`,
      category_id: cat1Id,
      store_id: storeId,
      name: 'Gola Rolê',
      slug: 'gola-role',
      is_active: true,
      display_order: 3,
      created_at: now,
    },
    {
      id: `sub-${cat1Id}-polo`,
      category_id: cat1Id,
      store_id: storeId,
      name: 'Polo',
      slug: 'polo',
      is_active: true,
      display_order: 4,
      created_at: now,
    },

    // Subcategorias de Calças
    {
      id: `sub-${cat2Id}-jeans`,
      category_id: cat2Id,
      store_id: storeId,
      name: 'Jeans',
      slug: 'jeans',
      is_active: true,
      display_order: 1,
      created_at: now,
    },
    {
      id: `sub-${cat2Id}-alfaiataria`,
      category_id: cat2Id,
      store_id: storeId,
      name: 'Alfaiataria',
      slug: 'alfaiataria',
      is_active: true,
      display_order: 2,
      created_at: now,
    },
    {
      id: `sub-${cat2Id}-moletom`,
      category_id: cat2Id,
      store_id: storeId,
      name: 'Moletom',
      slug: 'moletom',
      is_active: true,
      display_order: 3,
      created_at: now,
    },

    // Subcategorias de Vestidos
    {
      id: `sub-${cat3Id}-midi`,
      category_id: cat3Id,
      store_id: storeId,
      name: 'Midi',
      slug: 'midi',
      is_active: true,
      display_order: 1,
      created_at: now,
    },
    {
      id: `sub-${cat3Id}-longo`,
      category_id: cat3Id,
      store_id: storeId,
      name: 'Longo',
      slug: 'longo',
      is_active: true,
      display_order: 2,
      created_at: now,
    },
    {
      id: `sub-${cat3Id}-festa`,
      category_id: cat3Id,
      store_id: storeId,
      name: 'Festa',
      slug: 'festa',
      is_active: true,
      display_order: 3,
      created_at: now,
    },
  ]

  return { categories, subcategories }
}
