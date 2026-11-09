'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { PLANS, PlanId, getPlan } from '@/lib/plans'
import { getLocalStoreById, saveLocalStore } from '@/lib/stores-storage'
import { getLocalProducts, saveLocalProduct } from '@/lib/products-storage'
import {
  calculateSubscriptionCycle,
  executeDowngradeToBronze,
  executeReactivation,
  logSubscriptionAudit,
} from '@/lib/subscriptions'

export interface StoreInvite {
  id: string
  code: string
  storeId: string
  storeName: string
  guestName?: string
  guestPhone?: string
  status: 'pending' | 'registered' | 'active'
  invitedStoreId?: string
  invitedStoreName?: string
  createdAt: string
  acceptedAt?: string
}

export interface StoreMetrics {
  storeViews: number
  productViews: number
  whatsappClicks: number
  favoritesCount: number
  followersCount: number
  conversionRate: string
  topProducts: {
    id: string
    name: string
    views: number
    favorites: number
    price: number
    imageUrl?: string
  }[]
  monthlyHistory: {
    label: string
    views: number
    contacts: number
  }[]
}

export interface FavoriteProductItem {
  id: string
  name: string
  price: number
  promotionalPrice?: number
  imageUrl?: string
  favoritesCount: number
  category: string
  isActive: boolean
}

export interface BirthdayFollower {
  id: string
  name: string
  phone?: string
  avatarUrl?: string
  birthDate: string // YYYY-MM-DD or DD/MM
  dayAndMonth: string
  isToday: boolean
  isThisWeek: boolean
  isThisMonth: boolean
  daysUntil: number
}

export interface StoreSubscriptionDetails {
  storeId: string
  storeName: string
  contractedPlan: PlanId
  effectivePlan: PlanId
  planName: string
  monthlyFeeCents: number
  dueDay: number
  currentDueDate: string
  gracePeriodStart: string
  gracePeriodEnd: string
  subscriptionStatus: 'active' | 'past_due' | 'downgraded' | 'canceled'
  paymentStatus: 'paid' | 'pending' | 'failed'
  isInGracePeriod: boolean
  daysRemainingGrace: number
  isDowngraded: boolean
  suspendedProductsCount: number
  maxAllowedProducts: number
  currentActiveProducts: number
  totalProducts: number
  invoices: {
    id: string
    amountCents: number
    dueDate: string
    status: 'paid' | 'pending' | 'overdue'
    paidAt?: string
  }[]
}

// In-memory fallback storage for invites
let memoryInvites: StoreInvite[] = []

/**
 * 1. Obter ou gerar convites da loja
 */
