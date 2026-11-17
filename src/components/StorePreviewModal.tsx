'use client'

import React, { useState, useEffect } from 'react'
import { getStoreProductsAction } from '@/app/actions/products'
import { getStoreCategoriesAction } from '@/app/actions/categories'
import { StoreCategoryWithSubcategories } from '@/lib/categories-storage'
import StoreProductsCatalog, { ProductItem } from '@/components/store/StoreProductsCatalog'
import PromoThermometerBar from '@/components/PromoThermometerBar'
import { getStorePromoTimerAction } from '@/app/actions/promo-timer'
import { PromoTimerConfig } from '@/lib/promo-timer-storage'

export interface StorePreviewData {
  name: string
  description?: string | null
  category: string
  subcategories: string[]
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  cep?: string | null
  phone?: string | null
  logoPreview?: string | null
  largeBannerPreview?: string | null
  smallBannerPreview?: string | null
  logoUrl?: string | null
  largeBannerUrl?: string | null
  smallBannerUrl?: string | null
  plan?: string
}

interface StorePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  data: StorePreviewData
  storeId?: string
  onNavigateTopic?: (topicId: number) => void
  onOpenLogoAdjust?: () => void
  onOpenLargeBannerAdjust?: () => void
  onOpenSmallBannerAdjust?: () => void
}

function getPlanLabel(plan?: string): string {
  const key = (plan || 'bronze').toLowerCase()
  if (key === 'ouro') return 'Ouro'
  if (key === 'prata') return 'Prata'
  if (key === 'bronze_plus') return 'Bronze Plus'
  if (key === 'auto_50') return 'Loja de Carros'
  if (key === 'auto_100') return 'Concessionária'
  return 'Bronze'
}

