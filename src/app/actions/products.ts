'use server'

import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getPlan, PlanId } from '@/lib/plans'
import { getLocalProducts, saveLocalProduct, deleteLocalProduct, StoredProduct } from '@/lib/products-storage'
import { getLocalStoreById } from '@/lib/stores-storage'

function safeRevalidate(path: string, type?: 'layout' | 'page') {
  try {
    if (type) revalidatePath(path, type)
    else revalidatePath(path)
  } catch {
    // Silently ignore when called outside active request context (e.g. tests)
  }
}

export interface CreateProductInput {
  storeId: string
  name: string
  description?: string
  sku?: string
  price: number
  promotionalPrice?: number
  costPriceInternal?: number
  fipePriceInternal?: number
  imageUrl?: string
  images?: string[]
  photoOrientation?: 'vertical' | 'horizontal'
  category: string
  subcategory?: string
  promoType?: string
  isVehicle?: boolean
  vehicleCategory?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleVersion?: string
  vehicleYearFab?: string
  vehicleYearModel?: string
  vehicleKm?: string
  vehicleTransmission?: string
  vehicleTraction?: string
  vehiclePlateInternal?: string
  isOutlet?: boolean
  isNovidade?: boolean
  isActive?: boolean
}

export interface UpdateProductInput {
  id: string
  storeId: string
  name: string
  description?: string
  sku?: string
  price: number
  promotionalPrice?: number
  costPriceInternal?: number
  fipePriceInternal?: number
  imageUrl?: string
  images?: string[]
  photoOrientation?: 'vertical' | 'horizontal'
  category: string
  subcategory?: string
  promoType?: string
  isVehicle?: boolean
  vehicleCategory?: string
  vehicleBrand?: string
  vehicleModel?: string
  vehicleVersion?: string
  vehicleYearFab?: string
  vehicleYearModel?: string
  vehicleKm?: string
  vehicleTransmission?: string
  vehicleTraction?: string
  vehiclePlateInternal?: string
  isOutlet?: boolean
  isNovidade?: boolean
  isActive?: boolean
}

/**
 * Consulta todos os produtos de uma loja (combinando Supabase + fallback local).
 */
export async function getStoreProductsAction(storeId: string): Promise<{
  success: boolean
  products: StoredProduct[]
  error?: string
}> {
  if (!storeId) return { success: false, products: [] }

  let dbProducts: any[] = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      dbProducts = data
    }
  } catch (err: any) {
    // Supabase table or connection fallback
  }

  const localProds = getLocalProducts(storeId)
  const combined = [...dbProducts]
  for (const lp of localProds) {
    if (!combined.some((p) => p.id === lp.id)) {
      combined.push(lp)
    }
  }

  // Ordenar decrescente por created_at
  combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return { success: true, products: combined }
}

/**
 * Cadastra um novo produto respeitando a cota máxima do plano contratado
 * (Bronze gratuito: 20, Bronze Luz: 100, Prata: 200, Ouro: 500).
 * Ambos os produtos ativos e inativos ocupam vagas no catálogo.
 */
