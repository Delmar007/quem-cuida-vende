'use client'

import React, { useState, useMemo } from 'react'
import { StoreCategoryWithSubcategories } from '@/lib/categories-storage'
import ProductCardImageCarousel from '@/components/ProductCardImageCarousel'

export interface ProductItem {
  id: string
  name: string
  description?: string | null
  price: number
  promotional_price?: number | null
  image_url?: string | null
  images?: string[]
  sku?: string | null
  category?: string | null
  subcategory?: string | null
  promo_type?: string | null
  is_vehicle?: boolean
  vehicle_category?: string | null
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_version?: string | null
  vehicle_year_fab?: string | null
  vehicle_year_model?: string | null
  vehicle_km?: string | null
  vehicle_transmission?: string | null
  vehicle_traction?: string | null
  is_outlet?: boolean
  is_novidade?: boolean
  is_active?: boolean
  photo_orientation?: 'vertical' | 'horizontal'
  published_at?: string
  created_at?: string
}

const NOMES_PROMOCOES_CARD: Record<string, string> = {
  outlet: 'Outlet',
  lancamento: 'Lançamento',
  novidades: 'Lançamento',
  vitrine: 'Vitrine',
  recondicionado: 'Recondicionado',
  ultimas_unidades: 'Últimas unidades',
  exclusividade: 'Exclusividade',
  sob_encomenda: 'Sob Encomenda',
  importado: 'Importado',
  peca_unica: 'Peça única',
  pequeno_defeito: 'Pequeno Defeito',
  artezanal: 'Artezanal',
  artesanal: 'Artezanal',
  novo: 'Novo',
  usado: 'Usado',
  semi_novo: 'Semi-novo',
  seminovo: 'Semi-novo',
  'semi-novo': 'Semi-novo',
}

function getCardPromoLabel(prod: ProductItem): string {
  const key = (prod.promo_type || '').toLowerCase()
  if (key && NOMES_PROMOCOES_CARD[key]) return NOMES_PROMOCOES_CARD[key]
  if (prod.is_outlet) return 'Outlet'
  if (prod.is_novidade) return 'Lançamento'
  return 'Outlet'
}

