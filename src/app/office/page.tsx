import React, { Suspense } from 'react'
import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLocalStores } from '@/lib/stores-storage'
import { getLocalProducts } from '@/lib/products-storage'
import { getUserOfficeDataAction } from '@/app/actions/user-office'
import UserOfficeClient from '@/components/user/UserOfficeClient'
import type { StoreItem, ProductItem } from '@/app/page'

export const instant = false

function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0,00'
  const num =
    typeof value === 'string'
      ? parseFloat(value.replace(/\./g, '').replace(',', '.'))
      : value
  if (isNaN(num)) return '0,00'
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const DEMO_STORES_FALLBACK: StoreItem[] = [
  {
    id: 'st-1',
    name: 'Águia Fashion',
    slug: 'aguia-fashion',
    category: 'moda',
    subcategories: ['Feminina', 'Festa', 'Streetwear'],
    large_banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=940&q=80',
    small_banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    description: 'Moda feminina contemporânea e looks exclusivos para festas e eventos.',
    plan: 'ouro',
    is_active: true,
  },
  {
    id: 'st-2',
    name: 'Bella Moda & Estilo',
    slug: 'bella-moda',
    category: 'moda',
    subcategories: ['Feminina', 'Fitness', 'Praia'],
    large_banner_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=940&q=80',
    small_banner_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=80',
    description: 'Coleções de moda feminina, linha fitness para treino e moda praia para o verão.',
    plan: 'prata',
    is_active: true,
  },
  {
    id: 'st-3',
    name: 'Casa & Conforto Design',
    slug: 'casa-conforto',
    category: 'casa',
    subcategories: ['Móveis', 'Decoração', 'Cama, Mesa e Banho'],
    large_banner_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=940&q=80',
    small_banner_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
    description: 'Móveis e artigos finos de decoração e utilidades domésticas.',
    plan: 'bronze_plus',
    is_active: true,
  },
]

