import fs from 'fs'
import path from 'path'

export interface StoredProduct {
  id: string
  store_id: string
  name: string
  description?: string | null
  price: number
  promotional_price?: number | null
  cost_price_internal?: number | null
  fipe_price_internal?: number | null
  image_url?: string | null
  images?: string[]
  photo_orientation?: 'vertical' | 'horizontal'
  sku?: string | null
  category: string
  subcategory?: string | null
  promo_type?: string | null
  is_vehicle?: boolean
  vehicle_category?: string | null
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_version?: string | null
  vehicle_year_fab?: string | null
  vehicle_year_model?: string | null
  vehicle_km?: string | null
  vehicle_transmission?: string | null
  vehicle_traction?: string | null
  vehicle_plate_internal?: string | null
  unit_type?: string | null
  unit_value?: string | null
  sizes?: string[] | null
  colors?: string[] | null
  is_outlet: boolean
  is_novidade: boolean
  is_active: boolean
  suspended_by_downgrade?: boolean
  published_at: string
  created_at: string
  updated_at?: string
}

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')

function ensureProductsFile() {
  if (IS_SERVERLESS) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(PRODUCTS_FILE)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch (err) {
    console.warn('Erro ao verificar diretório de produtos:', err)
  }
}

export function getLocalProducts(storeId?: string): StoredProduct[] {
  if (IS_SERVERLESS) return []
  ensureProductsFile()
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const content = fs.readFileSync(PRODUCTS_FILE, 'utf-8')
      const list: StoredProduct[] = JSON.parse(content || '[]')
      if (storeId) {
        return list.filter((p) => p.store_id === storeId)
      }
      return list
    }
  } catch (err) {
    console.warn('Erro ao ler products.json local:', err)
  }
  return []
}

export function saveLocalProduct(product: StoredProduct): StoredProduct {
  if (IS_SERVERLESS) return product
  ensureProductsFile()
  try {
    const list = getLocalProducts()
    const index = list.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      list[index] = { ...list[index], ...product, updated_at: new Date().toISOString() }
    } else {
      list.unshift(product)
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Erro ao gravar products.json local:', err)
  }
  return product
}

export function deleteLocalProduct(productId: string, storeId?: string): boolean {
  if (IS_SERVERLESS) return true
  ensureProductsFile()
  try {
    const list = getLocalProducts()
    const filtered = list.filter((p) => {
      if (storeId && p.store_id !== storeId) return true
      return p.id !== productId
    })
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.warn('Erro ao deletar produto local:', err)
    return false
  }
}