export function formatCurrencyBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0,00'
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value
  if (isNaN(num)) return '0,00'
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parsePriceInput(val: string): number | null {
  if (!val || !val.trim()) return null
  const cleaned = val.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const STORE_CATEGORY_MAP: Record<string, string> = {
  moda: 'Moda',
  pet: 'Pet',
  agro: 'Agro',
  carro: 'Carro',
  escritorio: 'Escritório',
  eletro: 'Eletro',
  casa: 'Casa',
  beleza: 'Beleza',
}

function formatStoreCategorySubcategory(category?: string | null, subcategory?: string | null): string {
  const catKey = (category || '').toLowerCase()
  const catLabel =
    STORE_CATEGORY_MAP[catKey] ||
    (category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : '')
  if (!subcategory) return catLabel
  return catLabel ? `${catLabel} / ${subcategory}` : subcategory
}

interface StoreProductsCatalogProps {
  products: ProductItem[]
  categories?: StoreCategoryWithSubcategories[]
  storeName: string
  storePhone?: string | null
  storeLogoUrl?: string | null
  storeAddress?: string | null
  storeDescription?: string | null
  storeCategory?: string | null
  storeSubcategories?: string[]
  onOpenLogoAdjust?: () => void
  isMobileView?: boolean
}

export default function StoreProductsCatalog({
  products = [],
  categories = [],
  storeName,
  storePhone,
  storeLogoUrl,
  storeAddress,
  storeDescription,
  storeCategory,
  storeSubcategories = [],
  onOpenLogoAdjust,
  isMobileView = false,
}: StoreProductsCatalogProps) {
  // Estados de navegação e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>('demo-calcado-fem')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)

  // Compartilhar loja
  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Confira os produtos de ${storeName} no Kittanda Outlet!`,
          url,
        })
        return
      } catch {
        // cancelado pelo usuário
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2000)
    } catch {
      // fallback
    }
  }
  
  // Filtro de Valor (Preço)
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [selectedPricePreset, setSelectedPricePreset] = useState<string>('all')

  // Modal de Detalhes
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductItem | null>(null)
  const [activeModalImageIndex, setActiveModalImageIndex] = useState(0)

  // Apenas produtos ativos
  const activeProducts = useMemo(() => {
    return products.filter((p) => p.is_active !== false)
  }, [products])

  // Lista de categorias da loja
  // Se a loja tiver categorias cadastradas no Dispositivo nº 6, usamos elas.
  // Caso contrário, extraímos categorias dos próprios produtos ou usamos exemplo base.
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.filter((c) => c.is_active !== false)
    }

    // Fallback: extrair das categorias dos produtos cadastrados
    const catMap = new Map<string, Set<string>>()
    activeProducts.forEach((p) => {
      const cat = p.category?.trim()
      if (cat) {
        if (!catMap.has(cat)) catMap.set(cat, new Set())
        if (p.subcategory?.trim()) {
          catMap.get(cat)!.add(p.subcategory.trim())
        }
      }
    })

    if (catMap.size > 0) {
      return Array.from(catMap.entries()).map(([catName, subSet], idx) => ({
        id: `auto-cat-${idx}`,
        store_id: 'auto',
        name: catName,
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: Array.from(subSet).map((subName, sIdx) => ({
          id: `auto-sub-${idx}-${sIdx}`,
          category_id: `auto-cat-${idx}`,
          name: subName,
          is_active: true,
          created_at: new Date().toISOString(),
        })),
      }))
    }

    // Categorias padrão de demonstração inspiradas no padrão da loja (Privalia / Outlet)
    return [
      {
        id: 'demo-novos-descontos',
        store_id: 'demo',
        name: 'Seleção com Novos Descontos',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-masc-60',
        store_id: 'demo',
        name: 'Masculino: Tudo até 60% OFF',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-fem-60',
        store_id: 'demo',
        name: 'Feminino: Tudo até 60% OFF',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-inf-60',
        store_id: 'demo',
        name: 'Infantil: Tudo até 60% OFF',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-calcado-fem',
        store_id: 'demo',
        name: 'Calçado Feminino',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-corrida-treino', category_id: 'demo-calcado-fem', name: 'Tênis de Corrida e Treino', is_active: true, created_at: '' },
          { id: 'sub-casual', category_id: 'demo-calcado-fem', name: 'Tênis Casual', is_active: true, created_at: '' },
          { id: 'sub-chinelos', category_id: 'demo-calcado-fem', name: 'Chinelos', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-calcado-masc',
        store_id: 'demo',
        name: 'Calçado Masculino',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-masc-tenis', category_id: 'demo-calcado-masc', name: 'Tênis Esportivo', is_active: true, created_at: '' },
          { id: 'sub-masc-casual', category_id: 'demo-calcado-masc', name: 'Tênis Casual', is_active: true, created_at: '' },
          { id: 'sub-masc-chinelos', category_id: 'demo-calcado-masc', name: 'Chinelos & Slides', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-moda-fem',
        store_id: 'demo',
        name: 'Moda Feminina',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-fem-camisetas', category_id: 'demo-moda-fem', name: 'Camisetas & Tops', is_active: true, created_at: '' },
          { id: 'sub-fem-calcas', category_id: 'demo-moda-fem', name: 'Calças & Leggings', is_active: true, created_at: '' },
          { id: 'sub-fem-shorts', category_id: 'demo-moda-fem', name: 'Shorts & Bermudas', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-moda-masc',
        store_id: 'demo',
        name: 'Moda Masculina',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-masc-camisetas', category_id: 'demo-moda-masc', name: 'Camisetas & Polos', is_active: true, created_at: '' },
          { id: 'sub-masc-bermudas', category_id: 'demo-moda-masc', name: 'Bermudas & Shorts', is_active: true, created_at: '' },
          { id: 'sub-masc-agasalhos', category_id: 'demo-moda-masc', name: 'Agasalhos & Jaquetas', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-calcados-infantil',
        store_id: 'demo',
        name: 'Calçados Infantil',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-inf-tenis', category_id: 'demo-calcados-infantil', name: 'Tênis Infantil', is_active: true, created_at: '' },
          { id: 'sub-inf-sandalias', category_id: 'demo-calcados-infantil', name: 'Sandálias & Chinelos', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-moda-infantil',
        store_id: 'demo',
        name: 'Moda Infantil',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-inf-meninos', category_id: 'demo-moda-infantil', name: 'Meninos', is_active: true, created_at: '' },
          { id: 'sub-inf-meninas', category_id: 'demo-moda-infantil', name: 'Meninas', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-acessorios-esportivos',
        store_id: 'demo',
        name: 'Acessórios Esportivos',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-esp-mochilas', category_id: 'demo-acessorios-esportivos', name: 'Mochilas & Bolsas', is_active: true, created_at: '' },
          { id: 'sub-esp-bones', category_id: 'demo-acessorios-esportivos', name: 'Bonés & Viseiras', is_active: true, created_at: '' },
          { id: 'sub-esp-meias', category_id: 'demo-acessorios-esportivos', name: 'Meias', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-bolas',
        store_id: 'demo',
        name: 'Bolas',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-bola-campo', category_id: 'demo-bolas', name: 'Campo', is_active: true, created_at: '' },
          { id: 'sub-bola-futsal', category_id: 'demo-bolas', name: 'Futsal', is_active: true, created_at: '' },
          { id: 'sub-bola-basquete', category_id: 'demo-bolas', name: 'Basquete', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-tenis-direto',
        store_id: 'demo',
        name: 'Tênis',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-acessorios',
        store_id: 'demo',
        name: 'Acessórios',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-acess-garrafas', category_id: 'demo-acessorios', name: 'Garrafas & Squeezes', is_active: true, created_at: '' },
          { id: 'sub-acess-relogios', category_id: 'demo-acessorios', name: 'Relógios & Óculos', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-futebol',
        store_id: 'demo',
        name: 'Futebol',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [
          { id: 'sub-fut-chuteiras', category_id: 'demo-futebol', name: 'Chuteiras Campo & Society', is_active: true, created_at: '' },
          { id: 'sub-fut-camisas', category_id: 'demo-futebol', name: 'Camisas de Time', is_active: true, created_at: '' },
          { id: 'sub-fut-caneleiras', category_id: 'demo-futebol', name: 'Caneleiras & Luvas', is_active: true, created_at: '' },
        ],
      },
      {
        id: 'demo-parcerias',
        store_id: 'demo',
        name: 'Corinthians na Privalia',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
      {
        id: 'demo-ultimas-pecas',
        store_id: 'demo',
        name: 'Seleção De Últimas Peças',
        is_active: true,
        created_at: new Date().toISOString(),
        subcategories: [],
      },
    ]
  }, [categories, activeProducts])

  // Ação de clique na Categoria Principal (Comportamento de Accordion)
  // "ao clicar na categoria camisa, em baixo de camisa , entre camisa e sapato abre as subcategorias... segundo clique na categoria camisa, as subcategorias reclhem desaparecendo do menu"
  const handleCategoryClick = (cat: { id: string; name: string }) => {
    if (expandedCategoryId === cat.id) {
      // Segundo clique: recolhe o menu e reseta para todos os produtos
      setExpandedCategoryId(null)
      setSelectedCategory('all')
      setSelectedSubcategory('all')
    } else {
      // Primeiro clique: abre subcategorias e filtra pela categoria
      setExpandedCategoryId(cat.id)
      setSelectedCategory(cat.name)
      setSelectedSubcategory('all')
    }
  }

  // Ação de clique na Subcategoria
  const handleSubcategoryClick = (catName: string, subName: string) => {
    setSelectedCategory(catName)
    setSelectedSubcategory(subName)
  }

  // Ações de navegação do menu para a lista de produtos
  const handleViewAll = () => {
    setSelectedCategory('all')
    setSelectedSubcategory('all')
  }

  const handleSelectDirectCategory = (catName: string) => {
    setSelectedCategory(catName)
    setSelectedSubcategory('all')
  }

  const handleSelectCategoryAll = (catName: string) => {
    setSelectedCategory(catName)
    setSelectedSubcategory('all')
  }

  // Selecionar preset rápido de valor
  const handleSelectPricePreset = (preset: string, min?: number, max?: number) => {
    setSelectedPricePreset(preset)
    setMinPriceInput(min !== undefined && min > 0 ? formatCurrencyBRL(min) : '')
    setMaxPriceInput(max !== undefined ? formatCurrencyBRL(max) : '')
  }

  // Limpar todos os filtros
  const handleClearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedSubcategory('all')
    setExpandedCategoryId(null)
    setMinPriceInput('')
    setMaxPriceInput('')
    setSelectedPricePreset('all')
  }

  // Parse de preços mínimos e máximos (suporta 50,00 ou 10.000,00 ou 50)
  const parsedMin = parsePriceInput(minPriceInput)
  const parsedMax = parsePriceInput(maxPriceInput)

  // Filtragem e Ordenação por ordem de chegada (cronológica decrescente)
  // "a disposição de produtos ficrá aleatoria, por ordem de chegada, conforme vai cadastrando os produtos vão descendo para baixo, tudo misturado"
  const filteredProducts = useMemo(() => {
    // 1. Clonar para ordenar por data mais recente primeiro (novos produtos no topo, descendo conforme cadastrados)
    const sorted = [...activeProducts].sort((a, b) => {
      const dateA = new Date(a.created_at || a.published_at || 0).getTime()
      const dateB = new Date(b.created_at || b.published_at || 0).getTime()
      return dateB - dateA
    })

    return sorted.filter((prod) => {
      // Busca textual abrangente dentro do catálogo (nome, SKU, descrição, categoria, subcategoria)
      if (searchTerm.trim()) {
        const terms = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean)
        const fullSearchableText = [
          prod.name,
          prod.sku,
          prod.description,
          prod.category,
          prod.subcategory,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        const matchAllTerms = terms.every((t) => fullSearchableText.includes(t))
        if (!matchAllTerms) return false
      }

      // Filtro de Categoria
      if (selectedCategory !== 'all') {
        const prodCat = (prod.category || '').toLowerCase().trim()
        const targetCat = selectedCategory.toLowerCase().trim()
        if (prodCat !== targetCat) return false

        // Filtro de Subcategoria
        if (selectedSubcategory !== 'all') {
          const prodSub = (prod.subcategory || '').toLowerCase().trim()
          const targetSub = selectedSubcategory.toLowerCase().trim()
          if (prodSub !== targetSub) return false
        }
      }

      // Filtro de Valor (Preço Efetivo: Promocional se houver, ou Regular)
      const effectivePrice = prod.promotional_price && prod.promotional_price < prod.price
        ? prod.promotional_price
        : prod.price

      if (parsedMin !== null && !isNaN(parsedMin)) {
        if (effectivePrice < parsedMin) return false
      }
      if (parsedMax !== null && !isNaN(parsedMax)) {
        if (effectivePrice > parsedMax) return false
      }

      return true
    })
  }, [activeProducts, searchTerm, selectedCategory, selectedSubcategory, parsedMin, parsedMax])

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    minPriceInput ||
    maxPriceInput ||
    selectedPricePreset !== 'all'
  )

  const phoneDigits = storePhone ? storePhone.replace(/\D/g, '') : ''

  // Abrir modal de detalhes
  const handleOpenDetailModal = (prod: ProductItem) => {
    setSelectedProductDetail(prod)
    setActiveModalImageIndex(0)
  }

  return (
    <div className="w-full">
      {/* Barra Informativa de Filtro Ativo */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-3 border-b border-gray-200 bg-white p-2.5 rounded-[2px] shadow-2xs text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 uppercase">
              {selectedCategory === 'all' ? 'Todos os Produtos' : `${selectedCategory}${selectedSubcategory !== 'all' ? ` › ${selectedSubcategory}` : ''}`}
            </span>
            <span className="text-gray-500 font-mono">
              ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'})
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-[11px] font-bold text-[#FB6600] hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      )}
      {/* =================================================================== */}
      {/* MODO CELULAR: MENU DA LOJA COM DADOS COMPLETOS + GRADE 2 COLUNAS    */}
      {/* =================================================================== */}
      {isMobileView ? (
        <div className="space-y-4 w-full">
          {/* Menu da Loja com a Ordem Exata Solicitada */}
          <div className="bg-white border border-gray-200/90 p-4 rounded-[2px] shadow-2xs space-y-3.5">
            {/* Topo: 1. Logo Redonda, 2. Nome da Loja, 3. Endereço, 4. Texto Explicativo/Slogan, 5. Categoria/Subcategoria, 6. Botão WhatsApp */}
            <div className="relative pb-3.5 border-b border-gray-100 flex flex-col items-center text-center">
              {/* Botão Compartilhar no canto superior direito */}
              <div className="absolute top-0 right-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-8 h-8 rounded-lg border border-gray-300/80 hover:border-black flex items-center justify-center text-gray-700 hover:text-black transition-colors cursor-pointer bg-white shadow-2xs relative"
                  title="Compartilhar vitrine da loja"
                  aria-label="Compartilhar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {copiedShare && (
                    <span className="absolute -bottom-6 right-0 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-in fade-in">
                      Link copiado!
                    </span>
                  )}
                </button>
              </div>

              {/* 1. Logo Redonda */}
              <div className="relative mb-2.5">
                <div className="w-[77px] h-[77px] rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200 shadow-xs">
                  {storeLogoUrl ? (
                    <img
                      src={storeLogoUrl}
                      alt={storeName || 'Logo da Loja'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-black uppercase text-gray-500">
                      {(storeName || 'L')[0]}
                    </span>
                  )}
                </div>
                {onOpenLogoAdjust && (
                  <button
                    type="button"
                    onClick={onOpenLogoAdjust}
                    className="absolute -bottom-1 -right-1 bg-black text-white hover:bg-[#FB6600] p-1 rounded-full text-[9px] shadow cursor-pointer transition-colors"
                    title="Ajustar Logotipo no círculo"
                  >
                    ✏️
                  </button>
                )}
              </div>

              {/* 2. Nome da Loja */}
              <h2 className="text-lg font-black tracking-tight text-neutral-900 uppercase px-6 leading-tight">
                {storeName || 'Loja'}
              </h2>

              {/* 3. Endereço */}
              {storeAddress && (
                <p className="text-[11px] text-gray-500 mt-1 flex items-center justify-center gap-1 leading-snug">
                  <span>📍</span>
                  <span>{storeAddress}</span>
                </p>
              )}

              {/* 4. Texto Explicativo da Loja ou Slogan */}
              {storeDescription && (
                <p className="text-xs text-gray-700 mt-1.5 leading-relaxed">
                  {storeDescription}
                </p>
              )}

              {/* 5. Categoria / Subcategoria */}
              {(storeSubcategories && storeSubcategories.length > 0) ? (
                <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
                  {storeSubcategories.map((sub) => (
                    <span
                      key={sub}
                      className="text-[10.5px] bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-[2px] font-semibold"
                    >
                      {formatStoreCategorySubcategory(storeCategory, sub)}
                    </span>
                  ))}
                </div>
              ) : storeCategory ? (
                <div className="mt-2.5 flex items-center justify-center">
                  <span className="text-[10.5px] bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-[2px] font-semibold">
                    {formatStoreCategorySubcategory(storeCategory, null)}
                  </span>
                </div>
              ) : null}

              {/* 6. Botão do WhatsApp */}
              {phoneDigits && (
                <a
                  href={`https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                    `Olá! Encontrei sua loja "${storeName}" na Kittanda Outlet e gostaria de mais informações.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full py-2 px-4 bg-black hover:bg-[#FB6600] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-[2px]"
                >
                  <span>WhatsApp</span>
                </a>
              )}
            </div>

            {/* 7. Ver tudo & 8. Categorias */}
            <div className="divide-y divide-gray-100">
              <div className="pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedSubcategory('all')
                    setExpandedCategoryId(null)
                  }}
                  className={`text-[13px] block text-left cursor-pointer transition-colors text-black ${
                    selectedCategory === 'all'
                      ? 'font-bold'
                      : 'font-normal hover:font-medium'
                  }`}
                >
                  Ver tudo
                </button>
              </div>

              {displayCategories.map((cat) => {
                const subs = (cat.subcategories || []).filter((s) => s.is_active !== false)
                const hasSubs = subs.length > 0
                const isExpanded = expandedCategoryId === cat.id
                const isCatSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim()

                return (
                  <div key={cat.id} className="py-2">
                    {hasSubs ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(cat)}
                          className="w-full flex items-center justify-between text-left cursor-pointer group"
                        >
                          <span className={`text-[13px] text-black transition-colors ${
                            isCatSelected ? 'font-bold' : 'font-normal group-hover:font-medium'
                          }`}>
                            {cat.name}
                          </span>
                          <svg
                            className={`w-3.5 h-3.5 text-neutral-900 transition-transform duration-200 stroke-[2.4] ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="pt-2 pl-3 space-y-1.5 animate-in fade-in duration-150">
                            {subs.map((sub) => {
                              const isSubSelected =
                                isCatSelected &&
                                selectedSubcategory.toLowerCase().trim() === sub.name.toLowerCase().trim()

                              return (
                                <div key={sub.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleSubcategoryClick(cat.name, sub.name)}
                                    className={`text-xs block text-left cursor-pointer transition-colors text-black ${
                                      isSubSelected
                                        ? 'font-bold'
                                        : 'font-normal hover:font-medium'
                                    }`}
                                  >
                                    {sub.name}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.name)
                          setSelectedSubcategory('all')
                          setExpandedCategoryId(null)
                        }}
                        className={`w-full text-left text-[13px] cursor-pointer transition-colors text-black ${
                          isCatSelected
                            ? 'font-bold'
                            : 'font-normal hover:font-medium'
                        }`}
                      >
                        {cat.name}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 9. Buscar no catálogo */}
            <div className="pt-2.5 border-t border-gray-100">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 select-none pointer-events-none">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar no catálogo..."
                  className="w-full pl-9 pr-7 py-2 text-xs border border-gray-300 rounded-[2px] focus:outline-none focus:border-black font-medium bg-gray-50/50 text-neutral-900"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-xs font-bold text-gray-400 hover:text-black cursor-pointer"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* 10. Filtro por Preço */}
            <details className="pt-2 border-t border-gray-100 group text-xs text-neutral-700" open>
              <summary className="font-semibold flex items-center justify-between py-1 text-[11px] uppercase tracking-wider text-neutral-600 hover:text-neutral-900 cursor-pointer list-none">
                <span>Filtrar por Faixa de Preço</span>
                <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="pt-2 space-y-2.5">
                {/* 2 Caixas: Preço de ... Preço até ... */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 mb-1">
                      Preço de
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[11px] text-gray-400 font-medium select-none">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={minPriceInput}
                        onChange={(e) => {
                          setMinPriceInput(e.target.value)
                          setSelectedPricePreset('custom')
                        }}
                        placeholder="0,00"
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-[2px] focus:outline-none focus:border-black bg-white font-medium text-neutral-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-700 mb-1">
                      Preço até
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[11px] text-gray-400 font-medium select-none">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={maxPriceInput}
                        onChange={(e) => {
                          setMaxPriceInput(e.target.value)
                          setSelectedPricePreset('custom')
                        }}
                        placeholder="80,00"
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-[2px] focus:outline-none focus:border-black bg-white font-medium text-neutral-900"
                      />
                    </div>
                  </div>
                </div>

                {(minPriceInput || maxPriceInput) && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMinPriceInput('')
                        setMaxPriceInput('')
                        setSelectedPricePreset('all')
                      }}
                      className="text-[10px] text-[#FB6600] font-semibold hover:underline cursor-pointer"
                    >
                      Limpar valor
                    </button>
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* 3. Indicador de filtros ativos (mobile) */}
          {hasActiveFilters && (
            <div className="flex items-center justify-end text-xs px-1 text-gray-500">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] text-[#FB6600] font-bold underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* 4. Grade de produtos em 2 colunas para celular */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 p-8 text-center rounded-[2px]">
              <span className="text-3xl block mb-2">🛍️</span>
              <p className="text-xs font-bold text-gray-800 mb-2">Nenhum produto encontrado</p>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 bg-black text-white text-[11px] font-bold uppercase rounded cursor-pointer"
              >
                Ver Todos os Produtos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {filteredProducts.map((produto) => {
                const priceFinal =
                  produto.promotional_price && produto.promotional_price < produto.price
                    ? produto.promotional_price
                    : produto.price
                const hasPromo = Boolean(produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price)
                const discountPercent = hasPromo
                  ? Math.round(((produto.price - produto.promotional_price!) / produto.price) * 100)
                  : null
                const coverImage = produto.image_url || (produto.images && produto.images[0]) || null
                const otherStoreImages = filteredProducts
                  .filter((p) => p.id !== produto.id)
                  .map((p) => p.image_url || (p.images && p.images[0]))
                  .filter(Boolean) as string[]
                const cardImages =
                  produto.images && produto.images.length > 1
                    ? produto.images
                    : [coverImage, ...otherStoreImages].filter(Boolean) as string[]

                const isVehicleCard = Boolean(
                  produto.is_vehicle ||
                  produto.photo_orientation === 'horizontal' ||
                  produto.vehicle_version ||
                  produto.vehicle_km ||
                  produto.vehicle_traction ||
                  produto.vehicle_year_fab ||
                  produto.vehicle_year_model
                )

                return (
                  <div
                    key={produto.id}
                    onClick={() => handleOpenDetailModal(produto)}
                    className="group border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300 grid grid-cols-1 h-full w-full overflow-hidden cursor-pointer rounded-[2px]"
                  >
                    {/* Sizer invisível para garantir que o card de carros tenha o mesmo tamanho do card de produtos */}
                    <div className="col-start-1 row-start-1 invisible pointer-events-none select-none flex flex-col w-full" aria-hidden="true">
                      <div className="w-full aspect-[4/5]" />
                      <div className="p-2 sm:p-2.5 flex flex-col justify-between">
                        <div>
                          <div className="h-[11px] mb-0.5" />
                          <div className="h-[28px] mb-1" />
                        </div>
                        <div className="mt-1 pt-1.5 border-t border-transparent h-[32px]" />
                      </div>
                    </div>

                    <div className="col-start-1 row-start-1 flex flex-col h-full w-full overflow-hidden">
                      {/* Imagem do Produto/Veículo com Setas Laterais + Tags */}
                      <ProductCardImageCarousel
                        images={cardImages}
                        alt={produto.name}
                        photoOrientation={produto.photo_orientation || (isVehicleCard ? 'horizontal' : 'vertical')}
                        promoBadgeLabel={getCardPromoLabel(produto)}
                        subcategory={produto.subcategory}
                        hasDiscount={hasPromo}
                        discountPercent={discountPercent}
                        onImageClick={() => handleOpenDetailModal(produto)}
                        compact={true}
                      />

                      {/* Conteúdo do Card Mobile */}
                      <div className="p-2 sm:p-2.5 flex flex-col flex-grow justify-between bg-white">
                        <div className="flex flex-col flex-grow">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wide block truncate mb-0.5 font-medium">
                            {storeName}
                          </span>
                          <h3 className="text-xs text-gray-900 font-semibold leading-tight line-clamp-1 mb-1 group-hover:text-[#FB6600] transition-colors">
                            {produto.name}
                          </h3>

                          {isVehicleCard && (
                            <div className="mt-0.5 flex flex-col gap-1 flex-grow justify-center">
                              <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-1.5 py-1">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                  Versão
                                </span>
                                <span className="text-[10px] font-semibold text-neutral-800 leading-tight line-clamp-2 block">
                                  {produto.vehicle_version || produto.description || 'Consulte dados da versão'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-1.5 py-0.5">
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">KM</span>
                                  <span className="text-[9.5px] font-bold text-neutral-900 truncate block">{produto.vehicle_km || 'Consulte'}</span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-1.5 py-0.5">
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">Tração</span>
                                  <span className="text-[9.5px] font-bold text-neutral-900 truncate block">{produto.vehicle_traction || 'Integral / 4x2'}</span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-1.5 py-0.5">
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">Ano</span>
                                  <span className="text-[9.5px] font-bold text-neutral-900 truncate block">{produto.vehicle_year_fab || '—'}</span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-1.5 py-0.5">
                                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">Ano/Modelo</span>
                                  <span className="text-[9.5px] font-bold text-neutral-900 truncate block">
                                    {produto.vehicle_year_fab && produto.vehicle_year_model
                                      ? `${produto.vehicle_year_fab}/${produto.vehicle_year_model}`
                                      : produto.vehicle_year_model || produto.vehicle_year_fab || '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs sm:text-sm font-bold text-neutral-900">
                                R$ {formatCurrencyBRL(priceFinal)}
                              </span>
                            </div>
                            {hasPromo && (
                              <span className="text-[9px] text-gray-400 line-through block">
                                R$ {formatCurrencyBRL(produto.price)}
                              </span>
                            )}
                          </div>
                          <span className="text-[9.5px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded">
                            Ver
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* ESTRUTURA EM 3 COLUNAS: MENU VERTICAL (ESQ) + GRADE DE CARDS (DIR) */
        /* =================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ----------------------------------------------------------------- */}
        {/* COLUNA 1 (ESQUERDA): MENU DA LOJA ESTILO PRIVALIA / OUTLET        */}
        {/* ----------------------------------------------------------------- */}
        <aside className="lg:col-span-1 bg-white border border-gray-200/80 p-4 sm:p-5 rounded-[2px] shadow-2xs space-y-4">
          
          {/* TOPO: 1. LOGO REDONDA, 2. NOME DA LOJA, 3. ENDEREÇO, 4. TEXTO EXPLICATIVO/SLOGAN, 5. CATEGORIA/SUBCATEGORIA, 6. BOTÃO DO WHATSAPP */}
          <div className="relative pb-4 border-b border-gray-100 flex flex-col items-center text-center">
            {/* Botão de Compartilhar (Quadrado com cantos arredondados) */}
            <div className="absolute top-0 right-0">
              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-lg border border-gray-300/80 hover:border-black flex items-center justify-center text-gray-700 hover:text-black transition-colors cursor-pointer bg-white shadow-2xs relative"
                title="Compartilhar vitrine da loja"
                aria-label="Compartilhar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copiedShare && (
                  <span className="absolute -bottom-6 right-0 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap animate-in fade-in">
                    Link copiado!
                  </span>
                )}
              </button>
            </div>

            {/* 1. Logo Redonda */}
            <div className="relative mb-3">
              <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 border border-gray-200 shadow-xs">
                {storeLogoUrl ? (
                  <img
                    src={storeLogoUrl}
                    alt={storeName || 'Logo da Loja'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black uppercase text-gray-500">
                    {(storeName || 'L')[0]}
                  </span>
                )}
              </div>
              {onOpenLogoAdjust && (
                <button
                  type="button"
                  onClick={onOpenLogoAdjust}
                  className="absolute -bottom-1 -right-1 bg-black text-white hover:bg-[#FB6600] p-1 rounded-full text-[9px] shadow cursor-pointer transition-colors"
                  title="Ajustar Logotipo no círculo"
                >
                  ✏️
                </button>
              )}
            </div>

            {/* 2. Nome da Loja */}
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 uppercase px-4 leading-tight">
              {storeName || 'Loja'}
            </h2>

            {/* 3. Endereço */}
            {storeAddress && (
              <p className="text-xs text-gray-500 mt-1.5 flex items-center justify-center gap-1 leading-snug">
                <span>📍</span>
                <span>{storeAddress}</span>
              </p>
            )}

            {/* 4. Texto Explicativo da Loja ou Slogan */}
            {storeDescription && (
              <p className="text-xs sm:text-[13px] text-gray-700 mt-2 leading-relaxed">
                {storeDescription}
              </p>
            )}

            {/* 5. Categoria / Subcategoria */}
            {(storeSubcategories && storeSubcategories.length > 0) ? (
              <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                {storeSubcategories.map((sub) => (
                  <span
                    key={sub}
                    className="text-[11px] bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-[2px] font-semibold"
                  >
                    {formatStoreCategorySubcategory(storeCategory, sub)}
                  </span>
                ))}
              </div>
            ) : storeCategory ? (
              <div className="mt-3 flex items-center justify-center">
                <span className="text-[11px] bg-neutral-100 text-neutral-800 px-2.5 py-0.5 rounded-[2px] font-semibold">
                  {formatStoreCategorySubcategory(storeCategory, null)}
                </span>
              </div>
            ) : null}

            {/* 6. Botão do WhatsApp */}
            {phoneDigits && (
              <a
                href={`https://wa.me/55${phoneDigits}?text=${encodeURIComponent(
                  `Olá! Encontrei sua loja "${storeName}" na Kittanda Outlet e gostaria de mais informações.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3.5 w-full py-2.5 px-4 bg-black hover:bg-[#FB6600] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 rounded-[2px]"
              >
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* LISTA DE CATEGORIAS E SUBCATEGORIAS ACCORDION */}
          <div className="divide-y divide-gray-100">
            {/* 1. "Ver tudo" no topo mantendo cor preta e negrito quando ativo */}
            <div className="pb-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedSubcategory('all')
                  setExpandedCategoryId(null)
                }}
                className={`text-[13.5px] block text-left cursor-pointer transition-colors text-black ${
                  selectedCategory === 'all'
                    ? 'font-bold'
                    : 'font-normal hover:font-medium'
                }`}
              >
                Ver tudo
              </button>
            </div>

            {/* 2. Categorias */}
            {displayCategories.map((cat) => {
              const subs = (cat.subcategories || []).filter((s) => s.is_active !== false)
              const hasSubs = subs.length > 0
              const isExpanded = expandedCategoryId === cat.id
              const isCatSelected = selectedCategory.toLowerCase().trim() === cat.name.toLowerCase().trim()

              return (
                <div key={cat.id} className="py-2.5">
                  {hasSubs ? (
                    <div>
                      {/* Botão Categoria com Chevron */}
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className="w-full flex items-center justify-between text-left cursor-pointer group"
                      >
                        <span className={`text-[13px] sm:text-[13.5px] text-black transition-colors ${
                          isCatSelected ? 'font-bold' : 'font-normal group-hover:font-medium'
                        }`}>
                          {cat.name}
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 text-neutral-900 transition-transform duration-200 stroke-[2.4] ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Subcategorias aninhadas */}
                      {isExpanded && (
                        <div className="pt-2 pl-3 space-y-1.5 animate-in fade-in duration-150">
                          {subs.map((sub) => {
                            const isSubSelected =
                              isCatSelected &&
                              selectedSubcategory.toLowerCase().trim() === sub.name.toLowerCase().trim()

                            return (
                              <div key={sub.id}>
                                <button
                                  type="button"
                                  onClick={() => handleSubcategoryClick(cat.name, sub.name)}
                                  className={`text-xs block text-left cursor-pointer transition-colors text-black ${
                                    isSubSelected
                                      ? 'font-bold'
                                      : 'font-normal hover:font-medium'
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Categoria direta sem subcategorias */
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name)
                        setSelectedSubcategory('all')
                        setExpandedCategoryId(null)
                      }}
                      className={`w-full text-left text-[13px] sm:text-[13.5px] cursor-pointer transition-colors text-black ${
                        isCatSelected
                          ? 'font-bold'
                          : 'font-normal hover:font-medium'
                      }`}
                    >
                      {cat.name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* FERRAMENTAS ADICIONAIS: BUSCA & FILTRO DE PREÇO (DISCRETOS) */}
          <div className="pt-3 border-t border-gray-100 space-y-2.5">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-gray-400 select-none pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar no catálogo..."
                className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-200 rounded-[2px] focus:outline-none focus:border-black bg-gray-50/50 text-neutral-900 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-black cursor-pointer"
                >
                  &times;
                </button>
              )}
            </div>

            <details className="group text-xs text-neutral-700" open>
              <summary className="font-semibold flex items-center justify-between py-1 text-[10.5px] uppercase tracking-wider text-neutral-500 hover:text-neutral-800 list-none cursor-pointer">
                <span>Filtrar por Faixa de Preço</span>
                <span className="text-[10px] group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="pt-2 space-y-2.5">
                {/* 2 Caixas: Preço de ... Preço até ... */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-700 mb-1">
                      Preço de
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[11px] text-gray-400 font-medium select-none">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={minPriceInput}
                        onChange={(e) => {
                          setMinPriceInput(e.target.value)
                          setSelectedPricePreset('custom')
                        }}
                        placeholder="0,00"
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-[2px] focus:outline-none focus:border-black bg-white font-medium text-neutral-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-neutral-700 mb-1">
                      Preço até
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-[11px] text-gray-400 font-medium select-none">R$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={maxPriceInput}
                        onChange={(e) => {
                          setMaxPriceInput(e.target.value)
                          setSelectedPricePreset('custom')
                        }}
                        placeholder="80,00"
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-gray-300 rounded-[2px] focus:outline-none focus:border-black bg-white font-medium text-neutral-900"
                      />
                    </div>
                  </div>
                </div>

                {(minPriceInput || maxPriceInput) && (
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMinPriceInput('')
                        setMaxPriceInput('')
                        setSelectedPricePreset('all')
                      }}
                      className="text-[10px] text-[#FB6600] font-semibold hover:underline cursor-pointer"
                    >
                      Limpar valor
                    </button>
                  </div>
                )}
              </div>
            </details>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="w-full py-1.5 text-[10.5px] text-gray-500 hover:text-black font-semibold border border-dashed border-gray-200 rounded cursor-pointer"
              >
                Limpar Todos os Filtros
              </button>
            )}
          </div>
        </aside>

        {/* ----------------------------------------------------------------- */}
        {/* COLUNAS 2 E 3 (DIREITA): GRADE DE PRODUTOS (CARDS PÁGINA INICIAL) */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Barra Informativa de Resultados */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-black text-white tracking-widest rounded-none">
                  {selectedCategory === 'all' ? 'Todos os Produtos' : selectedCategory}
                </span>
                {selectedSubcategory !== 'all' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#FB6600] text-[#FB6600] tracking-widest rounded-none">
                    {selectedSubcategory}
                  </span>
                )}
                {(parsedMin !== null || parsedMax !== null) && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-gray-100 text-gray-800 tracking-widest rounded-none">
                    R$ {formatCurrencyBRL(parsedMin || 0)} {parsedMax !== null ? `- R$ ${formatCurrencyBRL(parsedMax)}` : '(acima)'}
                  </span>
                )}
              </div>
              {selectedCategory !== 'all' && (
                <h2 className="text-base sm:text-lg font-light text-gray-800 tracking-wide uppercase">
                  {`${selectedCategory}${selectedSubcategory !== 'all' ? ` › ${selectedSubcategory}` : ''}`}
                </h2>
              )}
            </div>
          </div>

          {/* Grade de Cards de Produtos (Idêntica à Página Inicial) */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 p-12 text-center rounded-[2px]">
              <span className="text-3xl block mb-2">🛍️</span>
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                Nenhum produto encontrado para estes filtros
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Tente ajustar a busca, a faixa de valor ou selecionar outra categoria no menu ao lado.
              </p>
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
              >
                Ver Todos os Produtos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
              {filteredProducts.map((produto) => {
                const priceFinal = produto.promotional_price && produto.promotional_price < produto.price
                  ? produto.promotional_price
                  : produto.price
                const hasPromo = Boolean(produto.promotional_price && produto.promotional_price > 0 && produto.promotional_price < produto.price)
                const discountPercent = hasPromo
                  ? Math.round(((produto.price - produto.promotional_price!) / produto.price) * 100)
                  : null

                const coverImage = produto.image_url || (produto.images && produto.images[0]) || null
                const otherStoreImages = filteredProducts
                  .filter((p) => p.id !== produto.id)
                  .map((p) => p.image_url || (p.images && p.images[0]))
                  .filter(Boolean) as string[]
                const cardImages =
                  produto.images && produto.images.length > 1
                    ? produto.images
                    : [coverImage, ...otherStoreImages].filter(Boolean) as string[]

                const dataPublicacao = new Date(produto.created_at || produto.published_at || '')
                const dataFormatada = !isNaN(dataPublicacao.getTime())
                  ? dataPublicacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  : ''

                const isVehicleCard = Boolean(
                  produto.is_vehicle ||
                  produto.photo_orientation === 'horizontal' ||
                  produto.vehicle_version ||
                  produto.vehicle_km ||
                  produto.vehicle_traction ||
                  produto.vehicle_year_fab ||
                  produto.vehicle_year_model
                )

                return (
                  <div
                    key={produto.id}
                    className="group border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300 grid grid-cols-1 h-full w-full max-w-full overflow-hidden"
                  >
                    {/* Sizer invisível para manter o card de carros exatamente com o mesmo tamanho do card de produtos */}
                    <div className="col-start-1 row-start-1 invisible pointer-events-none select-none flex flex-col w-full" aria-hidden="true">
                      <div className="w-full aspect-[4/5]" />
                      <div className="p-4 flex flex-col justify-between">
                        <div>
                          <div className="h-[16px] mb-1" />
                          <div className="h-[40px] mb-1" />
                        </div>
                        <div className="mt-3 pt-3 border-t border-transparent h-[50px]" />
                      </div>
                    </div>

                    <div className="col-start-1 row-start-1 flex flex-col h-full w-full overflow-hidden">
                      {/* Imagem do Produto/Veículo com Setas Laterais + Tags de Modalidade */}
                      <ProductCardImageCarousel
                        images={cardImages}
                        alt={produto.name}
                        photoOrientation={produto.photo_orientation || (isVehicleCard ? 'horizontal' : 'vertical')}
                        promoBadgeLabel={getCardPromoLabel(produto)}
                        subcategory={produto.subcategory}
                        hasDiscount={hasPromo}
                        discountPercent={discountPercent}
                        onImageClick={() => handleOpenDetailModal(produto)}
                      />

                      {/* Conteúdo do Card */}
                      <div className="p-4 flex flex-col flex-grow justify-between bg-white">
                        <div className="flex flex-col flex-grow">
                          <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase tracking-wide mb-1">
                            <span className="font-semibold text-gray-600 line-clamp-1">{storeName}</span>
                            {dataFormatada && <span className="text-[10px] shrink-0 text-gray-400">{dataFormatada}</span>}
                          </div>
                          <h3
                            onClick={() => handleOpenDetailModal(produto)}
                            className={`text-sm text-gray-900 font-semibold leading-snug mb-1 cursor-pointer hover:text-[#FB6600] transition-colors ${
                              isVehicleCard ? 'line-clamp-1' : 'line-clamp-2'
                            }`}
                          >
                            {produto.name}
                          </h3>

                          {isVehicleCard ? (
                            <div className="mt-1.5 flex flex-col gap-2 flex-grow justify-center">
                              {/* Versão com os dados da versão */}
                              <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2.5 py-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                  Versão
                                </span>
                                <span className="text-[11px] font-semibold text-neutral-800 leading-snug line-clamp-2 block">
                                  {produto.vehicle_version || produto.description || 'Consulte especificações da versão'}
                                </span>
                              </div>

                              {/* Grade 2x2: KM, Tração, Ano, Ano/Modelo */}
                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                    KM
                                  </span>
                                  <span className="text-[11px] font-bold text-neutral-900 truncate block">
                                    {produto.vehicle_km || 'Consulte'}
                                  </span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                    Tração
                                  </span>
                                  <span className="text-[11px] font-bold text-neutral-900 truncate block">
                                    {produto.vehicle_traction || 'Integral / 4x2'}
                                  </span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                    Ano
                                  </span>
                                  <span className="text-[11px] font-bold text-neutral-900 truncate block">
                                    {produto.vehicle_year_fab || '—'}
                                  </span>
                                </div>
                                <div className="bg-neutral-50 border border-neutral-200/80 rounded-[2px] px-2 py-1">
                                  <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral-400 block leading-none mb-0.5">
                                    Ano/Modelo
                                  </span>
                                  <span className="text-[11px] font-bold text-neutral-900 truncate block">
                                    {produto.vehicle_year_fab && produto.vehicle_year_model
                                      ? `${produto.vehicle_year_fab}/${produto.vehicle_year_model}`
                                      : produto.vehicle_year_model || produto.vehicle_year_fab || '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            produto.description && (
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                                {produto.description}
                              </p>
                            )
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Preço</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-bold text-neutral-900">
                                R$ {formatCurrencyBRL(priceFinal)}
                              </span>
                              {hasPromo && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  R$ {formatCurrencyBRL(produto.price)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(produto)}
                            className="text-xs border border-gray-300 px-3 py-1.5 text-gray-700 hover:border-black hover:text-black font-semibold transition-colors cursor-pointer"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
      )}

      {/* =================================================================== */}
      {/* MODAL DE DETALHES COMPLETOS DO PRODUTO (3 FOTOS & WHATSAPP)        */}
      {/* =================================================================== */}
      {selectedProductDetail && (() => {
        const prod = selectedProductDetail
        const priceFinal = prod.promotional_price && prod.promotional_price < prod.price
          ? prod.promotional_price
          : prod.price
        const hasPromo = Boolean(prod.promotional_price && prod.promotional_price < prod.price)
        const allImages = prod.images && prod.images.length > 0
          ? prod.images.slice(0, 12)
          : prod.image_url
          ? [prod.image_url]
          : []
        const currentModalImage = allImages[activeModalImageIndex] || prod.image_url

        const waMessage = encodeURIComponent(
          `Olá! Gostei muito do produto "${prod.name}" (código: ${prod.sku || prod.id}) na loja "${storeName}" na Kittanda Outlet e gostaria de fechar a compra!`
        )
        const waLink = phoneDigits
          ? `https://wa.me/55${phoneDigits}?text=${waMessage}`
          : `https://wa.me/?text=${waMessage}`

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[2px] shadow-2xl border border-neutral-200 overflow-hidden my-6">
              {/* Topo do modal */}
              <div className="p-3 bg-neutral-900 text-white flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Detalhes do Produto • {storeName}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="text-white hover:opacity-80 font-bold text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Galeria de Fotos (até 3 fotos) */}
                  <div>
                    <div className={`${prod.photo_orientation === 'horizontal' ? 'aspect-[16/10] bg-black border-black' : 'aspect-[4/5] bg-neutral-100 border-neutral-200'} rounded-[2px] overflow-hidden relative border mb-2 flex items-center justify-center`}>
                      {currentModalImage ? (
                        <img
                          src={currentModalImage}
                          alt={prod.name}
                          className={`w-full h-full ${prod.photo_orientation === 'horizontal' ? 'object-contain p-2' : 'object-cover'}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          Sem foto
                        </div>
                      )}

                      {/* Badge do Tipo de Promoção no Canto Superior Esquerdo */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <span className="bg-[#FB6600] text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-[2px] shadow-sm">
                          {getCardPromoLabel(prod)}
                        </span>
                      </div>
                    </div>

                    {/* Miniaturas das até 3 fotos */}
                    {allImages.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {allImages.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveModalImageIndex(i)}
                            className={`w-12 h-14 rounded-[2px] overflow-hidden border shrink-0 transition-all cursor-pointer ${
                              activeModalImageIndex === i
                                ? 'border-[#FB6600] ring-1 ring-[#FB6600]'
                                : 'border-neutral-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Informações detalhadas */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 capitalize">
                        {prod.category} {prod.subcategory ? `› ${prod.subcategory}` : ''}
                      </span>
                      <h3 className="text-base font-black text-neutral-900 leading-tight mb-2">
                        {prod.name}
                      </h3>
                      {prod.sku && (
                        <span className="text-[10px] font-mono text-neutral-400 block mb-3">
                          Código / SKU: {prod.sku}
                        </span>
                      )}

                      {prod.is_vehicle && (
                        <div className="grid grid-cols-2 gap-1.5 mb-3 p-2.5 bg-neutral-50 border border-neutral-200 rounded-[2px] text-[11px]">
                          {prod.vehicle_brand && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">Marca / Modelo</span>
                              <span className="font-bold text-neutral-900">
                                {prod.vehicle_brand} {prod.vehicle_model}
                              </span>
                            </div>
                          )}
                          {prod.vehicle_version && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">Versão</span>
                              <span className="font-semibold text-neutral-800">{prod.vehicle_version}</span>
                            </div>
                          )}
                          {(prod.vehicle_year_fab || prod.vehicle_year_model) && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">Ano / Modelo</span>
                              <span className="font-semibold text-neutral-800">
                                {prod.vehicle_year_model || prod.vehicle_year_fab}
                              </span>
                            </div>
                          )}
                          {prod.vehicle_km && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">KM</span>
                              <span className="font-semibold text-neutral-800">{prod.vehicle_km} km</span>
                            </div>
                          )}
                          {prod.vehicle_transmission && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">Câmbio</span>
                              <span className="font-semibold text-neutral-800">{prod.vehicle_transmission}</span>
                            </div>
                          )}
                          {prod.vehicle_traction && (
                            <div>
                              <span className="text-neutral-400 uppercase font-bold text-[9px] block">Tração</span>
                              <span className="font-semibold text-neutral-800">{prod.vehicle_traction}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bloco de Preço */}
                      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-[2px] mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                          Preço do Produto
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-black text-black">
                            R$ {formatCurrencyBRL(priceFinal)}
                          </span>
                          {hasPromo && (
                            <span className="text-xs text-neutral-400 line-through">
                              R$ {formatCurrencyBRL(prod.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descrição */}
                      {prod.description ? (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                            Descrição do Produto
                          </span>
                          <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
                            {prod.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-400 italic">
                          Consulte mais detalhes sobre tamanhos e cores direto com a loja pelo WhatsApp.
                        </p>
                      )}
                    </div>

                    {/* Botão de Compra no WhatsApp */}
                    <div className="pt-4 border-t border-neutral-100 mt-4">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] shadow-sm transition-colors cursor-pointer"
                      >
                        <span>💬 Pedir pelo WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