export async function createProductAction(data: CreateProductInput): Promise<{
  success: boolean
  product?: StoredProduct
  error?: string
  limitReached?: boolean
  currentCount?: number
  maxAllowed?: number
}> {
  if (!data.storeId) {
    return { success: false, error: 'Identificador da loja é obrigatório.' }
  }

  const trimmedName = data.name?.trim()
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O título do produto deve ter no mínimo 2 caracteres.' }
  }

  if (typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
    return { success: false, error: 'O preço regular deve ser um valor numérico válido maior que zero.' }
  }

  if (data.promotionalPrice !== undefined && data.promotionalPrice !== null && !isNaN(data.promotionalPrice)) {
    if (data.promotionalPrice <= 0) {
      return { success: false, error: 'O preço promocional deve ser maior que zero.' }
    }
    if (data.promotionalPrice >= data.price) {
      return { success: false, error: 'O preço promocional deve ser obrigatoriamente inferior ao preço regular.' }
    }
  }

  if (!data.category?.trim()) {
    return { success: false, error: 'Selecione uma categoria principal para o produto.' }
  }

  // Obter dados da loja e plano contratado
  let store: any = null
  try {
    const supabase = await createClient()
    const { data: storeData } = await supabase
      .from('stores')
      .select('id, owner_id, plan, contracted_plan, effective_plan')
      .eq('id', data.storeId)
      .single()
    if (storeData) store = storeData
  } catch {
    // fallback
  }

  if (!store) {
    store = getLocalStoreById(data.storeId)
  }

  const planKey = (store?.effective_plan || store?.plan || 'bronze').toLowerCase()
  const planConfig = getPlan(planKey)
  const maxAllowed = planConfig.maxActiveProducts

  // 1. Validar cota total do plano (ativos + inativos)
  const localList = getLocalProducts(data.storeId)
  let currentTotalCount = localList.length

  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', data.storeId)
    if (typeof count === 'number') {
      currentTotalCount = Math.max(currentTotalCount, count)
    }
  } catch {
    // fallback
  }

  if (currentTotalCount >= maxAllowed) {
    return {
      success: false,
      limitReached: true,
      currentCount: currentTotalCount,
      maxAllowed,
      error: `Você atingiu o limite de ${maxAllowed} produtos do seu plano ${planConfig.name}. Para cadastrar novos produtos, exclua um produto existente ou conheça os planos com maior capacidade.`,
    }
  }

  const productId = `prod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
  const now = new Date().toISOString()

  // Limite estrito de fotos: até 12 fotos para veículos (Carro / Usados e Concessionária) e 6 fotos para demais segmentos
  const maxPhotosLimit = data.isVehicle ? 12 : 6
  const rawImages = data.images && data.images.length > 0
    ? data.images
    : data.imageUrl
    ? [data.imageUrl]
    : []
  const allImages = rawImages.slice(0, maxPhotosLimit)
  const primaryImage = allImages.length > 0 ? allImages[0] : null

  const promoType = (data.promoType || (data.isOutlet ? 'outlet' : 'lancamento')).toLowerCase()
  const isOutlet = promoType === 'outlet' || Boolean(data.isOutlet)
  const isNovidade = promoType === 'lancamento' || (!isOutlet && Boolean(data.isNovidade))

  const newProduct: StoredProduct = {
    id: productId,
    store_id: data.storeId,
    name: trimmedName,
    description: data.description?.trim() || null,
    sku: data.sku?.trim() || null,
    price: Number(data.price.toFixed(2)),
    promotional_price: data.promotionalPrice ? Number(data.promotionalPrice.toFixed(2)) : null,
    cost_price_internal: data.costPriceInternal && !isNaN(data.costPriceInternal) ? Number(data.costPriceInternal.toFixed(2)) : null,
    fipe_price_internal: data.fipePriceInternal && !isNaN(data.fipePriceInternal) ? Number(data.fipePriceInternal.toFixed(2)) : null,
    image_url: primaryImage,
    images: allImages,
    photo_orientation: data.photoOrientation || (data.isVehicle ? 'horizontal' : 'vertical'),
    category: data.category.trim(),
    subcategory: data.subcategory?.trim() || null,
    promo_type: promoType,
    is_vehicle: Boolean(data.isVehicle),
    vehicle_category: data.vehicleCategory?.trim() || null,
    vehicle_brand: data.vehicleBrand?.trim() || null,
    vehicle_model: data.vehicleModel?.trim() || null,
    vehicle_version: data.vehicleVersion?.trim() || null,
    vehicle_year_fab: data.vehicleYearFab?.trim() || null,
    vehicle_year_model: data.vehicleYearModel?.trim() || null,
    vehicle_km: data.vehicleKm?.trim() || null,
    vehicle_transmission: data.vehicleTransmission?.trim() || null,
    vehicle_traction: data.vehicleTraction?.trim() || null,
    vehicle_plate_internal: data.vehiclePlateInternal?.trim() || null,
    is_outlet: isOutlet,
    is_novidade: isNovidade,
    is_active: data.isActive ?? true,
    published_at: now,
    created_at: now,
  }

  let finalProduct = newProduct

  // Tentar inserir no Supabase
  try {
    const supabase = await createClient()
    const { data: dbCreated, error: insertErr } = await supabase
      .from('products')
      .insert({
        id: newProduct.id,
        store_id: data.storeId,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        promotional_price: newProduct.promotional_price,
        image_url: newProduct.image_url,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        is_outlet: newProduct.is_outlet,
        is_novidade: newProduct.is_novidade,
        is_active: newProduct.is_active,
        published_at: now,
        created_at: now,
      })
      .select()
      .single()

    if (!insertErr && dbCreated) {
      finalProduct = { ...newProduct, ...dbCreated }
    }
  } catch (err: any) {
    // fallback local
  }

  saveLocalProduct(finalProduct)

  safeRevalidate('/', 'layout')
  safeRevalidate(`/loja/${data.storeId}`)
  safeRevalidate('/painel/loja')

  return { success: true, product: finalProduct }
}

/**
 * Atualiza um produto existente.
 * Importante: A edição NÃO consome uma nova vaga no catálogo!
 */
export async function updateProductAction(data: UpdateProductInput): Promise<{
  success: boolean
  product?: StoredProduct
  error?: string
}> {
  if (!data.id || !data.storeId) {
    return { success: false, error: 'Identificador do produto ou da loja inválido.' }
  }

  const trimmedName = data.name?.trim()
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O título do produto deve ter no mínimo 2 caracteres.' }
  }

  if (typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
    return { success: false, error: 'O preço regular deve ser um valor numérico válido maior que zero.' }
  }

  if (data.promotionalPrice !== undefined && data.promotionalPrice !== null && !isNaN(data.promotionalPrice)) {
    if (data.promotionalPrice <= 0) {
      return { success: false, error: 'O preço promocional deve ser maior que zero.' }
    }
    if (data.promotionalPrice >= data.price) {
      return { success: false, error: 'O preço promocional deve ser obrigatoriamente inferior ao preço regular.' }
    }
  }

  if (!data.category?.trim()) {
    return { success: false, error: 'Selecione uma categoria principal para o produto.' }
  }

  const existingProducts = getLocalProducts(data.storeId)
  const existing = existingProducts.find((p) => p.id === data.id)
  if (!existing) {
    return { success: false, error: 'Produto não encontrado.' }
  }

  const now = new Date().toISOString()

  // Limite estrito de fotos: até 12 fotos para veículos (Carro / Usados e Concessionária) e 6 fotos para demais segmentos
  const isVeh = data.isVehicle !== undefined ? Boolean(data.isVehicle) : Boolean(existing.is_vehicle)
  const maxPhotosLimit = isVeh ? 12 : 6
  const rawImages = data.images && data.images.length > 0
    ? data.images
    : data.imageUrl
    ? [data.imageUrl]
    : existing.images || (existing.image_url ? [existing.image_url] : [])
  const allImages = rawImages.slice(0, maxPhotosLimit)
  const primaryImage = allImages.length > 0 ? allImages[0] : null

  const promoType = data.promoType
    ? data.promoType.toLowerCase()
    : existing.promo_type || (existing.is_outlet ? 'outlet' : 'lancamento')

  let isOutlet = promoType === 'outlet'
  let isNovidade = promoType === 'lancamento'

  const updatedProduct: StoredProduct = {
    ...existing,
    name: trimmedName,
    description: data.description !== undefined ? data.description.trim() || null : existing.description,
    sku: data.sku !== undefined ? data.sku.trim() || null : existing.sku,
    price: Number(data.price.toFixed(2)),
    promotional_price: data.promotionalPrice ? Number(data.promotionalPrice.toFixed(2)) : null,
    cost_price_internal:
      data.costPriceInternal !== undefined
        ? data.costPriceInternal && !isNaN(data.costPriceInternal)
          ? Number(data.costPriceInternal.toFixed(2))
          : null
        : existing.cost_price_internal,
    fipe_price_internal:
      data.fipePriceInternal !== undefined
        ? data.fipePriceInternal && !isNaN(data.fipePriceInternal)
          ? Number(data.fipePriceInternal.toFixed(2))
          : null
        : existing.fipe_price_internal,
    image_url: primaryImage,
    images: allImages,
    photo_orientation: data.photoOrientation || existing.photo_orientation || (isVeh ? 'horizontal' : 'vertical'),
    category: data.category.trim(),
    subcategory: data.subcategory !== undefined ? data.subcategory?.trim() || null : existing.subcategory,
    promo_type: promoType,
    is_vehicle: isVeh,
    vehicle_category: data.vehicleCategory !== undefined ? data.vehicleCategory?.trim() || null : existing.vehicle_category,
    vehicle_brand: data.vehicleBrand !== undefined ? data.vehicleBrand?.trim() || null : existing.vehicle_brand,
    vehicle_model: data.vehicleModel !== undefined ? data.vehicleModel?.trim() || null : existing.vehicle_model,
    vehicle_version: data.vehicleVersion !== undefined ? data.vehicleVersion?.trim() || null : existing.vehicle_version,
    vehicle_year_fab: data.vehicleYearFab !== undefined ? data.vehicleYearFab?.trim() || null : existing.vehicle_year_fab,
    vehicle_year_model: data.vehicleYearModel !== undefined ? data.vehicleYearModel?.trim() || null : existing.vehicle_year_model,
    vehicle_km: data.vehicleKm !== undefined ? data.vehicleKm?.trim() || null : existing.vehicle_km,
    vehicle_transmission: data.vehicleTransmission !== undefined ? data.vehicleTransmission?.trim() || null : existing.vehicle_transmission,
    vehicle_traction: data.vehicleTraction !== undefined ? data.vehicleTraction?.trim() || null : existing.vehicle_traction,
    vehicle_plate_internal: data.vehiclePlateInternal !== undefined ? data.vehiclePlateInternal?.trim() || null : existing.vehicle_plate_internal,
    is_outlet: isOutlet,
    is_novidade: isNovidade,
    is_active: data.isActive !== undefined ? Boolean(data.isActive) : existing.is_active,
    updated_at: now,
  }

  // Tentar atualizar no Supabase
  try {
    const supabase = await createClient()
    await supabase
      .from('products')
      .update({
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        promotional_price: updatedProduct.promotional_price,
        image_url: updatedProduct.image_url,
        category: updatedProduct.category,
        subcategory: updatedProduct.subcategory,
        is_outlet: updatedProduct.is_outlet,
        is_novidade: updatedProduct.is_novidade,
        is_active: updatedProduct.is_active,
        updated_at: now,
      })
      .eq('id', data.id)
      .eq('store_id', data.storeId)
  } catch {
    // fallback local
  }

  saveLocalProduct(updatedProduct)

  safeRevalidate('/', 'layout')
  safeRevalidate(`/loja/${data.storeId}`)
  safeRevalidate('/painel/loja')

  return { success: true, product: updatedProduct }
}

/**
 * Altera o status (ativar/desativar) de um produto existente.
 */
export async function toggleProductActiveAction(
  productId: string,
  storeId: string,
  setActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!productId || !storeId) {
    return { success: false, error: 'Parâmetros inválidos.' }
  }

  const localList = getLocalProducts(storeId)
  const found = localList.find((p) => p.id === productId)
  if (found) {
    saveLocalProduct({ ...found, is_active: setActive, updated_at: new Date().toISOString() })
  }

  try {
    const supabase = await createClient()
    await supabase
      .from('products')
      .update({ is_active: setActive, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('store_id', storeId)
  } catch {
    // fallback local
  }

  safeRevalidate('/', 'layout')
  safeRevalidate(`/loja/${storeId}`)
  safeRevalidate('/painel/loja')

  return { success: true }
}

/**
 * Exclui um produto da loja, liberando capacidade imediata na cota do plano.
 */
export async function deleteProductAction(
  productId: string,
  storeId: string
): Promise<{ success: boolean; error?: string }> {
  if (!productId || !storeId) {
    return { success: false, error: 'Parâmetros inválidos.' }
  }

  deleteLocalProduct(productId, storeId)

  try {
    const supabase = await createClient()
    await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', storeId)
  } catch {
    // fallback local
  }

  safeRevalidate('/', 'layout')
  safeRevalidate(`/loja/${storeId}`)
  safeRevalidate('/painel/loja')

  return { success: true }
}

/**
 * Upload seguro de foto de produto para o Supabase Storage com fallback para base64 persistente.
 */
export async function uploadProductImageAction(formData: FormData): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const file = formData.get('file') as File | null
  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado.' }
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
  if (!allowedMimes.includes(file.type)) {
    return { success: false, error: 'Formato não suportado. Envie imagens em JPEG, PNG ou WebP.' }
  }

  const maxBytes = 20 * 1024 * 1024 // 20 MB
  if (file.size > maxBytes) {
    return { success: false, error: 'A foto excede o tamanho máximo permitido de 20 MB.' }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const extension = file.type.split('/')[1] || 'jpg'
  const fileName = `prod-${Date.now()}-${Math.floor(100 + Math.random() * 900)}.${extension}`
  const filePath = `products/${fileName}`

  try {
    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('stores')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (!uploadError) {
      const { data: publicData } = admin.storage.from('stores').getPublicUrl(filePath)
      if (publicData?.publicUrl) {
        return { success: true, url: publicData.publicUrl }
      }
    }
  } catch (err: any) {
    // fallback para gravação local ou base64
  }

  // Fallback 1: Gravar localmente na pasta estática do projeto para economizar payload e memória
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    const fullLocalPath = path.join(uploadDir, fileName)
    fs.writeFileSync(fullLocalPath, buffer)
    return { success: true, url: `/uploads/products/${fileName}` }
  } catch (err: any) {
    // Fallback 2: data URL base64
  }

  const base64 = buffer.toString('base64')
  return { success: true, url: `data:${file.type};base64,${base64}` }
}
