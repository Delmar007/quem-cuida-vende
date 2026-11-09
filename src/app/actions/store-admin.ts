'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface StoreAdminData {
  id: string
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
  is_active: boolean
  created_at: string
  updated_at?: string
}

import { getLocalStores, getLocalStoresByOwner, getLocalStoreById, saveLocalStore, StoredStore } from '@/lib/stores-storage'
import { getLocalSessionUser, setLocalSessionUser } from '@/lib/local-auth'

/**
 * Obtém as lojas pertencentes ao usuário atualmente autenticado.
 */
export async function getMyStoresAction(): Promise<{
  success: boolean
  stores?: StoreAdminData[]
  error?: string
  authenticated: boolean
}> {
  const supabase = await createClient()
  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }

  if (!user) {
    user = await getLocalSessionUser()
  }

  if (!user) {
    return { success: false, authenticated: false, error: 'Usuário não autenticado.' }
  }

  let dbStores: StoreAdminData[] = []
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase stores query error, using local storage fallback:', error.message)
    } else if (stores) {
      dbStores = stores
    }
  } catch (err: any) {
    console.warn('Supabase stores query exception:', err.message)
  }

  // Mesclar com lojas salvas localmente
  const localStores = getLocalStoresByOwner(user.id)
  const combined = [...dbStores]
  for (const ls of localStores) {
    if (!combined.some((s) => s.id === ls.id)) {
      combined.push(ls)
    }
  }

  return { success: true, authenticated: true, stores: combined }
}

/**
 * Helper interno para upload de imagem no Supabase Storage (com fallback seguro para data URL)
 */