export default async function OfficePage() {
  await connection()
  const initialUser = await getUserOfficeDataAction()

  let dbStores: StoreItem[] = []
  let dbProducts: ProductItem[] = []

  try {
    const supabase = await createClient()
    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)

    if (storesData && storesData.length > 0) {
      dbStores = storesData.map((s: any) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category: (s.category || '').toLowerCase(),
        subcategories: s.subcategories || [],
        large_banner_url: s.large_banner_url,
        small_banner_url: s.small_banner_url,
        logo_url: s.logo_url,
        description: s.description,
        plan: (s.effective_plan || s.plan || 'bronze').toLowerCase(),
        is_active: Boolean(s.is_active),
      }))
    }

    const { data: productsData } = await supabase
      .from('products')
      .select('*, stores(name)')
      .eq('is_active', true)

    if (productsData && productsData.length > 0) {
      dbProducts = productsData.map((p: any) => {
        const regPrice = typeof p.price === 'number' ? p.price : null
        const promoPrice =
          typeof p.promotional_price === 'number' && regPrice && p.promotional_price < regPrice
            ? p.promotional_price
            : null
        const displayPrice = promoPrice !== null ? promoPrice : regPrice
        return {
          id: p.id,
          store_id: p.store_id,
          store_name: p.stores?.name || 'Loja Parceira',
          name: p.name,
          description: p.description,
          price:
            typeof displayPrice === 'number'
              ? `R$ ${formatCurrencyBRL(displayPrice)}`
              : String(p.price || 'R$ 0,00'),
          regular_price: regPrice,
          promotional_price: promoPrice,
          image_url:
            p.image_url ||
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
          images:
            p.images && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
          photo_orientation: p.photo_orientation || (p.is_vehicle ? 'horizontal' : 'vertical'),
          category: (p.category || '').toLowerCase(),
          subcategory: (p.subcategory || '').toLowerCase(),
          promo_type: p.promo_type || (p.is_novidade ? 'lancamento' : 'outlet'),
          is_vehicle: Boolean(p.is_vehicle),
          vehicle_category: p.vehicle_category || null,
          vehicle_brand: p.vehicle_brand || null,
          vehicle_model: p.vehicle_model || null,
          vehicle_version: p.vehicle_version || null,
          vehicle_year_fab: p.vehicle_year_fab || null,
          vehicle_year_model: p.vehicle_year_model || null,
          vehicle_km: p.vehicle_km || null,
          vehicle_transmission: p.vehicle_transmission || null,
          vehicle_traction: p.vehicle_traction || null,
          is_outlet: Boolean(p.is_outlet),
          is_novidade: Boolean(p.is_novidade),
          is_active: Boolean(p.is_active),
          published_at: p.published_at || p.created_at || new Date().toISOString(),
        }
      })
    }
  } catch {
    // fallback
  }

  const localStores: StoreItem[] = getLocalStores().map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: (s.category || '').toLowerCase(),
    subcategories: s.subcategories || [],
    large_banner_url: s.large_banner_url,
    small_banner_url: s.small_banner_url,
    logo_url: s.logo_url,
    description: s.description,
    plan: (s.effective_plan || s.plan || 'bronze').toLowerCase(),
    is_active: Boolean(s.is_active),
  }))

  const combinedStores: StoreItem[] = [
    ...(dbStores.length > 0 ? dbStores : DEMO_STORES_FALLBACK),
  ]
  for (const ls of localStores) {
    if (!combinedStores.some((s) => s.id === ls.id)) {
      combinedStores.unshift(ls)
    }
  }

  const localProdsMapped: ProductItem[] = getLocalProducts()
    .filter((lp) => lp.is_active !== false)
    .map((lp) => {
      const storeObj = combinedStores.find((s) => s.id === lp.store_id)
      const isVeh = Boolean(
        lp.is_vehicle ||
          lp.vehicle_version ||
          lp.vehicle_km ||
          lp.vehicle_traction ||
          lp.vehicle_year_fab ||
          lp.vehicle_year_model
      )
      const hasPromo = Boolean(lp.promotional_price && lp.promotional_price < lp.price)
      const effectivePrice = hasPromo ? lp.promotional_price! : lp.price
      return {
        id: lp.id,
        store_id: lp.store_id,
        store_name: storeObj?.name || 'Loja Parceira',
        name: lp.name,
        description: lp.description,
        price: `R$ ${formatCurrencyBRL(effectivePrice)}`,
        regular_price: lp.price,
        promotional_price: hasPromo ? lp.promotional_price : null,
        image_url:
          lp.image_url ||
          (lp.images && lp.images[0]) ||
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
        images:
          lp.images && lp.images.length > 0 ? lp.images : lp.image_url ? [lp.image_url] : [],
        photo_orientation: lp.photo_orientation || (isVeh ? 'horizontal' : 'vertical'),
        category: (lp.category || storeObj?.category || '').toLowerCase(),
        subcategory: (lp.subcategory || '').toLowerCase(),
        promo_type: lp.promo_type || (lp.is_novidade ? 'lancamento' : 'outlet'),
        is_vehicle: isVeh,
        vehicle_category: lp.vehicle_category || null,
        vehicle_brand: lp.vehicle_brand || null,
        vehicle_model: lp.vehicle_model || null,
        vehicle_version: lp.vehicle_version || null,
        vehicle_year_fab: lp.vehicle_year_fab || null,
        vehicle_year_model: lp.vehicle_year_model || null,
        vehicle_km: lp.vehicle_km || null,
        vehicle_transmission: lp.vehicle_transmission || null,
        vehicle_traction: lp.vehicle_traction || null,
        is_outlet: Boolean(lp.is_outlet),
        is_novidade: Boolean(lp.is_novidade),
        is_active: Boolean(lp.is_active),
        published_at: lp.published_at || lp.created_at || new Date().toISOString(),
      }
    })

  const combinedProducts: ProductItem[] = [...dbProducts]
  for (const lpm of localProdsMapped) {
    if (!combinedProducts.some((p) => p.id === lpm.id)) {
      combinedProducts.unshift(lpm)
    }
  }

  combinedProducts.sort((a, b) => {
    const timeA = new Date(a.published_at).getTime()
    const timeB = new Date(b.published_at).getTime()
    if (timeB !== timeA) return timeB - timeA
    return b.id.localeCompare(a.id)
  })

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <UserOfficeClient
        initialUser={initialUser}
        allStores={combinedStores}
        allProducts={combinedProducts}
      />
    </Suspense>
  )
}
