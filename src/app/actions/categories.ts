'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  getLocalStoreCategories,
  saveLocalCategory,
  deleteLocalCategory,
  saveLocalSubcategory,
  deleteLocalSubcategory,
  clearLocalStoreCategories,
  StoreCategory,
  StoreSubcategory,
  StoreCategoryWithSubcategories,
} from '@/lib/categories-storage'
import { getLocalProducts, saveLocalProduct } from '@/lib/products-storage'
import { getLocalStoreById } from '@/lib/stores-storage'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Consulta todas as categorias e subcategorias de uma loja,
 * incluindo a contagem de produtos vinculados a cada uma.
 */
export async function getStoreCategoriesAction(storeId: string): Promise<{
  success: boolean
  categories: StoreCategoryWithSubcategories[]
  error?: string
}> {
  if (!storeId) {
    return { success: false, categories: [], error: 'Identificador da loja inválido.' }
  }

  // 1. Tentar buscar no Supabase
  let dbCategories: any[] = []
  let dbSubcategories: any[] = []
  try {
    const supabase = await createClient()
    const { data: cats, error: catErr } = await supabase
      .from('store_categories')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order', { ascending: true })

    if (!catErr && cats) {
      dbCategories = cats
      const { data: subs } = await supabase
        .from('store_subcategories')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true })
      if (subs) dbSubcategories = subs
    }
  } catch (err: any) {
    // Tabela pode ainda não ter sido criada no Supabase remoto
  }

  // 2. Fallback para storage local
  let categoriesWithSubs: StoreCategoryWithSubcategories[] = []

  if (dbCategories.length > 0) {
    categoriesWithSubs = dbCategories.map((c) => ({
      ...c,
      subcategories: dbSubcategories.filter((s) => s.category_id === c.id),
    }))
  } else {
    categoriesWithSubs = getLocalStoreCategories(storeId)
  }

  // 3. Contabilizar produtos vinculados a cada categoria e subcategoria
  const products = getLocalProducts(storeId)

  const enriched = categoriesWithSubs.map((cat) => {
    const catNameLower = cat.name.toLowerCase().trim()
    const linkedProds = products.filter(
      (p) => p.category?.toLowerCase().trim() === catNameLower
    )

    const subcategoriesWithCount = cat.subcategories.map((sub) => {
      const subNameLower = sub.name.toLowerCase().trim()
      const subProds = linkedProds.filter(
        (p) => p.subcategory?.toLowerCase().trim() === subNameLower
      )
      return {
        ...sub,
        products_count: subProds.length,
      }
    })

    return {
      ...cat,
      products_count: linkedProds.length,
      subcategories: subcategoriesWithCount,
    }
  })

  return { success: true, categories: enriched }
}

/**
 * Cria uma nova categoria principal na loja.
 */
export async function createCategoryAction(params: {
  storeId: string
  name: string
  description?: string
  isActive?: boolean
}): Promise<{ success: boolean; category?: StoreCategory; error?: string }> {
  const { storeId, name, description } = params
  if (!storeId) {
    return { success: false, error: 'Identificador da loja inválido.' }
  }
  const trimmedName = name?.trim()

  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O nome da categoria deve ter no mínimo 2 caracteres.' }
  }

  // Verificar duplicidade no mesmo lojista
  const existing = getLocalStoreCategories(storeId)
  if (
    existing.some(
      (c) => c.name.toLowerCase().trim() === trimmedName.toLowerCase().trim()
    )
  ) {
    return { success: false, error: `Já existe uma categoria chamada "${trimmedName}" nesta loja.` }
  }

  const categoryId = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const now = new Date().toISOString()
  const displayOrder = existing.length + 1

  const newCategory: StoreCategory = {
    id: categoryId,
    store_id: storeId,
    name: trimmedName,
    slug: slugify(trimmedName),
    description: description?.trim() || null,
    is_active: params.isActive ?? true,
    display_order: displayOrder,
    created_at: now,
  }

  // Tentar persistir no Supabase
  try {
    const supabase = await createClient()
    await supabase.from('store_categories').insert({
      id: newCategory.id,
      store_id: storeId,
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      is_active: newCategory.is_active,
      display_order: newCategory.display_order,
      created_at: now,
    })
  } catch (err: any) {
    // Fallback local
  }

  saveLocalCategory(newCategory)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true, category: newCategory }
}

/**
 * Atualiza o nome, descrição ou status de uma categoria existente.
 */
