import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'

interface ClickEvent {
  storeId: string
  productId?: string | null
  clickedAt: string
}

interface ClickStoreFile {
  storeTotals: Record<string, number>
  productTotals: Record<string, number>
  events: ClickEvent[]
}

const IS_SERVERLESS = Boolean(process.env.VERCEL)
const DATA_DIR = path.join(process.cwd(), 'data')
const CLICKS_FILE = path.join(DATA_DIR, 'whatsapp-clicks.json')

const EMPTY_FILE: ClickStoreFile = {
  storeTotals: {},
  productTotals: {},
  events: [],
}

function readLocalClicks(): ClickStoreFile {
  if (IS_SERVERLESS) return { ...EMPTY_FILE, storeTotals: {}, productTotals: {}, events: [] }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(CLICKS_FILE)) {
      fs.writeFileSync(CLICKS_FILE, JSON.stringify(EMPTY_FILE, null, 2), 'utf-8')
      return { ...EMPTY_FILE, storeTotals: {}, productTotals: {}, events: [] }
    }
    const parsed = JSON.parse(fs.readFileSync(CLICKS_FILE, 'utf-8') || '{}')
    return {
      storeTotals: parsed.storeTotals || {},
      productTotals: parsed.productTotals || {},
      events: Array.isArray(parsed.events) ? parsed.events : [],
    }
  } catch {
    return { ...EMPTY_FILE, storeTotals: {}, productTotals: {}, events: [] }
  }
}

function writeLocalClicks(data: ClickStoreFile) {
  if (IS_SERVERLESS) return
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    // Mantém até 5000 eventos recentes para o arquivo não crescer indefinidamente
    const trimmed: ClickStoreFile = {
      ...data,
      events: data.events.slice(-5000),
    }
    fs.writeFileSync(CLICKS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
  } catch {
    // ignore
  }
}

export async function recordWhatsappClickServer({
  storeId,
  productId,
}: {
  storeId: string
  productId?: string | null
}): Promise<void> {
  if (!storeId) return
  const nowIso = new Date().toISOString()

  // 1. Gravação local (sempre garantida em ambiente local)
  const local = readLocalClicks()
  local.storeTotals[storeId] = (local.storeTotals[storeId] || 0) + 1
  if (productId) {
    local.productTotals[productId] = (local.productTotals[productId] || 0) + 1
  }
  local.events.push({ storeId, productId: productId || null, clickedAt: nowIso })
  writeLocalClicks(local)

  // 2. Gravação no Supabase (tabela whatsapp_clicks e contadores em stores/products)
  try {
    const supabase = await createClient()

    await supabase.from('whatsapp_clicks').insert({
      store_id: storeId,
      product_id: productId || null,
      created_at: nowIso,
    })

    // Incrementa coluna whatsapp_clicks na loja (se existir)
    const { data: storeRow } = await supabase
      .from('stores')
      .select('whatsapp_clicks')
      .eq('id', storeId)
      .maybeSingle()

    if (storeRow && typeof storeRow.whatsapp_clicks === 'number') {
      await supabase
        .from('stores')
        .update({ whatsapp_clicks: storeRow.whatsapp_clicks + 1 })
        .eq('id', storeId)
    }

    // Incrementa coluna whatsapp_clicks no produto (se existir)
    if (productId) {
      const { data: prodRow } = await supabase
        .from('products')
        .select('whatsapp_clicks')
        .eq('id', productId)
        .maybeSingle()

      if (prodRow && typeof prodRow.whatsapp_clicks === 'number') {
        await supabase
          .from('products')
          .update({ whatsapp_clicks: prodRow.whatsapp_clicks + 1 })
          .eq('id', productId)
      }
    }
  } catch {
    // Silencioso caso a tabela/coluna ainda não exista no Supabase
  }
}

export interface StoreWhatsappStats {
  totalClicks: number
  weeklyClicks: number
  byProduct: Record<string, number>
}

export async function getStoreWhatsappStatsServer(
  storeId: string
): Promise<StoreWhatsappStats> {
  const weekAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
  const local = readLocalClicks()

  const localStoreEvents = local.events.filter((e) => e.storeId === storeId)
  const localWeekly = localStoreEvents.filter(
    (e) => new Date(e.clickedAt).getTime() >= weekAgoMs
  ).length
  const localTotal = Math.max(local.storeTotals[storeId] || 0, localStoreEvents.length)
  const localByProduct: Record<string, number> = {}
  for (const ev of localStoreEvents) {
    if (ev.productId) {
      localByProduct[ev.productId] = (localByProduct[ev.productId] || 0) + 1
    }
  }

  let dbTotal = 0
  let dbWeekly = 0
  const dbByProduct: Record<string, number> = {}

  try {
    const supabase = await createClient()

    const { data: clickRows } = await supabase
      .from('whatsapp_clicks')
      .select('product_id, created_at')
      .eq('store_id', storeId)

    if (clickRows && clickRows.length > 0) {
      dbTotal = clickRows.length
      for (const row of clickRows) {
        if (new Date(row.created_at).getTime() >= weekAgoMs) {
          dbWeekly += 1
        }
        if (row.product_id) {
          dbByProduct[row.product_id] = (dbByProduct[row.product_id] || 0) + 1
        }
      }
    } else {
      const { data: storeRow } = await supabase
        .from('stores')
        .select('whatsapp_clicks')
        .eq('id', storeId)
        .maybeSingle()

      if (storeRow && typeof storeRow.whatsapp_clicks === 'number') {
        dbTotal = storeRow.whatsapp_clicks
        dbWeekly = storeRow.whatsapp_clicks
      }
    }
  } catch {
    // fallback local
  }

  const byProduct: Record<string, number> = { ...localByProduct }
  for (const [pid, count] of Object.entries(dbByProduct)) {
    byProduct[pid] = Math.max(byProduct[pid] || 0, count)
  }

  return {
    totalClicks: Math.max(localTotal, dbTotal),
    weeklyClicks: Math.max(localWeekly, dbWeekly),
    byProduct,
  }
}