export async function getStoreInvitesAction(storeId: string): Promise<{
  success: boolean
  inviteCode: string
  inviteUrl: string
  invites: StoreInvite[]
  maxInvites: number
  remainingInvites: number
}> {
  const store = getLocalStoreById(storeId)
  const storeSlug = store?.slug || storeId
  const inviteCode = `VIP-${storeSlug.toUpperCase().slice(0, 8)}-${storeId.slice(0, 4).toUpperCase()}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3020'
  const inviteUrl = `${baseUrl}/cadastro?convite=${inviteCode}`

  // Carregar convites existentes
  const storeInvites = memoryInvites.filter((inv) => inv.storeId === storeId)

  // Seed se estiver vazio
  if (storeInvites.length === 0) {
    const seed: StoreInvite[] = [
      {
        id: `inv-${Date.now()}-1`,
        code: `${inviteCode}-01`,
        storeId,
        storeName: store?.name || 'Minha Loja',
        guestName: 'Empório & Cia',
        guestPhone: '(67) 99888-1122',
        status: 'active',
        invitedStoreName: 'Empório & Cia Outlet',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        acceptedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: `inv-${Date.now()}-2`,
        code: `${inviteCode}-02`,
        storeId,
        storeName: store?.name || 'Minha Loja',
        guestName: 'Boutique Floratta',
        guestPhone: '(67) 99777-3344',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]
    memoryInvites.push(...seed)
  }

  const finalInvites = memoryInvites.filter((inv) => inv.storeId === storeId)
  const maxInvites = 10
  const remainingInvites = Math.max(0, maxInvites - finalInvites.length)

  return {
    success: true,
    inviteCode,
    inviteUrl,
    invites: finalInvites,
    maxInvites,
    remainingInvites,
  }
}

/**
 * Criar novo convite para um lojista parceiro
 */
export async function createStoreInviteAction(
  storeId: string,
  guestName: string,
  guestPhone: string
): Promise<{ success: boolean; invite?: StoreInvite; error?: string }> {
  if (!guestName || guestName.trim().length < 2) {
    return { success: false, error: 'Informe o nome do lojista convidado.' }
  }

  const store = getLocalStoreById(storeId)
  const storeSlug = store?.slug || storeId
  const code = `VIP-${storeSlug.toUpperCase().slice(0, 6)}-${Math.floor(1000 + Math.random() * 9000)}`

  const newInvite: StoreInvite = {
    id: `inv-${Date.now()}`,
    code,
    storeId,
    storeName: store?.name || 'Minha Loja',
    guestName: guestName.trim(),
    guestPhone: guestPhone.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  memoryInvites.unshift(newInvite)

  return { success: true, invite: newInvite }
}

/**
 * 2. Obter métricas de desempenho da loja
 */
export async function getStoreMetricsAction(storeId: string): Promise<{
  success: boolean
  metrics: StoreMetrics
}> {
  const products = getLocalProducts(storeId)
  const totalProds = products.length
  const store = getLocalStoreById(storeId)

  // Estatísticas calculadas de forma realista
  const baseViews = 340 + totalProds * 45
  const baseProductViews = 820 + totalProds * 110
  const baseWhatsappClicks = 42 + Math.floor(totalProds * 4.5)
  const baseFavorites = 28 + Math.floor(totalProds * 3.2)
  const followers = store?.followers_count || 37 + totalProds * 2

  const topProducts = products.slice(0, 5).map((p, idx) => ({
    id: p.id,
    name: p.name,
    views: Math.max(15, Math.floor(baseProductViews / (idx + 2.5))),
    favorites: Math.max(3, Math.floor(baseFavorites / (idx + 2))),
    price: p.promotional_price || p.price,
    imageUrl: p.image_url || undefined,
  }))

  const monthlyHistory = [
    { label: 'Semana 1', views: Math.floor(baseViews * 0.2), contacts: Math.floor(baseWhatsappClicks * 0.18) },
    { label: 'Semana 2', views: Math.floor(baseViews * 0.26), contacts: Math.floor(baseWhatsappClicks * 0.25) },
    { label: 'Semana 3', views: Math.floor(baseViews * 0.24), contacts: Math.floor(baseWhatsappClicks * 0.27) },
    { label: 'Semana 4 (Atual)', views: Math.floor(baseViews * 0.3), contacts: Math.floor(baseWhatsappClicks * 0.3) },
  ]

  const conversionRate = `${((baseWhatsappClicks / Math.max(1, baseViews)) * 100).toFixed(1)}%`

  return {
    success: true,
    metrics: {
      storeViews: baseViews,
      productViews: baseProductViews,
      whatsappClicks: baseWhatsappClicks,
      favoritesCount: baseFavorites,
      followersCount: followers,
      conversionRate,
      topProducts,
      monthlyHistory,
    },
  }
}

/**
 * 3. Obter produtos preferidos / favoritados da loja
 */
export async function getStoreFavoritesAction(storeId: string): Promise<{
  success: boolean
  favorites: FavoriteProductItem[]
}> {
  const products = getLocalProducts(storeId)

  const favorites: FavoriteProductItem[] = products.map((p, index) => {
    // Cálculo determinístico para popularidade
    const simulatedFavorites = Math.max(2, (products.length - index) * 3 + (p.is_outlet ? 8 : 4))
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      promotionalPrice: p.promotional_price || undefined,
      imageUrl: p.image_url || undefined,
      favoritesCount: simulatedFavorites,
      category: p.category,
      isActive: p.is_active,
    }
  }).sort((a, b) => b.favoritesCount - a.favoritesCount)

  return {
    success: true,
    favorites,
  }
}

/**
 * 4. Obter seguidores aniversariantes da loja
 */
export async function getStoreBirthdayFollowersAction(storeId: string): Promise<{
  success: boolean
  followers: BirthdayFollower[]
  planAllowsBirthdayList: boolean
}> {
  const store = getLocalStoreById(storeId)
  const planKey = (store?.effective_plan || store?.plan || 'bronze') as PlanId
  const planConfig = getPlan(planKey)

  // Lista simulada rica com datas do mês corrente e semana
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  const dummyFollowers: BirthdayFollower[] = [
    {
      id: 'usr-1',
      name: 'Mariana Silveira',
      phone: '67991234567',
      birthDate: `1994-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      dayAndMonth: `${String(currentDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
      isToday: true,
      isThisWeek: true,
      isThisMonth: true,
      daysUntil: 0,
    },
    {
      id: 'usr-2',
      name: 'Carlos Eduardo Ramos',
      phone: '67988776655',
      birthDate: `1988-${String(currentMonth).padStart(2, '0')}-${String(Math.min(28, currentDay + 2)).padStart(2, '0')}`,
      dayAndMonth: `${String(Math.min(28, currentDay + 2)).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
      isToday: false,
      isThisWeek: true,
      isThisMonth: true,
      daysUntil: 2,
    },
    {
      id: 'usr-3',
      name: 'Juliana Mendes de Castro',
      phone: '67996543210',
      birthDate: `1996-${String(currentMonth).padStart(2, '0')}-${String(Math.min(28, currentDay + 5)).padStart(2, '0')}`,
      dayAndMonth: `${String(Math.min(28, currentDay + 5)).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
      isToday: false,
      isThisWeek: true,
      isThisMonth: true,
      daysUntil: 5,
    },
    {
      id: 'usr-4',
      name: 'Fernanda Albuquerque',
      phone: '67981223344',
      birthDate: `1992-${String(currentMonth).padStart(2, '0')}-25`,
      dayAndMonth: `25/${String(currentMonth).padStart(2, '0')}`,
      isToday: false,
      isThisWeek: false,
      isThisMonth: true,
      daysUntil: Math.max(1, 25 - currentDay),
    },
    {
      id: 'usr-5',
      name: 'Rodrigo Siqueira',
      phone: '67992334455',
      birthDate: `1985-${String(currentMonth).padStart(2, '0')}-28`,
      dayAndMonth: `28/${String(currentMonth).padStart(2, '0')}`,
      isToday: false,
      isThisWeek: false,
      isThisMonth: true,
      daysUntil: Math.max(1, 28 - currentDay),
    },
  ]

  return {
    success: true,
    followers: dummyFollowers,
    planAllowsBirthdayList: planConfig.hasBirthdayList || true, // Permitir visualização com banner promocional nos planos básicos
  }
}

/**
 * 5. Obter detalhes da assinatura, status de cobrança e histórico da loja
 */
export async function getStoreSubscriptionDetailsAction(storeId: string): Promise<{
  success: boolean
  subscription?: StoreSubscriptionDetails
  error?: string
}> {
  const store = getLocalStoreById(storeId)
  if (!store) {
    return { success: false, error: 'Loja não encontrada.' }
  }

  const cycle = calculateSubscriptionCycle()
  const contractedPlanKey = (store.contracted_plan || store.plan || 'bronze') as PlanId
  const effectivePlanKey = (store.effective_plan || store.plan || 'bronze') as PlanId
  const contractedPlanConfig = getPlan(contractedPlanKey)

  const products = getLocalProducts(storeId)
  const activeProducts = products.filter((p) => p.is_active)
  const suspendedCount = products.filter((p) => (p as any).suspended_by_downgrade).length

  const today = new Date()
  const graceEnd = new Date(cycle.gracePeriodEnd)
  const isInGrace = today > new Date(cycle.dueDate) && today <= graceEnd
  const daysRemaining = Math.max(0, Math.ceil((graceEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  const isDowngraded = effectivePlanKey === 'bronze' && contractedPlanKey !== 'bronze'

  const details: StoreSubscriptionDetails = {
    storeId: store.id,
    storeName: store.name,
    contractedPlan: contractedPlanKey,
    effectivePlan: effectivePlanKey,
    planName: contractedPlanConfig.name,
    monthlyFeeCents: contractedPlanConfig.price * 100,
    dueDay: 10,
    currentDueDate: cycle.dueDate,
    gracePeriodStart: cycle.gracePeriodStart,
    gracePeriodEnd: cycle.gracePeriodEnd,
    subscriptionStatus: (store.subscription_status as any) || (isInGrace ? 'past_due' : isDowngraded ? 'downgraded' : 'active'),
    paymentStatus: (store.payment_status as any) || (isInGrace ? 'pending' : 'paid'),
    isInGracePeriod: isInGrace,
    daysRemainingGrace: daysRemaining,
    isDowngraded,
    suspendedProductsCount: suspendedCount,
    maxAllowedProducts: contractedPlanConfig.maxActiveProducts,
    currentActiveProducts: activeProducts.length,
    totalProducts: products.length,
    invoices: [
      {
        id: `inv-${Date.now()}-1`,
        amountCents: contractedPlanConfig.price * 100,
        dueDate: cycle.dueDate,
        status: isDowngraded ? 'overdue' : isInGrace ? 'pending' : 'paid',
        paidAt: !isDowngraded && !isInGrace ? new Date(Date.now() - 3 * 86400000).toISOString() : undefined,
      },
      {
        id: `inv-${Date.now()}-2`,
        amountCents: contractedPlanConfig.price * 100,
        dueDate: `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}-10`,
        status: 'paid',
        paidAt: new Date(Date.now() - 33 * 86400000).toISOString(),
      },
    ],
  }

  return {
    success: true,
    subscription: details,
  }
}

/**
 * 6. Simular confirmação de pagamento e reativação automática
 */
export async function simulatePaymentReactivationAction(storeId: string): Promise<{
  success: boolean
  message: string
}> {
  const store = getLocalStoreById(storeId)
  if (!store) {
    return { success: false, message: 'Loja não encontrada.' }
  }

  // Restaurar plano contratado
  const restoredPlan = store.contracted_plan || 'bronze'
  const planConfig = getPlan(restoredPlan as PlanId)
  const maxActive = planConfig.maxActiveProducts

  const products = getLocalProducts(storeId)
  
  // Reativar produtos até o limite do plano
  let reactivatedCount = 0
  for (const prod of products) {
    if ((prod as any).suspended_by_downgrade && reactivatedCount < maxActive) {
      saveLocalProduct({
        ...prod,
        is_active: true,
        suspended_by_downgrade: false,
      })
      reactivatedCount++
    }
  }

  // Atualizar loja local
  saveLocalStore({
    ...store,
    effective_plan: restoredPlan,
    plan: restoredPlan,
    subscription_status: 'active',
    payment_status: 'paid',
    last_payment_date: new Date().toISOString(),
    downgrade_reason: null,
  })

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return {
    success: true,
    message: `Pagamento confirmado com sucesso! O plano ${planConfig.name} foi restaurado e seus benefícios foram 100% reativados.`,
  }
}
