'use server'

import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'
import { createPlanPaymentPreference } from '@/lib/mercadopago'
import { getLocalStoresByOwner, getLocalStoreById } from '@/lib/stores-storage'

export async function createPlanCheckoutAction(params: {
  storeId: string
  planId: string
}): Promise<{
  success: boolean
  checkoutUrl?: string
  error?: string
}> {
  if (!params.storeId || !params.planId) {
    return { success: false, error: 'Identificador da loja e plano são obrigatórios.' }
  }

  const plan = getPlan(params.planId)
  if (!plan || plan.id === 'bronze' || plan.price <= 0) {
    return { success: false, error: 'Este plano é gratuito e não requer pagamento.' }
  }

  const supabase = await createClient()
  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  let store: any = null
  try {
    const { data } = await supabase
      .from('stores')
      .select('id, name, owner_id')
      .eq('id', params.storeId)
      .single()
    if (data) store = data
  } catch {
    // fallback
  }

  if (!store) {
    store = getLocalStoreById(params.storeId)
  }

  const storeName = store?.name || 'Minha Loja'
  const payerEmail = user?.email || undefined

  const result = await createPlanPaymentPreference({
    storeId: params.storeId,
    storeName,
    planId: plan.id as 'bronze_plus' | 'prata' | 'ouro' | 'auto_50' | 'auto_100',
    planName: plan.name,
    price: plan.price,
    payerEmail,
  })

  if (!result.success || !result.initPoint) {
    return {
      success: false,
      error: result.error || 'Não foi possível gerar a tela de pagamento do Mercado Pago.',
    }
  }

  return {
    success: true,
    checkoutUrl: result.initPoint,
  }
}
