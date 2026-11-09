'use server'

import { revalidatePath } from 'next/cache'
import {
  PromoCampaignTimer,
  getStorePromoTimerServer,
  getAllPromoTimersServer,
  saveStorePromoTimerServer,
} from '@/lib/promo-timer-storage'

export async function getStorePromoTimerAction(storeId: string): Promise<{
  success: boolean
  timer: PromoCampaignTimer | null
}> {
  if (!storeId) return { success: true, timer: null }
  const timer = await getStorePromoTimerServer(storeId)
  return { success: true, timer }
}

export async function getAllPromoTimersAction(): Promise<{
  success: boolean
  timers: PromoCampaignTimer[]
}> {
  const timers = await getAllPromoTimersServer()
  return { success: true, timers }
}

export async function saveStorePromoTimerAction(input: {
  storeId: string
  storeName?: string
  title: string
  startDate: string
  endDate: string
  isActive: boolean
}): Promise<{
  success: boolean
  timer?: PromoCampaignTimer
  error?: string
}> {
  if (!input.storeId) {
    return { success: false, error: 'Loja não identificada.' }
  }
  if (!input.title.trim()) {
    return { success: false, error: 'Informe o nome ou modalidade da campanha (ex.: Outlet).' }
  }
  if (!input.startDate || !input.endDate) {
    return { success: false, error: 'Informe a data de início e a data de fim da promoção.' }
  }

  const startMs = new Date(input.startDate).getTime()
  const endMs = new Date(input.endDate).getTime()
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return {
      success: false,
      error: 'A data de fim deve ser posterior à data de início da promoção.',
    }
  }

  const saved = await saveStorePromoTimerServer({
    storeId: input.storeId,
    storeName: input.storeName || '',
    title: input.title.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    isActive: Boolean(input.isActive),
    updatedAt: new Date().toISOString(),
  })

  revalidatePath('/', 'layout')
  revalidatePath(`/loja/${input.storeId}`)
  revalidatePath('/painel/loja')

  return { success: true, timer: saved }
}
