'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveLocalStore, StoredStore } from '@/lib/stores-storage'
import { getLocalSessionUser, setLocalSessionUser } from '@/lib/local-auth'

export interface ProfileData {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  birth_date: string | null
  avatar_url: string | null
  is_complete: boolean
}

export async function getCurrentProfile(): Promise<ProfileData | null> {
  let user: any = null
  let profile: any = null

  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = prof
    }
  } catch {
    // Fallback para sessão local
  }

  if (!user) {
    const localUser = await getLocalSessionUser()
    if (!localUser) return null
    user = localUser
  }

  const displayName = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || null
  const phone = profile?.phone || user.user_metadata?.phone || null
  const birthDate = profile?.birth_date || user.user_metadata?.birth_date || null
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null

  const isComplete = Boolean(displayName && phone && birthDate)

  return {
    id: user.id,
    email: user.email || '',
    display_name: displayName,
    phone,
    birth_date: birthDate,
    avatar_url: avatarUrl,
    is_complete: isComplete,
  }
}

export async function saveProfile(formData: {
  displayName: string
  phone: string
  birthDate: string
}) {
  let user: any = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null

    if (user) {
      await supabase
        .from('profiles')
        .update({
          display_name: formData.displayName.trim(),
          phone: formData.phone.trim(),
          birth_date: formData.birthDate ? formData.birthDate : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      await supabase.auth.updateUser({
        data: {
          full_name: formData.displayName.trim(),
          phone: formData.phone.trim(),
          birth_date: formData.birthDate,
        },
      })
    }
  } catch {
    // Ignorar se Supabase estiver offline
  }

  const localUser = await getLocalSessionUser()
  if (!user && !localUser) {
    return { success: false, error: 'Usuário não autenticado.' }
  }

  if (localUser) {
    await setLocalSessionUser({
      ...localUser,
      user_metadata: {
        ...localUser.user_metadata,
        full_name: formData.displayName.trim(),
        name: formData.displayName.trim(),
        phone: formData.phone.trim(),
        birth_date: formData.birthDate,
      },
    })
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function createStoreAction(data: {
  name: string
  responsibleName: string
  phone?: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  category: string
  subcategories: string[]
  largeBannerUrl?: string
  smallBannerUrl?: string
  logoUrl?: string
  description?: string
  cnpjCpf?: string
  plan?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Você precisa estar logado para abrir uma loja.' }
  }

  // Gerar slug a partir do nome da loja
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)

  // O plano bronze inicia 'active' imediatamente (R$ 0,00).
  // Os planos pagos (bronze_plus, prata e ouro) iniciam 'pending' aguardando confirmação do pagamento.
  const chosenPlan = (data.plan || 'bronze').toLowerCase()
  const initialSubscriptionStatus = chosenPlan === 'bronze' ? 'active' : 'pending'

  const storeId = `store-${Date.now()}`
  const now = new Date().toISOString()
  const localStoreData: StoredStore = {
    id: storeId,
    owner_id: user.id,
    name: data.name.trim(),
    slug,
    responsible_name: data.responsibleName.trim(),
    phone: data.phone || null,
    cep: data.cep.trim(),
    street: data.street.trim(),
    number: data.number.trim(),
    neighborhood: data.neighborhood.trim(),
    city: data.city.trim(),
    state: data.state.trim().toUpperCase(),
    category: data.category,
    subcategories: data.subcategories,
    large_banner_url: data.largeBannerUrl || null,
    small_banner_url: data.smallBannerUrl || null,
    logo_url: data.logoUrl || null,
    description: data.description?.trim() || null,
    cnpj_cpf: data.cnpjCpf?.trim() || null,
    plan: chosenPlan,
    contracted_plan: chosenPlan,
    effective_plan: chosenPlan,
    subscription_status: initialSubscriptionStatus,
    payment_status: chosenPlan === 'bronze' ? 'paid' : 'pending',
    is_active: true,
    created_at: now,
    updated_at: now,
  }

  let finalStore: any = null

  // Tentar inserir na tabela stores do Supabase
  try {
    const { data: newStore, error: storeError } = await supabase
      .from('stores')
      .insert({
        owner_id: user.id,
        name: data.name.trim(),
        slug,
        responsible_name: data.responsibleName.trim(),
        phone: data.phone || null,
        cep: data.cep.trim(),
        street: data.street.trim(),
        number: data.number.trim(),
        neighborhood: data.neighborhood.trim(),
        city: data.city.trim(),
        state: data.state.trim().toUpperCase(),
        category: data.category,
        subcategories: data.subcategories,
        large_banner_url: data.largeBannerUrl || null,
        small_banner_url: data.smallBannerUrl || null,
        logo_url: data.logoUrl || null,
        description: data.description?.trim() || null,
        cnpj_cpf: data.cnpjCpf?.trim() || null,
        plan: chosenPlan,
        subscription_status: initialSubscriptionStatus,
        subscription_start_at: now,
        subscription_renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (storeError) {
      console.warn('Supabase stores table error, saving to local storage:', storeError.message)
      finalStore = saveLocalStore(localStoreData)
    } else {
      finalStore = newStore
      saveLocalStore(newStore as unknown as StoredStore)
    }
  } catch (err: any) {
    console.warn('Supabase insert exception, saving to local storage:', err.message)
    finalStore = saveLocalStore(localStoreData)
  }

  // Atribuir papel 'lojista' ao usuário via admin
  try {
    const admin = createAdminClient()
    await admin
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'lojista',
      }, { onConflict: 'user_id,role' })
  } catch (roleErr) {
    console.warn('Erro ao atribuir papel lojista:', roleErr)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/painel/loja')
  return { success: true, store: finalStore }
}
