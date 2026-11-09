import fs from 'fs'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'

export interface PromoCampaignTimer {
  storeId: string
  storeName?: string
  title: string
  startDate: string
  endDate: string
  isActive: boolean
  updatedAt: string
}

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const TIMERS_FILE = path.join(DATA_DIR, 'promo-timers.json')

function ensureTimersFile() {
  if (IS_SERVERLESS) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(TIMERS_FILE)) {
      fs.writeFileSync(TIMERS_FILE, JSON.stringify([], null, 2), 'utf-8')
    }
  } catch {
    // ignore
  }
}

export function getLocalPromoTimers(): PromoCampaignTimer[] {
  if (IS_SERVERLESS) return []
  ensureTimersFile()
  try {
    if (fs.existsSync(TIMERS_FILE)) {
      const raw = fs.readFileSync(TIMERS_FILE, 'utf-8')
      const parsed = JSON.parse(raw || '[]')
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function saveLocalPromoTimer(timer: PromoCampaignTimer): PromoCampaignTimer {
  if (IS_SERVERLESS) return timer
  ensureTimersFile()
  try {
    const list = getLocalPromoTimers()
    const idx = list.findIndex((t) => t.storeId === timer.storeId)
    if (idx >= 0) {
      list[idx] = timer
    } else {
      list.unshift(timer)
    }
    fs.writeFileSync(TIMERS_FILE, JSON.stringify(list, null, 2), 'utf-8')
  } catch {
    // ignore
  }
  return timer
}

export async function getAllPromoTimersServer(): Promise<PromoCampaignTimer[]> {
  const localList = getLocalPromoTimers()
  let remoteList: PromoCampaignTimer[] = []

  try {
    const admin = createAdminClient()
    const { data: pubUrl } = admin.storage.from('stores').getPublicUrl('timers/all-timers.json')
    if (pubUrl?.publicUrl) {
      const res = await fetch(`${pubUrl.publicUrl}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (Array.isArray(json)) {
          remoteList = json
        }
      }
    }
  } catch {
    // ignore
  }

  const map = new Map<string, PromoCampaignTimer>()
  for (const item of remoteList) {
    if (item && item.storeId) map.set(item.storeId, item)
  }
  for (const item of localList) {
    if (item && item.storeId) {
      const existing = map.get(item.storeId)
      if (!existing || new Date(item.updatedAt) >= new Date(existing.updatedAt)) {
        map.set(item.storeId, item)
      }
    }
  }

  return Array.from(map.values())
}

export async function getStorePromoTimerServer(storeId: string): Promise<PromoCampaignTimer | null> {
  if (!storeId) return null
  const all = await getAllPromoTimersServer()
  return all.find((t) => t.storeId === storeId) || null
}

export async function saveStorePromoTimerServer(
  timer: PromoCampaignTimer
): Promise<PromoCampaignTimer> {
  saveLocalPromoTimer(timer)

  try {
    const all = await getAllPromoTimersServer()
    const idx = all.findIndex((t) => t.storeId === timer.storeId)
    if (idx >= 0) {
      all[idx] = timer
    } else {
      all.unshift(timer)
    }

    const admin = createAdminClient()
    const buffer = Buffer.from(JSON.stringify(all, null, 2), 'utf-8')
    await admin.storage.from('stores').upload('timers/all-timers.json', buffer, {
      contentType: 'application/json',
      upsert: true,
    })
  } catch {
    // ignore
  }

  return timer
}