export async function updateCategoryAction(params: {
  id: string
  storeId: string
  name: string
  description?: string
  isActive?: boolean
}): Promise<{ success: boolean; category?: StoreCategory; error?: string }> {
  const { id, storeId, name, description } = params
  const trimmedName = name?.trim()

  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O nome da categoria deve ter no mínimo 2 caracteres.' }
  }

  const existingList = getLocalStoreCategories(storeId)
  const current = existingList.find((c) => c.id === id)
  if (!current) {
    return { success: false, error: 'Categoria não encontrada.' }
  }

  // Verificar se outro registro já tem esse nome
  if (
    existingList.some(
      (c) => c.id !== id && c.name.toLowerCase().trim() === trimmedName.toLowerCase().trim()
    )
  ) {
    return { success: false, error: `Já existe outra categoria chamada "${trimmedName}".` }
  }

  const oldName = current.name

  const updated: StoreCategory = {
    ...current,
    name: trimmedName,
    slug: slugify(trimmedName),
    description: description?.trim() || null,
    is_active: params.isActive ?? current.is_active,
    updated_at: new Date().toISOString(),
  }

  // Se o nome mudou, atualizar a referência nos produtos vinculados
  if (oldName !== trimmedName) {
    const products = getLocalProducts(storeId)
    for (const prod of products) {
      if (prod.category?.toLowerCase().trim() === oldName.toLowerCase().trim()) {
        saveLocalProduct({
          ...prod,
          category: trimmedName.toLowerCase().trim(),
        })
      }
    }
  }

  // Tentar no Supabase
  try {
    const supabase = await createClient()
    await supabase
      .from('store_categories')
      .update({
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        is_active: updated.is_active,
        updated_at: updated.updated_at,
      })
      .eq('id', id)
      .eq('store_id', storeId)
  } catch (err: any) {
    // Fallback local
  }

  saveLocalCategory(updated)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true, category: updated }
}

/**
 * Exclui uma categoria, verificando dependências com produtos cadastrados.
 */
export async function deleteCategoryAction(params: {
  id: string
  storeId: string
  force?: boolean
}): Promise<{
  success: boolean
  error?: string
  linkedProductsCount?: number
  requireConfirmation?: boolean
}> {
  const { id, storeId, force } = params

  const existingList = getLocalStoreCategories(storeId)
  const category = existingList.find((c) => c.id === id)
  if (!category) {
    return { success: false, error: 'Categoria não encontrada.' }
  }

  // Verificar produtos vinculados
  const products = getLocalProducts(storeId)
  const catNameLower = category.name.toLowerCase().trim()
  const linked = products.filter(
    (p) => p.category?.toLowerCase().trim() === catNameLower
  )

  if (linked.length > 0 && !force) {
    return {
      success: false,
      requireConfirmation: true,
      linkedProductsCount: linked.length,
      error: `Esta categoria possui ${linked.length} produto(s) vinculado(s). Caso confirme a exclusão, os produtos permanecerão no seu catálogo, mas ficarão desclassificados até que você escolha uma nova categoria para eles.`,
    }
  }

  // Se forçado ou sem produtos, reclassificar produtos para categoria vazia/padrão sem apagá-los
  if (linked.length > 0) {
    for (const prod of linked) {
      saveLocalProduct({
        ...prod,
        category: 'geral',
        subcategory: null,
      })
    }
  }

  // Supabase
  try {
    const supabase = await createClient()
    await supabase.from('store_categories').delete().eq('id', id).eq('store_id', storeId)
  } catch (err: any) {
    // Fallback local
  }

  deleteLocalCategory(id, storeId)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true }
}

/**
 * Adiciona uma subcategoria vinculada à sua categoria principal.
 */
export async function createSubcategoryAction(params: {
  categoryId: string
  storeId: string
  name: string
  description?: string
  isActive?: boolean
}): Promise<{ success: boolean; subcategory?: StoreSubcategory; error?: string }> {
  const { categoryId, storeId, name, description } = params
  const trimmedName = name?.trim()

  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O nome da subcategoria deve ter no mínimo 2 caracteres.' }
  }

  const existingList = getLocalStoreCategories(storeId)
  const parentCategory = existingList.find((c) => c.id === categoryId)
  if (!parentCategory) {
    return { success: false, error: 'A categoria principal informada não foi encontrada.' }
  }

  // Verificar duplicidade dentro da mesma categoria
  if (
    parentCategory.subcategories.some(
      (s) => s.name.toLowerCase().trim() === trimmedName.toLowerCase().trim()
    )
  ) {
    return {
      success: false,
      error: `A subcategoria "${trimmedName}" já existe dentro da categoria "${parentCategory.name}".`,
    }
  }

  const subcategoryId = `sub-${categoryId}-${Date.now().toString().slice(-4)}`
  const now = new Date().toISOString()
  const displayOrder = parentCategory.subcategories.length + 1

  const newSubcategory: StoreSubcategory = {
    id: subcategoryId,
    category_id: categoryId,
    store_id: storeId,
    name: trimmedName,
    slug: slugify(trimmedName),
    description: description?.trim() || null,
    is_active: params.isActive ?? true,
    display_order: displayOrder,
    created_at: now,
  }

  // Supabase
  try {
    const supabase = await createClient()
    await supabase.from('store_subcategories').insert({
      id: newSubcategory.id,
      category_id: categoryId,
      store_id: storeId,
      name: newSubcategory.name,
      slug: newSubcategory.slug,
      description: newSubcategory.description,
      is_active: newSubcategory.is_active,
      display_order: newSubcategory.display_order,
      created_at: now,
    })
  } catch (err: any) {
    // Fallback local
  }

  saveLocalSubcategory(newSubcategory)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true, subcategory: newSubcategory }
}