export default function StorePreviewModal({
  isOpen,
  onClose,
  data,
  storeId,
  onNavigateTopic,
  onOpenLogoAdjust,
  onOpenLargeBannerAdjust,
  onOpenSmallBannerAdjust,
}: StorePreviewModalProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isMobileDevice, setIsMobileDevice] = useState(false)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [categories, setCategories] = useState<StoreCategoryWithSubcategories[]>([])
  const [promoTimer, setPromoTimer] = useState<PromoTimerConfig | null>(null)
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  // Detectar tamanho da tela do dispositivo e ajustar modo inicial
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setIsMobileDevice(isMobile)
      if (isMobile) {
        setViewMode('mobile')
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fechar com tecla Escape para acessibilidade
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Carregar produtos e categorias reais da loja ao abrir a pré-visualização
  useEffect(() => {
    if (isOpen && storeId) {
      setLoadingCatalog(true)
      Promise.all([
        getStoreProductsAction(storeId),
        getStoreCategoriesAction(storeId),
        getStorePromoTimerAction(storeId),
      ])
        .then(([resProds, resCats, resTimer]) => {
          if (resProds.success && resProds.products) {
            setProducts(resProds.products)
          }
          if (resCats.success && resCats.categories) {
            setCategories(resCats.categories)
          }
          if (resTimer.success && resTimer.timer) {
            setPromoTimer(resTimer.timer)
          }
        })
        .catch(() => {
          // Fallback silencioso
        })
        .finally(() => {
          setLoadingCatalog(false)
        })
    }
  }, [isOpen, storeId])

  if (!isOpen) return null

  const fullAddress = [
    data.street ? `${data.street}, ${data.number || 'S/N'}` : null,
    data.neighborhood,
    data.city && data.state ? `${data.city} - ${data.state}` : data.city,
    data.cep ? `CEP: ${data.cep}` : null,
  ]
    .filter(Boolean)
    .join(' • ')

  const activeBanner = data.largeBannerPreview || data.largeBannerUrl
  const activeLogo = data.logoPreview || data.logoUrl
  const isMobileLayoutActive = viewMode === 'mobile' || isMobileDevice
  const storeSlugPreview = (data.name || 'sua-loja')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const hasQuickActions = Boolean(
    onOpenLogoAdjust || onOpenLargeBannerAdjust || onOpenSmallBannerAdjust || onNavigateTopic
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-[1160px] bg-neutral-100 sm:rounded-[6px] shadow-2xl flex flex-col h-full sm:max-h-[95vh] overflow-hidden border border-neutral-300/80">
        {/* Barra Superior de Controle do Estúdio de Pré-visualização */}
        <header className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 bg-neutral-900 text-white shrink-0 border-b border-neutral-800 gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FB6600]/15 border border-[#FB6600]/40 text-[10px] font-bold uppercase tracking-wider text-[#FB6600] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FB6600] animate-pulse motion-reduce:animate-none" aria-hidden="true" />
              Ao vivo
            </span>
            <div className="min-w-0">
              <h2 id="store-preview-title" className="text-xs sm:text-sm font-bold text-white truncate">
                {data.name || 'Prévia da Loja'}
              </h2>
              <p className="text-[11px] text-neutral-400 hidden sm:block truncate">
                Plano {getPlanLabel(data.plan)} • {products.length}{' '}
                {products.length === 1 ? 'item na vitrine' : 'itens na vitrine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Segmentado Desktop / Celular */}
            {!isMobileDevice && (
              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex items-center bg-neutral-800 rounded-[4px] p-0.5 border border-neutral-700"
              >
                <button
                  type="button"
                  aria-pressed={viewMode === 'desktop'}
                  onClick={() => setViewMode('desktop')}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'desktop'
                      ? 'bg-[#FB6600] text-white shadow-xs'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'mobile'}
                  onClick={() => setViewMode('mobile')}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-[3px] transition-colors flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'mobile'
                      ? 'bg-[#FB6600] text-white shadow-xs'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Celular</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar pré-visualização"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-200 text-neutral-900 text-xs font-bold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer"
            >
              <span>Voltar</span>
            </button>
          </div>
        </header>

        {/* Barra de Edição Rápida (sem emojis, ícones vetoriais consistentes) */}
        {hasQuickActions && (
          <div className="bg-white text-neutral-800 px-3 sm:px-5 py-2 border-b border-neutral-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[10.5px] uppercase font-bold text-neutral-500 tracking-wider shrink-0">
              Edição rápida:
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenLogoAdjust && (
                <button
                  type="button"
                  onClick={onOpenLogoAdjust}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap border border-neutral-200"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#FB6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
                  </svg>
                  <span>Logo</span>
                </button>
              )}

              {onOpenLargeBannerAdjust && (
                <button
                  type="button"
                  onClick={onOpenLargeBannerAdjust}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap border border-neutral-200"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#FB6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5-5 4 4 3-3 6 6" />
                  </svg>
                  <span>Banner Hero</span>
                </button>
              )}

              {onOpenSmallBannerAdjust && (
                <button
                  type="button"
                  onClick={onOpenSmallBannerAdjust}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap border border-neutral-200"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#FB6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <rect x="4" y="6" width="16" height="12" rx="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8m-8 4h5" />
                  </svg>
                  <span>Banner Card</span>
                </button>
              )}

              {onNavigateTopic && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTopic(5)}
                    className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap border border-neutral-200"
                  >
                    <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#FB6600]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>Categorias</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTopic(6)}
                    className="px-2.5 py-1.5 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[11px] font-bold rounded-[4px] transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shadow-2xs"
                  >
                    <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Produtos</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Área de Visualização com Scroll */}
        <div className="flex-1 overflow-y-auto p-0 sm:p-5 md:p-6 flex justify-center items-start bg-neutral-200/80">
          <div
            className={`transition-all duration-300 bg-white overflow-hidden ${
              viewMode === 'desktop'
                ? 'w-full max-w-[960px] border border-neutral-300 sm:rounded-[6px] shadow-xl'
                : isMobileDevice
                ? 'w-full max-w-full rounded-none border-0 shadow-none'
                : 'w-full max-w-[390px] rounded-[30px] border-[8px] border-neutral-900 shadow-2xl my-1 flex flex-col'
            }`}
          >
            {/* Barra de Endereço no Simulador Desktop */}
            {viewMode === 'desktop' && !isMobileDevice && (
              <div className="bg-neutral-100 border-b border-neutral-200 px-3.5 py-2 flex items-center gap-3 select-none">
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 max-w-md mx-auto bg-white border border-neutral-200 rounded-full px-3 py-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                  <svg aria-hidden="true" className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="truncate">kittanda.com.br/{storeSlugPreview}</span>
                </div>
                <div className="w-10 shrink-0" aria-hidden="true" />
              </div>
            )}

            {/* Barra de Status estilo Smartphone (simulador mobile no desktop) */}
            {viewMode === 'mobile' && !isMobileDevice && (
              <div className="bg-neutral-900 text-white text-[10px] px-5 py-1.5 flex items-center justify-between shrink-0 font-medium select-none">
                <span className="tabular-nums">09:41</span>
                <span className="w-16 h-3.5 bg-black rounded-full mx-auto border border-neutral-800" aria-hidden="true" />
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 20h2v-4H2v4zm4 0h2v-7H6v7zm4 0h2v-10h-2v10zm4 0h2V7h-2v13zm4 0h2V4h-2v16z" />
                  </svg>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="2" y="7" width="16" height="10" rx="2" />
                    <path d="M20 10v4" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            )}

            {/* 1. TOPO DA LOJA: HERO BANNER GRANDE */}
            <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] max-h-[360px] bg-neutral-900 overflow-hidden flex items-center justify-center group">
              {activeBanner ? (
                <img
                  src={activeBanner}
                  alt={data.name || 'Banner Grande'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-neutral-400 text-center p-6 select-none">
                  <span className="text-xl sm:text-3xl font-black uppercase text-neutral-300 block tracking-wider">
                    {data.name || 'Nome da Sua Loja'}
                  </span>
                  <span className="text-[10.5px] uppercase tracking-widest text-neutral-400 mt-1 block">
                    Banner Hero • 940 × 370 px
                  </span>
                </div>
              )}

              {/* Atalho contextual para Ajustar Banner */}
              {onOpenLargeBannerAdjust && (
                <button
                  type="button"
                  onClick={onOpenLargeBannerAdjust}
                  className="absolute bottom-2.5 right-2.5 bg-neutral-950/80 hover:bg-[#FB6600] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-[4px] transition-colors inline-flex items-center gap-1.5 shadow-md cursor-pointer backdrop-blur-xs border border-white/15"
                  title="Ajustar zoom e enquadramento deste Banner Grande"
                >
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <span>Ajustar Banner</span>
                </button>
              )}

              {/* Badge Oficial do Plano */}
              {data.plan && data.plan !== 'bronze' && (
                <div className="absolute top-3 right-3 bg-neutral-950/85 backdrop-blur-xs border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[4px] shadow-lg flex items-center gap-1.5">
                  <svg
                    aria-hidden="true"
                    className={`w-3 h-3 ${
                      data.plan === 'ouro' || data.plan === 'auto_100'
                        ? 'text-[#FB6600]'
                        : data.plan === 'bronze_plus'
                        ? 'text-amber-400'
                        : 'text-neutral-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
                  </svg>
                  <span>Loja Oficial {getPlanLabel(data.plan)}</span>
                </div>
              )}
            </div>

            {/* BARRA DO CRONÔMETRO DE PROMOÇÃO & TERMÔMETRO TEMPORAL */}
            <PromoThermometerBar
              storeId={storeId}
              title={promoTimer?.title}
              startDate={promoTimer?.startDate}
              endDate={promoTimer?.endDate}
              isActive={promoTimer ? promoTimer.isActive : true}
              variant="banner"
              showHeart={true}
            />

            {/* 2. VITRINE E MENU VERTICAL DA LOJA */}
            <div className="p-3 sm:p-6 bg-gray-50/70 border-t border-gray-200 flex-1">
              {loadingCatalog ? (
                <div className="space-y-4 py-4" aria-label="Carregando vitrine da loja">
                  <div className="h-5 w-48 bg-neutral-200 rounded animate-pulse" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="border border-neutral-200 rounded-[6px] bg-white p-3 space-y-3">
                        <div className="aspect-[4/3] bg-neutral-200 rounded-[4px] animate-pulse" />
                        <div className="h-3.5 w-3/4 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <StoreProductsCatalog
                  products={products}
                  categories={categories}
                  storeName={data.name || 'Sua Loja'}
                  storePhone={data.phone}
                  storeLogoUrl={activeLogo}
                  storeAddress={fullAddress}
                  storeDescription={data.description}
                  storeCategory={data.category}
                  storeSubcategories={data.subcategories || []}
                  onOpenLogoAdjust={onOpenLogoAdjust}
                  isMobileView={isMobileLayoutActive}
                />
              )}
            </div>
          </div>
        </div>

        {/* Rodapé com Status Rápido da Vitrine */}
        <footer className="px-4 sm:px-5 py-2.5 bg-white border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-neutral-600 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${activeLogo ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
              Logo {activeLogo ? 'ok' : 'pendente'}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${activeBanner ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
              Banner {activeBanner ? 'ok' : 'pendente'}
            </span>
            <span className="inline-flex items-center gap-1 hidden sm:inline-flex">
              <span className={`w-2 h-2 rounded-full ${products.length > 0 ? 'bg-emerald-500' : 'bg-amber-400'}`} aria-hidden="true" />
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-1.5 sm:py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-[4px] transition-colors cursor-pointer shrink-0"
          >
            Fechar Prévia
          </button>
        </footer>
      </div>
    </div>
  )
}
