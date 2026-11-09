import { SupabaseClient } from '@supabase/supabase-js'
import { getPlan, PlanId } from './plans'

export type SubscriptionStatus = 'active' | 'past_due' | 'downgraded' | 'canceled'
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export interface DueDateCalculation {
  dueDate: string // YYYY-MM-DD
  gracePeriodStart: string // ISO string
  gracePeriodEnd: string // ISO string
}

/**
 * Calcula o vencimento fixo no dia 10 de cada mês e o período de tolerância de 10 dias corridos.
 */
export function calculateSubscriptionCycle(referenceDate: Date = new Date()): DueDateCalculation {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed

  // Vencimento sempre no dia 10 do mês de referência
  const dueDateObj = new Date(Date.UTC(year, month, 10, 23, 59, 59))
  
  // Data em formato YYYY-MM-DD
  const yearStr = dueDateObj.getUTCFullYear()
  const monthStr = String(dueDateObj.getUTCMonth() + 1).padStart(2, '0')
  const dayStr = String(dueDateObj.getUTCDate()).padStart(2, '0')
  const dueDate = `${yearStr}-${monthStr}-${dayStr}`

  // Tolerância de 10 dias corridos a partir do dia 10 (encerra no dia 20 às 23:59:59 UTC)
  const graceStartObj = new Date(Date.UTC(year, month, 11, 0, 0, 0))
  const graceEndObj = new Date(Date.UTC(year, month, 20, 23, 59, 59))

  return {
    dueDate,
    gracePeriodStart: graceStartObj.toISOString(),
    gracePeriodEnd: graceEndObj.toISOString(),
  }
}

/**
 * Retorna a próxima data de vencimento (dia 10 do próximo mês)
 */
export function calculateNextPeriodDueDate(referenceDate: Date = new Date()): string {
  const nextMonth = new Date(referenceDate)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const year = nextMonth.getFullYear()
  const monthStr = String(nextMonth.getMonth() + 1).padStart(2, '0')
  return `${year}-${monthStr}-10`
}

/**
 * Registra uma entrada na tabela de auditoria de assinaturas
 */
