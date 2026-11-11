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

const CATEGORY_MAP: Record<string, string> = {
  moda: 'Moda',
  pet: 'Pet',
  agro: 'Agro',
  carro: 'Carro',
  escritorio: 'Escritório',
  eletro: 'Eletro',
  casa: 'Casa',
  beleza: 'Beleza',
}

function formatCategorySubcategory(category?: string | null, subcategory?: string | null): string {
  if (!subcategory) return ''
  const catKey = (category || '').toLowerCase()
  const catLabel = CATEGORY_MAP[catKey] || (category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : '')
  return catLabel ? `${catLabel}/${subcategory}` : subcategory
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

  const cleanPhone = (data.phone || '').replace(/\D/g, '')
  const activeBanner = data.largeBannerPreview || data.largeBannerUrl
  const activeLogo = data.logoPreview || data.logoUrl
  const isMobileLayoutActive = viewMode === 'mobile' || isMobileDevice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-[1120px] bg-neutral-100 sm:rounded-[2px] shadow-2xl flex flex-col h-full sm:max-h-[96vh] overflow-hidden border border-neutral-300">
        
        {/* Barra Superior de Controle do Modo Pré-visualização */}
        <div className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-2.5 bg-neutral-900 text-white shrink-0 border-b border-neutral-800 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FB6600] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FB6600] animate-pulse" />
              Pré-visualização
            </span>
            <span className="text-neutral-500 text-xs hidden md:inline">|</span>
            <span className="text-[11px] text-neutral-300 hidden md:inline">
              Vitrine pública como o cliente vê no celular ou computador
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Desktop / Celular */}
            <div className="flex items-center bg-neutral-800 rounded p-0.5 border border-neutral-700">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'desktop'
                    ? 'bg-[#FB6600] text-white font-bold'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title="Visualização Computador"
              >
                <span>🖥️</span>
                <span className="text-[11px]">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-[#FB6600] text-white font-bold'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title="Visualização Celular"
              >
                <span>📱</span>
                <span className="text-[11px]">Celular</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Barra de Ações Rápidas de Ajuste Direto no Celular */}
        <div className="bg-neutral-950 text-white px-3 sm:px-6 py-2 border-b border-neutral-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] uppercase font-black text-[#FB6600] tracking-wider flex items-center gap-1">
              <span>⚙️</span>
              <span>Ajustar no Celular:</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenLogoAdjust && (
              <button
                type="button"
                onClick={onOpenLogoAdjust}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10.5px] font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap border border-neutral-700"
                title="Ajustar zoom e enquadramento do Logotipo"
              >
                <span>⭕</span>
                <span>Logo</span>
              </button>
            )}

            {onOpenLargeBannerAdjust && (
              <button
                type="button"
                onClick={onOpenLargeBannerAdjust}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10.5px] font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap border border-neutral-700"
                title="Ajustar movimentação e zoom do Banner Hero"
              >
                <span>🖼️</span>
                <span>Banner Hero</span>
              </button>
            )}

            {onOpenSmallBannerAdjust && (
              <button
                type="button"
                onClick={onOpenSmallBannerAdjust}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10.5px] font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap border border-neutral-700"
                title="Ajustar Banner Pequeno do Card de Loja"
              >
                <span>🪪</span>
                <span>Banner Card</span>
              </button>
            )}

            {onNavigateTopic && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateTopic(5)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[10.5px] font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap border border-neutral-700"
                  title="Gerenciar Categorias"
                >
                  <span>🏷️</span>
                  <span>Categorias</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTopic(6)}
                  className="px-2.5 py-1 bg-[#FB6600] hover:bg-[#e05b00] text-white text-[10.5px] font-bold rounded-[2px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap"
                  title="Cadastrar / Editar Produtos"
                >
                  <span>➕</span>
                  <span>Produtos</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Área de Visualização com Scroll */}
        <div className="flex-1 overflow-y-auto p-0 sm:p-4 md:p-6 flex justify-center bg-neutral-200/70">
          <div
            className={`transition-all duration-300 bg-white shadow-xl overflow-hidden ${
              viewMode === 'desktop'
                ? 'w-full max-w-[980px] border border-neutral-300 sm:rounded-[2px]'
                : isMobileDevice
                ? 'w-full max-w-full rounded-none border-0 shadow-none'
                : 'w-full max-w-[390px] rounded-3xl border-8 border-neutral-800 shadow-2xl my-2 flex flex-col'
            }`}
          >
            {/* Barra de Status estilo Celular (exibida apenas no simulador desktop em modo mobile) */}
            {viewMode === 'mobile' && !isMobileDevice && (
              <div className="bg-neutral-800 text-white text-[10px] px-5 py-1 flex items-center justify-between shrink-0 font-mono select-none">
                <span>12:00</span>
                <span className="w-16 h-3 bg-neutral-900 rounded-full mx-auto" />
                <span className="flex items-center gap-1 text-[9px]">
                  <span>📶</span>
                  <span>🔋</span>
                </span>
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
                <div className="text-gray-400 text-center p-6 select-none">
                  <span className="text-2xl sm:text-3xl font-black uppercase text-gray-300 block tracking-wider">
                    {data.name || 'Nome da Sua Loja'}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-400">
                    Banner Grande • 940 × 370 px
                  </span>
                </div>
              )}

              {/* Botão de Atalho para Ajustar Banner diretamente na prévia */}
              {onOpenLargeBannerAdjust && (
                <button
                  type="button"
                  onClick={onOpenLargeBannerAdjust}
                  className="absolute bottom-2.5 right-2.5 bg-black/85 hover:bg-[#FB6600] text-white text-[9.5px] font-bold uppercase tracking-wider px-2 py-1 rounded-[2px] transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                  title="Ajustar zoom e enquadramento deste Banner Grande"
                >
                  <span>🔍</span>
                  <span>Ajustar Banner</span>
                </button>
              )}

              {/* Badge Oficial do Plano */}
              {data.plan && data.plan !== 'bronze' && (
                <div className="absolute top-3 right-3 bg-black/85 backdrop-blur-[2px] border border-white/20 text-white text-[9.5px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-[2px] shadow-lg flex items-center gap-1.5">
                  <span className={data.plan === 'ouro' || data.plan === 'auto_100' ? 'text-[#FB6600]' : data.plan === 'bronze_plus' ? 'text-amber-400' : 'text-gray-300'}>★</span>
                  <span>
                    Loja Oficial{' '}
                    {data.plan === 'bronze_plus'
                      ? 'Bronze Plus'
                      : data.plan === 'auto_50'
                      ? 'Loja de Carros'
                      : data.plan === 'auto_100'
                      ? 'Concessionária'
                      : data.plan}
                  </span>
                </div>
              )}
            </div>

            {/* BARRA DO CRONÔMETRO DE PROMOÇÃO & TERMÔMETRO TEMPORAL ABAIXO DO BANNER */}
            <PromoThermometerBar
              storeId={storeId}
              title={promoTimer?.title}
              startDate={promoTimer?.startDate}
              endDate={promoTimer?.endDate}
              isActive={promoTimer ? promoTimer.isActive : true}
              variant="banner"
              showHeart={true}
            />

            {/* 2. VITRINE E MENU VERTICAL DA LOJA (RESPONSIVA PARA DESKTOP E CELULAR) */}
            <div className="p-3 sm:p-6 bg-gray-50/70 border-t border-gray-200 flex-1">
              {loadingCatalog ? (
                <div className="py-16 text-center text-xs text-gray-500">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Carregando vitrine da loja...
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

        {/* Rodapé do Modal */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-neutral-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            Você está visualizando a vitrine exatamente como o cliente verá.
          </span>
          <span className="text-[11px] text-neutral-500 sm:hidden">
            Vitrine do cliente
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-1.5 sm:py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Fechar Prévia
          </button>
        </div>

      </div>
    </div>
  )
}