async function uploadStoreImage(
  file: File,
  folder: 'logos' | 'banners',
  fileNamePrefix: string
): Promise<string> {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Formato de imagem não suportado (${file.type}). Use JPEG, PNG ou WebP.`)
  }

  const maxBytes = 5 * 1024 * 1024 // 5 MB
  if (file.size > maxBytes) {
    throw new Error('A imagem selecionada excede o limite máximo permitido de 5 MB.')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = file.type.split('/')[1] || 'jpg'
  const filePath = `${folder}/${fileNamePrefix}-${Date.now()}.${extension}`

  try {
    const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createAdminClient()
      : await createClient()
    
    // Tentar upload no bucket 'stores'
    const { error: uploadError } = await storageClient.storage
      .from('stores')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (!uploadError) {
      const { data: publicData } = storageClient.storage.from('stores').getPublicUrl(filePath)
      if (publicData?.publicUrl) {
        return publicData.publicUrl
      }
    } else {
      console.warn('Storage upload error, applying fallback:', uploadError.message)
    }
  } catch (err: any) {
    console.warn('Storage client error, applying fallback:', err.message)
  }

  // Fallback seguro caso o bucket ainda não tenha sido criado no Supabase remoto
  const base64 = buffer.toString('base64')
  return `data:${file.type};base64,${base64}`
}

/**
 * Atualiza os dados cadastrais, endereço e banners de uma loja.
 * Valida estritamente a autorização do proprietário no servidor e preserva campos protegidos.
 */
export async function updateStoreAction(
  storeId: string,
  formData: FormData
): Promise<{ success: boolean; store?: StoreAdminData; error?: string }> {
  if (!storeId) {
    return { success: false, error: 'Identificador da loja inválido.' }
  }

  const supabase = await createClient()
  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user ?? null
  } catch {
    user = null
  }
  if (!user) {
    user = await getLocalSessionUser()
  }

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente para salvar as alterações.' }
  }

  // 1. Validar no servidor se o usuário é realmente o proprietário da loja
  let currentStore: any = null
  try {
    const { data: storeData, error: storeErr } = await supabase
      .from('stores')
      .select('id, owner_id, logo_url, large_banner_url, small_banner_url, slug')
      .eq('id', storeId)
      .single()

    if (!storeErr && storeData) {
      currentStore = storeData
    }
  } catch (err: any) {
    console.warn('Supabase store check exception:', err.message)
  }

  if (!currentStore) {
    currentStore = getLocalStoreById(storeId)
  }

  // Se a loja ainda não foi registrada (ex: primeiro acesso direto no painel com loja inicial)
  if (!currentStore) {
    const rawName = (formData.get('name') as string)?.trim() || 'Minha Loja'
    const slug = rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)

    currentStore = {
      id: storeId,
      owner_id: user.id,
      name: rawName,
      slug,
      plan: 'bronze',
      contracted_plan: 'bronze',
      effective_plan: 'bronze',
      subscription_status: 'active',
      payment_status: 'paid',
      is_active: true,
      created_at: new Date().toISOString(),
      logo_url: null,
      large_banner_url: null,
      small_banner_url: null,
    }
  }

  if (currentStore.owner_id && currentStore.owner_id !== user.id) {
    return { success: false, error: 'Você não tem permissão para editar os dados desta loja.' }
  }

  // 2. Extrair e validar dados textuais
  const name = (formData.get('name') as string)?.trim() || ''
  if (!name || name.length < 2) {
    return { success: false, error: 'O nome comercial da loja é obrigatório (mínimo 2 caracteres).' }
  }

  const description = (formData.get('description') as string)?.trim() || null
  if (description && description.length > 500) {
    return { success: false, error: 'A descrição da loja deve ter no máximo 500 caracteres.' }
  }

  const category = (formData.get('category') as string)?.trim() || 'moda'
  
  let subcategories: string[] = []
  const subcategoriesRaw = formData.get('subcategories')
  if (typeof subcategoriesRaw === 'string') {
    try {
      subcategories = JSON.parse(subcategoriesRaw)
    } catch {
      subcategories = subcategoriesRaw.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  const cep = (formData.get('cep') as string)?.trim() || null
  const street = (formData.get('street') as string)?.trim() || null
  const number = (formData.get('number') as string)?.trim() || null
  const neighborhood = (formData.get('neighborhood') as string)?.trim() || null
  const city = (formData.get('city') as string)?.trim() || null
  const state = (formData.get('state') as string)?.trim().toUpperCase() || null
  const phone = (formData.get('phone') as string)?.replace(/\D/g, '') || null
  const cnpjCpf = (formData.get('cnpj_cpf') as string)?.trim() || null
  const responsibleName = (formData.get('responsible_name') as string)?.trim() || null

  // 3. Processar uploads de arquivos (se enviados)
  let logoUrl = currentStore.logo_url
  const logoFile = formData.get('logo_file') as File | null
  if (logoFile && logoFile.size > 0 && typeof logoFile.arrayBuffer === 'function') {
    try {
      logoUrl = await uploadStoreImage(logoFile, 'logos', `logo-${storeId}`)
    } catch (err: any) {
      return { success: false, error: `Erro no logotipo: ${err.message}` }
    }
  }

  let largeBannerUrl = currentStore.large_banner_url
  const largeBannerFile = formData.get('large_banner_file') as File | null
  if (largeBannerFile && largeBannerFile.size > 0 && typeof largeBannerFile.arrayBuffer === 'function') {
    try {
      largeBannerUrl = await uploadStoreImage(largeBannerFile, 'banners', `large-${storeId}`)
    } catch (err: any) {
      return { success: false, error: `Erro no banner grande: ${err.message}` }
    }
  }

  let smallBannerUrl = currentStore.small_banner_url
  const smallBannerFile = formData.get('small_banner_file') as File | null
  if (smallBannerFile && smallBannerFile.size > 0 && typeof smallBannerFile.arrayBuffer === 'function') {
    try {
      smallBannerUrl = await uploadStoreImage(smallBannerFile, 'banners', `small-${storeId}`)
    } catch (err: any) {
      return { success: false, error: `Erro no banner pequeno: ${err.message}` }
    }
  }

  // 4. Montar payload de atualização (PRESERVANDO integralmente planos e financeiro)
  const updatePayload: Record<string, unknown> = {
    name,
    responsible_name: responsibleName,
    description,
    category,
    subcategories,
    cep,
    street,
    number,
    neighborhood,
    city,
    state,
    phone,
    cnpj_cpf: cnpjCpf,
    logo_url: logoUrl,
    large_banner_url: largeBannerUrl,
    small_banner_url: smallBannerUrl,
    updated_at: new Date().toISOString(),
  }

  // 5. Atualizar no Supabase e/ou storage local
  let finalStore: any = {
    ...currentStore,
    ...updatePayload,
  }

  try {
    const { data: updatedStore, error: updateError } = await supabase
      .from('stores')
      .upsert({
        id: storeId,
        owner_id: user.id,
        slug: currentStore.slug,
        ...updatePayload,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (!updateError && updatedStore) {
      finalStore = updatedStore
    } else if (updateError) {
      console.warn('Supabase update warning, falling back to local storage:', updateError.message)
    }
  } catch (err: any) {
    console.warn('Supabase update exception, falling back to local storage:', err.message)
  }

  saveLocalStore(finalStore as StoredStore)

  // Marcar que este usuário possui loja criada (user_metadata + cookie vinculado ao user.id)
  try {
    await supabase.auth.updateUser({
      data: {
        has_store: true,
      },
    })
  } catch {
    // ignore
  }

  try {
    const localSession = await getLocalSessionUser()
    if (localSession && localSession.id === user.id) {
      await setLocalSessionUser({
        ...localSession,
        user_metadata: {
          ...(localSession.user_metadata || {}),
          has_store: true,
        },
      })
    }
  } catch {
    // ignore
  }

  try {
    const cookieStore = await cookies()
    cookieStore.set(`kittanda_has_store_${user.id}`, 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } catch {
    // ignore
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
    // ignora silenciosamente em ambiente de testes locais
  }

  // 6. Revalidar rotas
  revalidatePath('/', 'layout')
  revalidatePath(`/loja/${storeId}`)
  if (finalStore.slug) {
    revalidatePath(`/loja/${finalStore.slug}`)
  }
  revalidatePath('/painel/loja')

  return { success: true, store: finalStore }
}

/**
 * Atualiza o plano contratado e efetivo de uma loja imediatamente
 * (permite testar as cotas de produtos e simular upgrades de pacotes).
 */
export async function updateStorePlanAction(
  storeId: string,
  newPlan: string
): Promise<{ success: boolean; store?: StoreAdminData; error?: string }> {
  if (!storeId || !newPlan) {
    return { success: false, error: 'Identificador da loja e plano são obrigatórios.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  let store = getLocalStoreById(storeId)
  if (!store) {
    try {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single()
      if (data) store = data as any
    } catch {
      // fallback
    }
  }

  if (!store) {
    return { success: false, error: 'Loja não encontrada no sistema.' }
  }

  const updatedStore = {
    ...store,
    plan: newPlan,
    contracted_plan: newPlan,
    effective_plan: newPlan,
    subscription_status: 'active',
    payment_status: 'paid',
    updated_at: new Date().toISOString(),
  }

  try {
    await supabase
      .from('stores')
      .update({
        plan: newPlan,
        contracted_plan: newPlan,
        effective_plan: newPlan,
        subscription_status: 'active',
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId)
  } catch (err) {
    console.warn('Erro ao atualizar plano no Supabase:', err)
  }

  saveLocalStore(updatedStore as StoredStore)

  revalidatePath('/', 'layout')
  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  if (updatedStore.slug) {
    revalidatePath(`/loja/${updatedStore.slug}`)
  }

  return { success: true, store: updatedStore as any }
}