export async function logSubscriptionAudit(
  adminClient: SupabaseClient,
  params: {
    storeId: string
    actorType: 'system_cron' | 'webhook' | 'admin_user' | 'merchant'
    actorId?: string | null
    action: string
    previousState?: Record<string, unknown> | null
    newState?: Record<string, unknown> | null
    details?: string
  }
) {
  try {
    await adminClient.from('subscription_audit_logs').insert({
      store_id: params.storeId,
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      action: params.action,
      previous_state: params.previousState || null,
      new_state: params.newState || null,
      details: params.details || null,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Falha ao gravar log de auditoria de assinatura:', err)
  }
}

/**
 * Aplica rebaixamento automático para o plano Bronze (gratuito)
 * mantendo apenas os 20 produtos ativos mais recentes e suspendendo os excedentes sem apagá-los.
 */
export async function executeDowngradeToBronze(
  adminClient: SupabaseClient,
  storeId: string,
  reason: string = 'unpaid_grace_period_expired',
  actorType: 'system_cron' | 'admin_user' = 'system_cron',
  actorId?: string | null
) {
  // 1. Obter estado atual da loja
  const { data: store, error: storeErr } = await adminClient
    .from('stores')
    .select('id, name, plan, contracted_plan, effective_plan, subscription_status, payment_status')
    .eq('id', storeId)
    .single()

  if (storeErr || !store) {
    throw new Error(`Loja ${storeId} não encontrada para downgrade: ${storeErr?.message}`)
  }

  const previousState = {
    plan: store.plan,
    contracted_plan: store.contracted_plan,
    effective_plan: store.effective_plan,
    subscription_status: store.subscription_status,
    payment_status: store.payment_status,
  }

  // 2. Rebaixar plano efetivo para 'bronze', preservando contracted_plan
  const { error: updateStoreErr } = await adminClient
    .from('stores')
    .update({
      effective_plan: 'bronze',
      subscription_status: 'downgraded',
      downgrade_reason: reason,
      previous_plan: store.effective_plan || store.contracted_plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', storeId)

  if (updateStoreErr) {
    throw new Error(`Erro ao atualizar loja ${storeId} no rebaixamento: ${updateStoreErr.message}`)
  }

  // 3. Regra determinística de suspensão de produtos excedentes:
  // ORDER BY is_active DESC, published_at DESC, id DESC
  const { data: products, error: prodErr } = await adminClient
    .from('products')
    .select('id, name, is_active, published_at, suspended_by_downgrade')
    .eq('store_id', storeId)
    .order('is_active', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })

  let suspendedCount = 0

  if (!prodErr && products && products.length > 0) {
    // Apenas produtos que atualmente estão ativos concorrem aos 20 primeiros
    const activeProducts = products.filter((p) => p.is_active)
    
    // Os 20 primeiros continuam ativos
    const keepActiveIds = activeProducts.slice(0, 20).map((p) => p.id)
    // Os que excedem 20 são suspensos por downgrade
    const surplusActiveIds = activeProducts.slice(20).map((p) => p.id)

    if (surplusActiveIds.length > 0) {
      const { error: suspendErr } = await adminClient
        .from('products')
        .update({
          is_active: false,
          suspended_by_downgrade: true,
          updated_at: new Date().toISOString(),
        })
        .in('id', surplusActiveIds)

      if (suspendErr) {
        console.error(`Erro ao suspender produtos excedentes da loja ${storeId}:`, suspendErr)
      } else {
        suspendedCount = surplusActiveIds.length
      }
    }
  }

  // 4. Logar ação de auditoria
  await logSubscriptionAudit(adminClient, {
    storeId,
    actorType,
    actorId,
    action: 'downgraded_to_free',
    previousState,
    newState: {
      effective_plan: 'bronze',
      subscription_status: 'downgraded',
      downgrade_reason: reason,
      suspended_products_count: suspendedCount,
    },
    details: `Rebaixamento automático executado por inadimplência após tolerância. ${suspendedCount} produtos excedentes suspensos com flag suspended_by_downgrade=true.`,
  })

  return { success: true, suspendedCount }
}

/**
 * Reativação automática dos benefícios do plano e restauração dos produtos suspensos
 * após confirmação de pagamento.
 */
export async function executeReactivation(
  adminClient: SupabaseClient,
  storeId: string,
  params: {
    actorType?: 'webhook' | 'admin_user' | 'system_cron'
    actorId?: string | null
    paymentProvider?: string
    invoiceId?: string | null
    paymentAmountCents?: number
  } = {}
) {
  const { data: store, error: storeErr } = await adminClient
    .from('stores')
    .select('id, name, contracted_plan, effective_plan, subscription_status, payment_status, current_period_due_date')
    .eq('id', storeId)
    .single()

  if (storeErr || !store) {
    throw new Error(`Loja ${storeId} não encontrada para reativação: ${storeErr?.message}`)
  }

  const previousState = {
    contracted_plan: store.contracted_plan,
    effective_plan: store.effective_plan,
    subscription_status: store.subscription_status,
    payment_status: store.payment_status,
  }

  const restoredPlan = (store.contracted_plan || 'bronze') as PlanId
  const planConfig = getPlan(restoredPlan)
  const maxActiveAllowed = planConfig.maxActiveProducts
  const now = new Date()
  const nextDueDate = calculateNextPeriodDueDate(now)

  // 1. Atualizar status da loja restaurando effective_plan = contracted_plan
  const { error: updateStoreErr } = await adminClient
    .from('stores')
    .update({
      effective_plan: restoredPlan,
      subscription_status: 'active',
      payment_status: 'paid',
      last_payment_date: now.toISOString(),
      current_period_due_date: nextDueDate,
      grace_period_start: null,
      grace_period_end: null,
      downgrade_reason: null,
      updated_at: now.toISOString(),
    })
    .eq('id', storeId)

  if (updateStoreErr) {
    throw new Error(`Erro ao atualizar loja na reativação: ${updateStoreErr.message}`)
  }

  // 2. Restaurar produtos que foram suspensos pelo downgrade, respeitando o limite do plano contratado
  // Consultar produtos atualmente ativos
  const { count: currentActiveCount } = await adminClient
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_active', true)

  const activeCount = currentActiveCount || 0
  const availableSlots = Math.max(0, maxActiveAllowed - activeCount)

  let reactivatedCount = 0

  if (availableSlots > 0) {
    // Buscar produtos com suspended_by_downgrade = true
    const { data: suspendedProducts } = await adminClient
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('suspended_by_downgrade', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(availableSlots)

    if (suspendedProducts && suspendedProducts.length > 0) {
      const idsToReactivate = suspendedProducts.map((p) => p.id)
      const { error: reactivateErr } = await adminClient
        .from('products')
        .update({
          is_active: true,
          suspended_by_downgrade: false,
          updated_at: now.toISOString(),
        })
        .in('id', idsToReactivate)

      if (!reactivateErr) {
        reactivatedCount = idsToReactivate.length
      } else {
        console.error(`Erro ao reativar produtos da loja ${storeId}:`, reactivateErr)
      }
    }
  }

  // 3. Atualizar fatura se informada
  if (params.invoiceId) {
    await adminClient
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', params.invoiceId)
  }

  // 4. Log de auditoria
  await logSubscriptionAudit(adminClient, {
    storeId,
    actorType: params.actorType || 'webhook',
    actorId: params.actorId || null,
    action: 'reactivated_after_payment',
    previousState,
    newState: {
      effective_plan: restoredPlan,
      subscription_status: 'active',
      payment_status: 'paid',
      reactivated_products_count: reactivatedCount,
      next_due_date: nextDueDate,
    },
    details: `Pagamento confirmado. Benefícios do plano ${planConfig.name} restaurados. ${reactivatedCount} produtos reativados automaticamente.`,
  })

  return {
    success: true,
    restoredPlan,
    reactivatedCount,
    nextDueDate,
  }
}

/**
 * Rotina executada periodicamente (via CRON diário) para:
 * 1. Identificar assinaturas vencidas no dia 10 e iniciar tolerância de 10 dias.
 * 2. Identificar tolerâncias expiradas (dia 21 em diante) e rebaixar lojas inadimplentes para Bronze.
 */
export async function runBillingReconciliation(
  adminClient: SupabaseClient,
  referenceDate: Date = new Date()
) {
  const now = referenceDate
  const todayStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
  const nowUtc = now.getTime()

  // Buscar todas as lojas com planos pagos contratados
  const { data: paidStores, error: storesErr } = await adminClient
    .from('stores')
    .select('id, name, contracted_plan, effective_plan, monthly_fee_cents, due_day, current_period_due_date, grace_period_start, grace_period_end, subscription_status, payment_status')
    .neq('contracted_plan', 'bronze')

  if (storesErr) {
    throw new Error(`Erro ao buscar lojas para reconciliação de cobrança: ${storesErr.message}`)
  }

  let markedPastDueCount = 0
  let downgradedCount = 0
  const errors: string[] = []

  for (const store of paidStores || []) {
    try {
      const cycle = calculateSubscriptionCycle(now)
      const storeDueDate = store.current_period_due_date || cycle.dueDate
      const isPastDueDate = todayStr > storeDueDate
      const isUnpaid = store.payment_status !== 'paid'

      // CENÁRIO A: Vencida dentro do período de tolerância
      // Hoje > dia 10 e status ainda não está 'past_due' nem 'downgraded'
      if (isPastDueDate && isUnpaid && store.subscription_status === 'active') {
        const { error: markErr } = await adminClient
          .from('stores')
          .update({
            subscription_status: 'past_due',
            payment_status: 'pending',
            grace_period_start: cycle.gracePeriodStart,
            grace_period_end: cycle.gracePeriodEnd,
            updated_at: now.toISOString(),
          })
          .eq('id', store.id)

        if (!markErr) {
          markedPastDueCount++
          await logSubscriptionAudit(adminClient, {
            storeId: store.id,
            actorType: 'system_cron',
            action: 'marked_past_due',
            previousState: {
              subscription_status: store.subscription_status,
              payment_status: store.payment_status,
            },
            newState: {
              subscription_status: 'past_due',
              payment_status: 'pending',
              grace_period_start: cycle.gracePeriodStart,
              grace_period_end: cycle.gracePeriodEnd,
            },
            details: `Vencimento do dia 10 atingido sem pagamento confirmado. Tolerância de 10 dias corridos ativada até ${cycle.gracePeriodEnd}.`,
          })
        }
      }

      // CENÁRIO B: Tolerância expirada (após 10 dias corridos de tolerância)
      // Loja continua inadimplente e agora é além do término da tolerância
      const graceEndTs = store.grace_period_end ? new Date(store.grace_period_end).getTime() : new Date(cycle.gracePeriodEnd).getTime()
      const isGraceExpired = nowUtc > graceEndTs

      if (isUnpaid && isGraceExpired && store.effective_plan !== 'bronze') {
        await executeDowngradeToBronze(
          adminClient,
          store.id,
          'unpaid_grace_period_expired',
          'system_cron'
        )
        downgradedCount++
      }
    } catch (storeError: any) {
      errors.push(`Erro na loja ${store.id}: ${storeError.message || storeError}`)
    }
  }

  return {
    processedStores: paidStores?.length || 0,
    markedPastDueCount,
    downgradedCount,
    errors,
  }
}
