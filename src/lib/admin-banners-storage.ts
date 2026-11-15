import fs from 'fs'
import path from 'path'
import {
  AdminBannerConfig,
  DEFAULT_ADMIN_BANNER_CONFIG,
  normalizeBannerConfig,
} from '@/lib/admin-banners-types'

export * from '@/lib/admin-banners-types'

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'admin-banners.json')

export function getAdminBannerConfigServer(): AdminBannerConfig {
  if (IS_SERVERLESS) return DEFAULT_ADMIN_BANNER_CONFIG
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_ADMIN_BANNER_CONFIG, null, 2), 'utf-8')
      return DEFAULT_ADMIN_BANNER_CONFIG
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
    return normalizeBannerConfig(JSON.parse(raw || '{}'))
  } catch {
    return DEFAULT_ADMIN_BANNER_CONFIG
  }
}

export function saveAdminBannerConfigServer(config: AdminBannerConfig): AdminBannerConfig {
  const normalized = {
    ...normalizeBannerConfig(config),
    updatedAt: new Date().toISOString(),
  }
  if (!IS_SERVERLESS) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(normalized, null, 2), 'utf-8')
    } catch (err) {
      console.warn('Erro ao salvar admin-banners.json:', err)
    }
  }
  return normalized
}