/**
 * Atualiza uma subcategoria existente.
 */
export async function updateSubcategoryAction(params: {
  id: string
  categoryId: string
  storeId: string
  name: string
  description?: string
  isActive?: boolean
}): Promise<{ success: boolean; subcategory?: StoreSubcategory; error?: string }> {
  const { id, categoryId, storeId, name, description } = params
  const trimmedName = name?.trim()

  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: 'O nome da subcategoria deve ter no mínimo 2 caracteres.' }
  }

  const existingList = getLocalStoreCategories(storeId)
  const parentCategory = existingList.find((c) => c.id === categoryId)
  if (!parentCategory) {
    return { success: false, error: 'Categoria principal não encontrada.' }
  }

  const current = parentCategory.subcategories.find((s) => s.id === id)
  if (!current) {
    return { success: false, error: 'Subcategoria não encontrada.' }
  }

  // Verificar se outra subcategoria nesta categoria já tem o nome
  if (
    parentCategory.subcategories.some(
      (s) => s.id !== id && s.name.toLowerCase().trim() === trimmedName.toLowerCase().trim()
    )
  ) {
    return {
      success: false,
      error: `Já existe outra subcategoria chamada "${trimmedName}" em "${parentCategory.name}".`,
    }
  }

  const oldName = current.name

  const updated: StoreSubcategory = {
    ...current,
    name: trimmedName,
    slug: slugify(trimmedName),
    description: description?.trim() || null,
    is_active: params.isActive ?? current.is_active,
    updated_at: new Date().toISOString(),
  }

  // Atualizar produtos vinculados
  if (oldName !== trimmedName) {
    const products = getLocalProducts(storeId)
    for (const prod of products) {
      if (prod.subcategory?.toLowerCase().trim() === oldName.toLowerCase().trim()) {
        saveLocalProduct({
          ...prod,
          subcategory: trimmedName.toLowerCase().trim(),
        })
      }
    }
  }

  // Supabase
  try {
    const supabase = await createClient()
    await supabase
      .from('store_subcategories')
      .update({
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        is_active: updated.is_active,
        updated_at: updated.updated_at,
      })
      .eq('id', id)
      .eq('store_id', storeId)
  } catch (err: any) {
    // Fallback local
  }

  saveLocalSubcategory(updated)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true, subcategory: updated }
}

/**
 * Exclui uma subcategoria, verificando dependências com produtos vinculados.
 */
export async function deleteSubcategoryAction(params: {
  id: string
  categoryId: string
  storeId: string
  force?: boolean
}): Promise<{
  success: boolean
  error?: string
  linkedProductsCount?: number
  requireConfirmation?: boolean
}> {
  const { id, categoryId, storeId, force } = params

  const existingList = getLocalStoreCategories(storeId)
  const parentCategory = existingList.find((c) => c.id === categoryId)
  const subcategory = parentCategory?.subcategories.find((s) => s.id === id)
  if (!subcategory) {
    return { success: false, error: 'Subcategoria não encontrada.' }
  }

  // Checar produtos vinculados
  const products = getLocalProducts(storeId)
  const subNameLower = subcategory.name.toLowerCase().trim()
  const linked = products.filter(
    (p) => p.subcategory?.toLowerCase().trim() === subNameLower
  )

  if (linked.length > 0 && !force) {
    return {
      success: false,
      requireConfirmation: true,
      linkedProductsCount: linked.length,
      error: `Esta subcategoria possui ${linked.length} produto(s) vinculado(s). Caso confirme a exclusão, os produtos permanecerão cadastrados na categoria "${parentCategory?.name}", mas sem subcategoria específica.`,
    }
  }

  // Se forçado, desvincular subcategoria sem deletar os produtos
  if (linked.length > 0) {
    for (const prod of linked) {
      saveLocalProduct({
        ...prod,
        subcategory: null,
      })
    }
  }

  // Supabase
  try {
    const supabase = await createClient()
    await supabase.from('store_subcategories').delete().eq('id', id).eq('store_id', storeId)
  } catch (err: any) {
    // Fallback local
  }

  deleteLocalSubcategory(id, storeId)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true }
}

/**
 * Limpa todas as categorias e subcategorias de uma loja,
 * permitindo ao lojista começar com o catálogo de categorias 100% limpo e personalizado.
 */
export async function clearStoreCategoriesAction(storeId: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!storeId) {
    return { success: false, error: 'Identificador da loja é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  // Tentar apagar no Supabase
  try {
    await supabase.from('store_subcategories').delete().eq('store_id', storeId)
    await supabase.from('store_categories').delete().eq('store_id', storeId)
  } catch (err: any) {
    console.warn('Erro ao limpar categorias no Supabase:', err.message)
  }

  // Limpar no storage local
  clearLocalStoreCategories(storeId)

  revalidatePath('/painel/loja')
  revalidatePath(`/loja/${storeId}`)
  return { success: true }
}
