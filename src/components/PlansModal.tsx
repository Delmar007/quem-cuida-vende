'use client'

import React from 'react'
import { ORDERED_PLANS, PlanId } from '@/lib/plans'

export type PlanType = PlanId

interface PlansModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (plan: PlanType) => void
}

export default function PlansModal({
  isOpen,
  onClose,
  onSelectPlan,
}: PlansModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[1160px] my-6 bg-white rounded-[2px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Topo do Modal com botão Voltar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-black text-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer mr-1 p-1 -ml-2 rounded hover:bg-white/10"
              title="Voltar"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Voltar</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#FB6600] text-white flex items-center justify-center font-bold text-sm">
              🏬
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                Escolha seu Plano • Kittanda Outlet
              </h2>
              <p className="text-[11px] text-gray-300">
                Selecione o plano ideal para a quantidade de produtos da sua loja
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grade de 4 Planos (4 colunas no desktop, 2 no tablet, 1 no mobile) */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {ORDERED_PLANS.map((plan) => {
              const isOuro = plan.id === 'ouro'
              const isBronzePlus = plan.id === 'bronze_plus'
              const isPrata = plan.id === 'prata'

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-[2px] p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative ${
                    isOuro
                      ? 'border-2 border-[#FB6600] shadow-lg transform lg:-translate-y-1'
                      : isBronzePlus
                      ? 'border-2 border-amber-400'
                      : isPrata
                      ? 'border-2 border-gray-300'
                      : 'border border-gray-200'
                  }`}
                >
                  {/* Badge de Destaque superior */}
                  {isOuro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FB6600] text-white text-[9.5px] uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      Mais Completo
                    </div>
                  )}

                  {isBronzePlus && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9.5px] uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                      Custo-Benefício
                    </div>
                  )}

                  <div>
                    {/* Header do Card */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs uppercase font-extrabold tracking-wider ${
                        isOuro ? 'text-[#FB6600]' : isBronzePlus ? 'text-amber-600' : 'text-gray-700'
                      }`}>
                        {plan.name}
                      </span>
                      {plan.badgeText && (
                        <span className={`text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-[2px] ${plan.badgeClass}`}>
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="mb-3">
                      <span className="text-2xl font-black text-gray-900">{plan.priceFormatted}</span>
                      <span className="text-xs text-gray-500 font-medium"> {plan.period}</span>
                    </div>

                    {/* Destaque de Limite de Produtos e Formato de Banner no Feed */}
                    <div className={`p-2.5 rounded-[2px] mb-3 text-center border ${
                      isOuro
                        ? 'bg-orange-50/60 border-orange-100 text-[#FB6600]'
                        : isBronzePlus
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                        : isPrata
                        ? 'bg-neutral-100 border-gray-200 text-gray-900'
                        : 'bg-gray-50 border-gray-100 text-gray-800'
                    }`}>
                      <span className="text-xs font-bold block">
                        Até {plan.maxActiveProducts} produtos ativos
                      </span>
                    </div>

                    {/* Diferencial de Banner no Feed em Negrito */}
                    <div className="mb-4 p-2.5 bg-neutral-50 border border-neutral-200 rounded-[2px] text-[11.5px] leading-snug text-neutral-900">
                      {plan.id === 'bronze' && (
                        <span>
                          No <strong className="font-extrabold text-black">Plano Bronze (Gratuito)</strong> a loja aparecerá no feed com <strong className="font-extrabold text-black">Banner Single</strong>.
                        </span>
                      )}
                      {plan.id === 'bronze_plus' && (
                        <span>
                          No <strong className="font-extrabold text-black">Plano Bronze Plus</strong> a loja terá <strong className="font-extrabold text-black">Banner Duplo</strong> no feed.
                        </span>
                      )}
                      {plan.id === 'prata' && (
                        <span>
                          No <strong className="font-extrabold text-black">Plano Prata</strong> a loja terá <strong className="font-extrabold text-black">Banner Duplo</strong> no feed.
                        </span>
                      )}
                      {plan.id === 'ouro' && (
                        <span>
                          No <strong className="font-extrabold text-black">Plano Ouro</strong> a loja terá <strong className="font-extrabold text-black">Banner Triplo</strong> no feed.
                        </span>
                      )}
                    </div>

                    {/* Lista de Benefícios */}
                    <h4 className={`text-[10.5px] font-bold uppercase tracking-wider mb-2.5 ${
                      isOuro ? 'text-[#FB6600]' : 'text-gray-400'
                    }`}>
                      Benefícios inclusos:
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-600 mb-6">
                      {plan.benefits.map((benefit, idx) => {
                        const isBannerDifferential =
                          benefit.includes('Banner Single') ||
                          benefit.includes('Banner Duplo') ||
                          benefit.includes('Banner Triplo')

                        return (
                          <li key={idx} className="flex items-start gap-2">
                            <span className={`font-bold shrink-0 ${
                              isOuro ? 'text-[#FB6600]' : isBronzePlus ? 'text-amber-600' : 'text-green-600'
                            }`}>
                              {isOuro ? '★' : '✓'}
                            </span>
                            <span className={
                              isBannerDifferential
                                ? 'font-extrabold text-black'
                                : benefit.includes('mais:')
                                ? 'font-semibold text-gray-800'
                                : ''
                            }>
                              {benefit}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Botão de Contratação */}
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-3 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isOuro
                        ? 'bg-[#FB6600] hover:bg-[#e05b00] text-white shadow-md'
                        : isBronzePlus
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        : isPrata
                        ? 'border-2 border-black hover:bg-black hover:text-white text-black'
                        : 'bg-black hover:bg-neutral-800 text-white'
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
