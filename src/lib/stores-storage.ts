import fs from 'fs'
import path from 'path'
import { SupabaseClient } from '@supabase/supabase-js'

export interface StoredStore {
  id: string
  owner_id: string
  name: string
  slug: string
  responsible_name: string | null
  phone: string | null
  cep: string | null
  street: string | null
  number: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  category: string
  subcategories: string[]
  large_banner_url: string | null
  small_banner_url: string | null
  logo_url: string | null
  description: string | null
  cnpj_cpf: string | null
  plan: string
  contracted_plan?: string
  effective_plan?: string
  subscription_status?: string
  payment_status?: string
  followers_count?: number
  last_payment_date?: string | null
  downgrade_reason?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
}

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const STORES_FILE = path.join(DATA_DIR, 'stores.json')

function ensureDataFile() {
  if (IS_SERVERLESS) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(STORES_FILE)) {
      fs.writeFileSync(STORES_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch (err) {
    console.warn('Erro ao verificar diretório de dados:', err)
  }
}

export function getLocalStores(): StoredStore[] {
  if (IS_SERVERLESS) return []
  ensureDataFile()
  try {
    if (fs.existsSync(STORES_FILE)) {
      const content = fs.readFileSync(STORES_FILE, 'utf-8')
      return JSON.parse(content || '[]')
    }
  } catch (err) {
    console.warn('Erro ao ler stores.json local:', err)
  }
  return []
}

export function saveLocalStore(store: StoredStore): StoredStore {
  if (IS_SERVERLESS) return store
  ensureDataFile()
  try {
    const list = getLocalStores()
    const index = list.findIndex((s) => s.id === store.id)
    if (index >= 0) {
      list[index] = { ...list[index], ...store, updated_at: new Date().toISOString() }
    } else {
      list.unshift(store)
    }
    fs.writeFileSync(STORES_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Erro ao gravar stores.json local:', err)
  }
  return store
}

export function getLocalStoreById(idOrSlug: string): StoredStore | null {
  const list = getLocalStores()
  return list.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null
}

export function getLocalStoresByOwner(ownerId: string): StoredStore[] {
  const list = getLocalStores()
  return list.filter((s) => s.owner_id === ownerId)
}
