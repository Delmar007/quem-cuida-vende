'use client'

import React from 'react'
import Link from 'next/link'
import { StoreAdminData } from '@/app/actions/store-admin'

export type MerchantTab = 
  | 'convites'
  | 'produtos'
  | 'desempenho'
  | 'preferidos'
  | 'aniversariantes'
  | 'minha-loja'

interface MerchantSidebarProps {
  activeTab: MerchantTab
  onSelectTab: (tab: MerchantTab) => void
  store: StoreAdminData | null
  activeProductsCount?: number
  maxProductsAllowed?: number
}

export default function MerchantSidebar({
  activeTab,
  onSelectTab,
  store,
  activeProductsCount = 0,
  maxProductsAllowed = 20,
}: MerchantSidebarProps) {
  const menuItems: {
    id: MerchantTab
    label: string
    icon: string
    badge?: string
    badgeColor?: string
    number: string
  }[] = [
    {
      id: 'convites',
      label: 'Fazer Convites',
      icon: '✉️',
      badge: 'Exclusivo',
      badgeColor: 'bg-orange-100 text-[#FB6600]',
      number: '1',
    },
    {
      id: 'produtos',
      label: 'Cadastrar Produtos',
      icon: '📦',
      badge: `${activeProductsCount}/${maxProductsAllowed}`,
      badgeColor: activeProductsCount >= maxProductsAllowed ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700',
      number: '2',
    },
    {
      id: 'desempenho',
      label: 'Ver Desempenhos',
      icon: '📊',
      badge: 'Métricas',
      badgeColor: 'bg-blue-50 text-blue-700',
      number: '3',
    },
    {
      id: 'preferidos',
      label: 'Lista de Preferidos',
      icon: '❤️',
      badge: 'Desejos',
      badgeColor: 'bg-rose-50 text-rose-700',
      number: '4',
    },
    {
      id: 'aniversariantes',
      label: 'Aniversariantes Seguidores',
      icon: '🎂',
      badge: 'Relacionamento',
      badgeColor: 'bg-amber-50 text-amber-700',
      number: '5',
    },
    {
      id: 'minha-loja',
      label: 'Minha Loja & Banners',
      icon: '🏪',
      badge: 'Vitrine',
      badgeColor: 'bg-neutral-100 text-neutral-800',
      number: '⚙️',
    },
  ]

  const planName = store?.effective_plan || store?.plan || 'bronze'
  const isBronze = planName === 'bronze'

  return (
    <aside className="w-full lg:w-[280px] shrink-0 bg-white border border-neutral-200 shadow-sm flex flex-col justify-between">
      {/* Topo do Menu: Identificação da Loja & Plano */}
      <div>
        <div className="p-4 sm:p-5 border-b border-neutral-100 bg-neutral-900 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#FB6600] text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-white/20">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <span>🏬</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold uppercase tracking-wide truncate text-white">
                {store?.name || 'Minha Loja'}
              </h2>
              <span className="text-[10px] text-gray-300 block truncate">
                {store?.city ? `${store.city} - ${store.state || 'MS'}` : 'Kittanda Outlet'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-white">
                {isBronze ? 'Plano Bronze (Grátis)' : `Plano ${planName.toUpperCase()}`}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              Limite: {maxProductsAllowed} produtos
            </span>
          </div>
        </div>

        {/* Lista de Navegação dos 5 Tópicos */}
        <div className="p-2 sm:p-3">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Menu do Lojista
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[2px] text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white font-bold shadow-sm'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <div className="truncate">
                      <span className="text-xs uppercase tracking-wider block truncate">
                        {item.label}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-[2px] shrink-0 ml-2 ${
                        isActive ? 'bg-[#FB6600] text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Rodapé do Menu com Ações Rápidas */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex flex-col gap-2.5">
        {store && (
          <Link
            href={`/loja/${store.id || store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 border border-neutral-300 hover:border-black bg-white text-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 text-center"
          >
            <span>Ver Vitrine Pública</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        )}

        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            &larr; Voltar para a Kittanda Outlet
          </Link>
        </div>
      </div>
    </aside>
  )
}
