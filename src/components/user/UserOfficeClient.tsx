'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  UserOfficeData,
  saveUserOfficeProfileAction,
} from '@/app/actions/user-office'
import {
  getClientFollowedStores,
  setClientFollowedStores,
  toggleClientFollowStore,
  getClientFavoriteProducts,
  setClientFavoriteProducts,
  toggleClientFavoriteProduct,
} from '@/lib/user-preferences-client'
import ProductCardImageCarousel from '@/components/ProductCardImageCarousel'
import LogoAdjustModal from '@/components/merchant/LogoAdjustModal'
import type { StoreItem, ProductItem } from '@/app/page'

interface UserOfficeClientProps {
  initialUser: UserOfficeData
  allStores: StoreItem[]
  allProducts: ProductItem[]
}

const NOMES_PROMOCOES: Record<string, string> = {
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

const ABAS_OFFICE = [
  {
    id: 'dados',
    numero: '01',
    titulo: 'Meus Dados & Endereço',
    subtitulo: 'Foto, nome, WhatsApp e endereço',
    icone: '👤',
  },
  {
    id: 'feed',
    numero: '02',
    titulo: 'Feed que sigo',
    subtitulo: 'Itens postados pelas lojas que você segue',
    icone: '🔥',
  },
  {
    id: 'seguindo',
    numero: '03',
    titulo: 'Seguindo',
    subtitulo: 'Lojas que você está seguindo',
    icone: '🏪',
  },
  {
    id: 'favoritos',
    numero: '04',
    titulo: 'Favoritos',
    subtitulo: 'Produtos salvos nos seus favoritos',
    icone: '❤️',
  },
] as const

type AbaId = (typeof ABAS_OFFICE)[number]['id']

export default function UserOfficeClient({
  initialUser,
  allStores,
  allProducts,
}: UserOfficeClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = (searchParams.get('aba') || '').toLowerCase()
  const initialTab: AbaId =
    rawTab === 'feed' || rawTab === 'seguindo' || rawTab === 'favoritos' || rawTab === 'dados'
      ? (rawTab as AbaId)
      : 'dados'

  const [activeTab, setActiveTab] = useState<AbaId>(initialTab)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Estados de Perfil e Endereço
  const [displayName, setDisplayName] = useState(initialUser.displayName || '')
  const [email] = useState(initialUser.email || '')
  const [phone, setPhone] = useState(initialUser.phone || '')
  const [birthDate, setBirthDate] = useState(initialUser.birthDate || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialUser.avatarUrl || null)
  const [cep, setCep] = useState(initialUser.cep || '')
  const [street, setStreet] = useState(initialUser.street || '')
  const [number, setNumber] = useState(initialUser.number || '')
  const [neighborhood, setNeighborhood] = useState(initialUser.neighborhood || '')
  const [city, setCity] = useState(initialUser.city || '')
  const [state, setState] = useState(initialUser.state || '')
  const [loadingCep, setLoadingCep] = useState(false)

  // Upload e ajuste circular da foto de perfil
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isAvatarAdjustOpen, setIsAvatarAdjustOpen] = useState(false)
  const [avatarAdjustSource, setAvatarAdjustSource] = useState<string | null>(null)

  // Estados de Lojas Seguidas e Produtos Favoritos
  const [followedStoreIds, setFollowedStoreIds] = useState<string[]>(
    initialUser.followedStoreIds || []
  )
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(
    initialUser.favoriteProductIds || []
  )
  const [selectedStoreFilterInFeed, setSelectedStoreFilterInFeed] = useState<string>('all')

  // Feedback de salvamento
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Sincronizar aba quando searchParams mudar
  useEffect(() => {
    const paramAba = (searchParams.get('aba') || '').toLowerCase()
    if (
      paramAba === 'feed' ||
      paramAba === 'seguindo' ||
      paramAba === 'favoritos' ||
      paramAba === 'dados'
    ) {
      setActiveTab(paramAba as AbaId)
    }
  }, [searchParams])

  // Sincronizar localStorage <-> estado inicial de lojas seguidas e favoritos
  useEffect(() => {
    const clientFollowed = getClientFollowedStores()
    const mergedFollowed = Array.from(
      new Set([...(initialUser.followedStoreIds || []), ...clientFollowed])
    )
    setFollowedStoreIds(mergedFollowed)
    if (mergedFollowed.length > 0) {
      setClientFollowedStores(mergedFollowed)
    }

    const clientFavorites = getClientFavoriteProducts()
    const mergedFavorites = Array.from(
      new Set([...(initialUser.favoriteProductIds || []), ...clientFavorites])
    )
    setFavoriteProductIds(mergedFavorites)
    if (mergedFavorites.length > 0) {
      setClientFavoriteProducts(mergedFavorites)
    }

    const onFollowedChange = () => setFollowedStoreIds(getClientFollowedStores())
    const onFavoritesChange = () => setFavoriteProductIds(getClientFavoriteProducts())

    window.addEventListener('kittanda:followed-stores-changed', onFollowedChange)
    window.addEventListener('kittanda:favorite-products-changed', onFavoritesChange)
    return () => {
      window.removeEventListener('kittanda:followed-stores-changed', onFollowedChange)
      window.removeEventListener('kittanda:favorite-products-changed', onFavoritesChange)
    }
  }, [initialUser.followedStoreIds, initialUser.favoriteProductIds])

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11)
    if (raw.length <= 2) return raw
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`
  }

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
    let formatted = raw
    if (raw.length > 5) {
      formatted = `${raw.slice(0, 5)}-${raw.slice(5)}`
    }
    setCep(formatted)

    if (raw.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setStreet(data.logradouro || '')
          setNeighborhood(data.bairro || '')
          setCity(data.localidade || '')
          setState(data.uf || '')
        }
      } catch {
        // ignore
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setAvatarAdjustSource(dataUrl)
      setIsAvatarAdjustOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleApplyAvatarAdjust = (_file: File, previewUrl: string) => {
    // Converter blob URL ou manter data URL para salvar
    fetch(previewUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAvatarUrl(reader.result as string)
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => {
        setAvatarUrl(previewUrl)
      })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    try {
      const res = await saveUserOfficeProfileAction({
        displayName,
        phone,
        birthDate,
        avatarUrl,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
      })

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Seus dados, foto, WhatsApp e endereço foram salvos com sucesso no seu Perfil!',
        })
        router.refresh()
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao salvar seus dados.',
        })
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado ao salvar dados.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleFollow = (storeId: string) => {
    toggleClientFollowStore(storeId)
    setFollowedStoreIds(getClientFollowedStores())
  }

  const handleToggleFavorite = (productId: string) => {
    toggleClientFavoriteProduct(productId)
    setFavoriteProductIds(getClientFavoriteProducts())
  }

  // Lojas seguidas e sugeridas
  const followedStores = allStores.filter(
    (s) => followedStoreIds.includes(s.id) || (s.slug && followedStoreIds.includes(s.slug))
  )
  const suggestedStores = allStores.filter(
    (s) => !followedStoreIds.includes(s.id) && (!s.slug || !followedStoreIds.includes(s.slug))
  )

  // Produtos das lojas que o usuário segue ("Feed que sigo")
  const followedProducts = allProducts.filter((p) => {
    const isFromFollowedStore = followedStores.some(
      (s) => s.id === p.store_id || s.name.toLowerCase() === p.store_name.toLowerCase()
    )
    if (!isFromFollowedStore) return false
    if (selectedStoreFilterInFeed !== 'all' && p.store_id !== selectedStoreFilterInFeed) {
      return false
    }
    return true
  })

  // Produtos favoritos do usuário
  const favoriteProducts = allProducts.filter((p) => favoriteProductIds.includes(p.id))

  const activeAbaObj = ABAS_OFFICE.find((a) => a.id === activeTab) || ABAS_OFFICE[0]

  const renderProductCard = (produto: ProductItem) => {
    const dataPublicacao = new Date(produto.published_at)
    const dataFormatada = !isNaN(dataPublicacao.getTime())
      ? dataPublicacao.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : ''
    const promoBadgeLabel =
      NOMES_PROMOCOES[(produto.promo_type || '').toLowerCase()] ||
      (produto.is_novidade ? 'Lançamento' : 'Outlet')
    const hasDiscount =
      typeof produto.regular_price === 'number' &&
      typeof produto.promotional_price === 'number' &&
      produto.promotional_price > 0 &&
      produto.promotional_price < produto.regular_price
    const discountPercent = hasDiscount
      ? Math.round(
          ((produto.regular_price! - produto.promotional_price!) / produto.regular_price!) * 100
        )
      : null

    const isVehicleCard = Boolean(
      produto.is_vehicle ||
        produto.photo_orientation === 'horizontal' ||
        produto.vehicle_version ||
        produto.vehicle_km ||
        produto.vehicle_traction ||
        produto.vehicle_year_fab ||
        produto.vehicle_year_model ||
        (produto.category === 'carro' &&
          ['usados', 'concessionária', 'concessionaria'].includes(produto.subcategory))
    )
    const cardOrientation = isVehicleCard ? 'horizontal' : produto.photo_orientation || 'vertical'
    const cardImages =
      produto.images && produto.images.length > 0 ? produto.images : [produto.image_url]
    const isFav = favoriteProductIds.includes(produto.id)
    const storeObj = allStores.find(
      (s) => s.id === produto.store_id || s.name === produto.store_name
    )

    return (
      <div
        key={produto.id}
        className="group border border-gray-200 bg-white hover:shadow-md transition-shadow duration-300 flex flex-col h-full w-full overflow-hidden relative"
      >
        {/* Botão Favorito no canto superior */}
        <button
          type="button"
          onClick={() => handleToggleFavorite(produto.id)}
          title={isFav ? 'Remover dos Favoritos' : 'Salvar nos Favoritos'}
          className={`absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-sm ${
            isFav
              ? 'bg-rose-600 border-rose-600 text-white'
              : 'bg-white/90 hover:bg-white border-gray-200 text-gray-500 hover:text-rose-600'
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={isFav ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        <ProductCardImageCarousel
          images={cardImages}
          alt={produto.name}
          photoOrientation={cardOrientation}
          promoBadgeLabel={promoBadgeLabel}
          subcategory={produto.subcategory}
          hasDiscount={hasDiscount}
          discountPercent={discountPercent}
        />

        <div className="p-4 flex flex-col flex-grow justify-between bg-white">
          <div className="flex flex-col flex-grow">
            <div className="flex items-center justify-between text-[11px] text-gray-400 uppercase tracking-wide mb-1">
              <Link
                href={`/loja/${storeObj?.slug || produto.store_id}`}
                className="font-semibold text-[#FB6600] hover:underline line-clamp-1"
              >
                {produto.store_name}
              </Link>
              {dataFormatada && <span className="text-[10px] shrink-0 text-gray-400">{dataFormatada}</span>}
            </div>
            <h3 className="text-sm text-gray-900 font-semibold leading-snug mb-1.5 line-clamp-2">
              {produto.name}
            </h3>

            {isVehicleCard ? (
              <div className="my-auto py-1.5 space-y-1.5">
                <div className="bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-[2px]">
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block leading-tight">
                    Versão
                  </span>
                  <span className="text-[11px] font-semibold text-gray-800 block leading-snug line-clamp-1">
                    {produto.vehicle_version || produto.description || 'Versão Completa'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-[2px]">
                    <span className="text-[9px] uppercase text-gray-400 font-bold block">KM</span>
                    <span className="text-[11px] font-bold text-gray-800 block truncate">
                      {produto.vehicle_km || '0 km'}
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-[2px]">
                    <span className="text-[9px] uppercase text-gray-400 font-bold block">Ano</span>
                    <span className="text-[11px] font-bold text-gray-800 block truncate">
                      {produto.vehicle_year_model || produto.vehicle_year_fab || '2024'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              produto.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{produto.description}</p>
              )
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Preço</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-neutral-900">{produto.price}</span>
                {hasDiscount && produto.regular_price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    R$ {formatCurrencyBRL(produto.regular_price)}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/loja/${storeObj?.slug || produto.store_id}`}
              className="text-xs border border-gray-300 px-3 py-1.5 text-gray-700 hover:border-black hover:text-black font-semibold transition-colors"
            >
              Ver na Loja
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      {/* Topo Geral do Perfil do Usuário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
            Meu Perfil
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Seus dados, foto, WhatsApp, endereço, favoritos, lojas que você segue e o seu Feed que sigo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className="px-4 py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer shadow-xs"
          >
            Feed que sigo ({followedProducts.length})
          </button>
          {Boolean(initialUser.hasStore) && (
            <Link
              href="/painel/loja"
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 border border-neutral-300 text-xs font-semibold rounded-[2px] transition-colors"
            >
              Minha Loja
            </Link>
          )}
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 mb-6 text-xs rounded-[2px] flex items-center justify-between border animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-sm font-bold opacity-60 hover:opacity-100 ml-4 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Menu Mobile Retrátil */}
      <div className="lg:hidden mb-6 bg-white border border-neutral-200/90 rounded-[4px] shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-left bg-white hover:bg-neutral-50/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-7 h-7 rounded-[3px] bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {activeAbaObj.numero}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Meu Perfil • Toque para alternar
              </span>
              <span className="text-sm font-bold text-neutral-900 truncate block">
                {activeAbaObj.titulo}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-neutral-50 text-neutral-600">
            ▾
          </div>
        </button>

        {isMobileMenuOpen && (
          <div className="border-t border-neutral-200/80 bg-neutral-50/40 p-2 space-y-1">
            <div className="divide-y divide-neutral-100 bg-white rounded-[3px] border border-neutral-200/60 overflow-hidden">
              {ABAS_OFFICE.map((aba) => {
                const isActive = activeTab === aba.id
                return (
                  <button
                    key={aba.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(aba.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`w-full p-3 flex items-center justify-between text-left transition-colors cursor-pointer text-xs ${
                      isActive
                        ? 'bg-neutral-100/90 text-neutral-900 font-bold border-l-3 border-[#FB6600]'
                        : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-neutral-400">{aba.numero}</span>
                      <div>
                        <span className={`block ${aba.id === 'feed' ? 'text-[#FB6600] font-bold' : ''}`}>
                          {aba.titulo}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">{aba.subtitulo}</span>
                      </div>
                    </div>
                    {isActive && <span className="text-xs text-[#FB6600] font-bold">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Estrutura Principal: Menu Lateral Esquerdo + Conteúdo */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Menu Lateral Esquerdo (Desktop) */}
        <aside className="hidden lg:block w-[270px] shrink-0 bg-white border border-neutral-200/80 rounded-[4px] overflow-hidden sticky top-20 shadow-xs">
          {/* Resumo do Usuário */}
          <div className="p-4 border-b border-neutral-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-neutral-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{displayName ? displayName[0].toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-neutral-900 truncate">
                {displayName || 'Meu Perfil'}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                {city ? `${city}${state ? ` • ${state}` : ''}` : email || 'Usuário Kittanda'}
              </p>
            </div>
          </div>

          {/* Contadores rápidos */}
          <div className="grid grid-cols-2 divide-x divide-neutral-100 border-b border-neutral-100 bg-neutral-50/60 text-center py-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('seguindo')}
              className="cursor-pointer hover:bg-neutral-100/70 py-1 transition-colors"
            >
              <span className="text-sm font-black text-neutral-900 block">
                {followedStores.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Seguindo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favoritos')}
              className="cursor-pointer hover:bg-neutral-100/70 py-1 transition-colors"
            >
              <span className="text-sm font-black text-neutral-900 block">
                {favoriteProducts.length}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Favoritos
              </span>
            </button>
          </div>

          {/* Navegação Vertical */}
          <nav className="p-2 flex flex-col gap-1">
            {ABAS_OFFICE.map((aba) => {
              const isActive = activeTab === aba.id
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setActiveTab(aba.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] text-left transition-colors cursor-pointer text-xs ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-900 font-bold border-l-3 border-[#FB6600]'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
                  }`}
                >
                  <span className="font-mono text-[11px] text-neutral-400 shrink-0">
                    {aba.numero}
                  </span>
                  <span
                    className={`truncate flex-1 ${
                      aba.id === 'feed' ? 'text-[#FB6600] font-bold' : ''
                    }`}
                  >
                    {aba.titulo}
                  </span>
                  {aba.id === 'seguindo' && (
                    <span className="text-[10px] font-mono bg-neutral-200/80 text-neutral-700 px-1.5 py-0.5 rounded">
                      {followedStores.length}
                    </span>
                  )}
                  {aba.id === 'favoritos' && (
                    <span className="text-[10px] font-mono bg-neutral-200/80 text-neutral-700 px-1.5 py-0.5 rounded">
                      {favoriteProducts.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Área Principal da Aba Selecionada */}
        <main className="flex-1 min-w-0 w-full">
          {/* ================================================================= */}
          {/* ABA 01: MEUS DADOS, FOTO, WHATSAPP E ENDEREÇO                     */}
          {/* ================================================================= */}
          {activeTab === 'dados' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white border border-neutral-200 p-6 sm:p-8 rounded-[2px] shadow-sm animate-in fade-in duration-200"
            >
              <div className="border-b border-neutral-100 pb-4 mb-6">
                <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                  Meu Perfil • Tópico 01
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  Meus Dados, Foto, WhatsApp e Endereço
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Mantenha seu perfil atualizado para receber novidades e atendimento rápido das lojas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Foto do Usuário */}
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left border-b md:border-b-0 md:border-r border-neutral-100 pb-6 md:pb-0 md:pr-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2 block">
                    Foto de Perfil
                  </label>

                  <div className="relative w-32 h-32 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-3 bg-neutral-100 border border-neutral-200">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName || 'Foto do Usuário'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black uppercase text-neutral-400">
                        {displayName ? displayName[0] : 'U'}
                      </span>
                    )}
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />

                  <div className="flex flex-col gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px]"
                    >
                      {avatarUrl ? 'Trocar Foto' : 'Enviar Foto'}
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarAdjustSource(avatarUrl)
                          setIsAvatarAdjustOpen(true)
                        }}
                        className="px-3 py-1.5 border border-neutral-300 hover:border-black text-neutral-800 hover:text-black text-[10.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-[2px] bg-neutral-50"
                      >
                        🔍 Ajustar Foto no Círculo
                      </button>
                    )}

                    <span className="text-[10px] text-neutral-400 mt-1">
                      JPEG, PNG ou WebP.
                    </span>
                  </div>
                </div>

                {/* Dados Pessoais e WhatsApp */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ex.: Maria Clara Oliveira"
                      className="w-full border border-neutral-300 px-3.5 py-2 text-sm text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="(67) 99999-9999"
                        className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full border border-neutral-300 px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>
                  </div>

                  {email && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        E-mail da Conta
                      </label>
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-500 rounded-[2px] cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço do Usuário */}
              <div className="border-t border-neutral-200 mt-8 pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                    Meu Endereço
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Informe seu endereço para localizar lojas próximas e facilitar entregas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        CEP {loadingCep && <span className="text-xs text-[#FB6600] animate-pulse">Buscando...</span>}
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={cep}
                        onChange={handleCepChange}
                        placeholder="79000-000"
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                      <span className="text-[10px] text-neutral-400 mt-0.5 block">
                        Auto-preenchimento ViaCEP
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        Rua / Avenida / Logradouro
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ex.: Av. Afonso Pena"
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="123"
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Centro"
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Campo Grande"
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-neutral-700 mb-1">
                        Estado (UF)
                      </label>
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full border border-neutral-300 px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-black rounded-[2px] bg-white font-semibold"
                      >
                        <option value="">UF</option>
                        {[
                          'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
                          'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
                        ].map((uf) => (
                          <option key={uf} value={uf}>
                            {uf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-widest transition-all shadow-sm cursor-pointer disabled:opacity-50 rounded-[2px]"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Dados do Perfil'}
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* ABA 02: FEED QUE SIGO                                             */}
          {/* ================================================================= */}
          {activeTab === 'feed' && (
            <section className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-white border border-neutral-200 p-5 sm:p-6 rounded-[2px] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                      Meu Perfil • Feed Exclusivo
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-tight text-[#FB6600]">
                      Feed que sigo
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Todos os itens postados pelas lojas que você segue aparecem reunidos aqui.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('seguindo')}
                    className="px-3.5 py-2 border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-800 rounded-[2px] cursor-pointer self-start sm:self-auto"
                  >
                    Gerenciar Lojas Seguidas ({followedStores.length})
                  </button>
                </div>

                {/* Filtro rápido por loja seguida */}
                {followedStores.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedStoreFilterInFeed('all')}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[2px] whitespace-nowrap cursor-pointer border transition-colors ${
                        selectedStoreFilterInFeed === 'all'
                          ? 'bg-[#FB6600] text-white border-[#FB6600]'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      Todas que sigo ({followedStores.length})
                    </button>
                    {followedStores.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStoreFilterInFeed(st.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-[2px] whitespace-nowrap cursor-pointer border transition-colors ${
                          selectedStoreFilterInFeed === st.id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {followedStores.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-300 p-10 text-center rounded-[2px]">
                  <span className="text-3xl block mb-2">🏪</span>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase mb-1">
                    Você ainda não está seguindo nenhuma loja
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mb-5">
                    Siga suas lojas favoritas para montar o seu <strong>Feed que sigo</strong> com todas as publicações delas em um único lugar.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('seguindo')}
                    className="px-5 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
                  >
                    Escolher Lojas para Seguir
                  </button>
                </div>
              ) : followedProducts.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-300 p-10 text-center rounded-[2px]">
                  <p className="text-sm font-semibold text-neutral-700 mb-1">
                    Nenhum produto encontrado para o filtro selecionado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {followedProducts.map((prod) => renderProductCard(prod))}
                </div>
              )}
            </section>
          )}

          {/* ================================================================= */}
          {/* ABA 03: SEGUINDO (LOJAS QUE ESTÁ SEGUINDO)                        */}
          {/* ================================================================= */}
          {activeTab === 'seguindo' && (
            <section className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
                <div className="border-b border-neutral-100 pb-4 mb-5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                      Meu Perfil • Tópico 03
                    </span>
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                      Seguindo ({followedStores.length})
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Lojas que você acompanha. Os produtos delas abastecem automaticamente o seu{' '}
                      <strong className="text-[#FB6600]">Feed que sigo</strong>.
                    </p>
                  </div>

                  {followedStores.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('feed')}
                      className="px-4 py-2 bg-[#FB6600] hover:bg-[#e05b00] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer"
                    >
                      Abrir Feed que sigo &rarr;
                    </button>
                  )}
                </div>

                {followedStores.length === 0 ? (
                  <div className="p-8 bg-neutral-50 border border-dashed border-neutral-200 text-center rounded-[2px]">
                    <p className="text-xs text-neutral-600 font-medium">
                      Você ainda não segue nenhuma loja. Clique em <strong>+ Seguir</strong> nas lojas abaixo para começar!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {followedStores.map((loja) => (
                      <div
                        key={loja.id}
                        className="border border-neutral-200 rounded-[2px] p-4 flex items-center justify-between gap-3 bg-white hover:border-neutral-400 transition-colors"
                      >
                        <Link
                          href={`/loja/${loja.slug || loja.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center font-bold text-neutral-700">
                            {loja.logo_url || loja.small_banner_url ? (
                              <img
                                src={loja.logo_url || loja.small_banner_url!}
                                alt={loja.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{loja.name[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-neutral-900 truncate hover:text-[#FB6600]">
                              {loja.name}
                            </h3>
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                              {loja.category}
                            </span>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleFollow(loja.id)}
                          className="px-3 py-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-600 border border-neutral-200 text-[10.5px] font-bold uppercase tracking-wider rounded-[2px] cursor-pointer shrink-0 transition-colors"
                        >
                          Seguindo ✓
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sugestões de lojas para seguir */}
              <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 mb-1">
                  Descobrir Lojas para Seguir
                </h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Siga novas lojas para incluir os produtos delas no seu <strong className="text-[#FB6600]">Feed que sigo</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedStores.map((loja) => (
                    <div
                      key={loja.id}
                      className="border border-neutral-200 rounded-[2px] p-4 flex items-center justify-between gap-3 bg-neutral-50/50 hover:bg-white transition-colors"
                    >
                      <Link
                        href={`/loja/${loja.slug || loja.id}`}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0 flex items-center justify-center font-bold text-neutral-700">
                          {loja.logo_url || loja.small_banner_url ? (
                            <img
                              src={loja.logo_url || loja.small_banner_url!}
                              alt={loja.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{loja.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate hover:text-[#FB6600]">
                            {loja.name}
                          </h4>
                          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">
                            {loja.category}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(loja.id)}
                        className="px-3 py-1.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[10.5px] font-bold uppercase tracking-wider rounded-[2px] cursor-pointer shrink-0 transition-colors"
                      >
                        + Seguir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================= */}
          {/* ABA 04: FAVORITOS                                                 */}
          {/* ================================================================= */}
          {activeTab === 'favoritos' && (
            <section className="space-y-5 animate-in fade-in duration-200">
              <div className="bg-white border border-neutral-200 p-5 sm:p-6 rounded-[2px] shadow-sm">
                <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#FB6600] block">
                  Meu Perfil • Tópico 04
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  Meus Favoritos ({favoriteProducts.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Produtos e ofertas que você salvou para acompanhar de perto.
                </p>
              </div>

              {favoriteProducts.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-300 p-10 text-center rounded-[2px]">
                  <span className="text-3xl block mb-2">❤️</span>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase mb-1">
                    Sua lista de favoritos está vazia
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mb-5">
                    Toque no coração (♥) em qualquer produto da vitrine ou das lojas para guardá-lo aqui no seu Office.
                  </p>
                  <Link
                    href="/?tipo=produtos"
                    className="inline-block px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-[2px]"
                  >
                    Explorar Produtos
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {favoriteProducts.map((prod) => renderProductCard(prod))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Modal de Ajuste Circular da Foto do Usuário */}
      <LogoAdjustModal
        isOpen={isAvatarAdjustOpen}
        imageSrc={avatarAdjustSource}
        onClose={() => setIsAvatarAdjustOpen(false)}
        onApply={handleApplyAvatarAdjust}
      />
    </div>
  )
}
