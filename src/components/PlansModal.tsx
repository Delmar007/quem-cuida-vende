'use client'

import React, { useState } from 'react'
import { GENERAL_PLANS, VEHICLE_PLANS, PlanDefinition, PlanId } from '@/lib/plans'

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
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'geral' | 'veiculos'>('all')

  if (!isOpen) return null

  const renderPlanCard = (plan: PlanDefinition) => {
    const isOuro = plan.id === 'ouro'
    const isBronzePlus = plan.id === 'bronze_plus'
    const isPrata = plan.id === 'prata'
    const isAuto50 = plan.id === 'auto_50'
    const isAuto100 = plan.id === 'auto_100'
    const isHighlighted = isOuro || isAuto100

    return (
      <div
        key={plan.id}
        className={`bg-white rounded-[8px] p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative ${
          isHighlighted
            ? 'border-2 border-[#FB6600] shadow-lg'
            : isBronzePlus
            ? 'border-2 border-amber-400'
            : isAuto50
            ? 'border-2 border-slate-700'
            : isPrata
            ? 'border-2 border-gray-300'
            : 'border border-gray-200'
        }`}
      >
        {/* Badge de Destaque superior */}
        {isOuro && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FB6600] text-white text-[10px] font-heading uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            Mais Completo
          </div>
        )}
        {isAuto100 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FB6600] text-white text-[10px] font-heading uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            Concessionária Pro
          </div>
        )}
        {isBronzePlus && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-heading uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            Custo-Benefício
          </div>
        )}
        {isAuto50 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-heading uppercase font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm whitespace-nowrap">
            Loja de Carros
          </div>
        )}

        <div>
          {/* Header do Card */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`font-heading text-xs uppercase font-extrabold tracking-wider ${
                isHighlighted
                  ? 'text-[#FB6600]'
                  : isBronzePlus
                  ? 'text-amber-600'
                  : isAuto50
                  ? 'text-slate-800'
                  : 'text-gray-700'
              }`}
            >
              {plan.name}
            </span>
            {plan.badgeText && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] ${plan.badgeClass}`}>
                {plan.badgeText}
              </span>
            )}
          </div>

          {/* Preço */}
          <div className="mb-3 flex items-baseline gap-1">
            <span className="font-heading text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight tabular-nums">
              {plan.priceFormatted}
            </span>
            <span className="text-xs text-gray-500 font-medium">{plan.period}</span>
          </div>

          {/* Destaque de Limite de Produtos ou Veículos */}
          <div
            className={`p-2.5 rounded-[6px] mb-3 text-center border ${
              isHighlighted
                ? 'bg-orange-50/70 border-orange-200 text-[#FB6600]'
                : isBronzePlus
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : isAuto50
                ? 'bg-slate-50 border-slate-200 text-slate-900'
                : isPrata
                ? 'bg-neutral-100 border-gray-200 text-gray-900'
                : 'bg-gray-50 border-gray-100 text-gray-800'
            }`}
          >
            <span className="font-heading text-xs font-bold block">
              Até {plan.maxActiveProducts} {plan.itemLabel}
            </span>
          </div>

          {/* Diferencial de Banner no Feed */}
          <div className="mb-4 p-2.5 bg-neutral-50 border border-neutral-200 rounded-[6px] text-xs leading-snug text-neutral-800">
            {plan.id === 'bronze' && (
              <span>
                No <strong className="font-bold text-black">Plano Bronze</strong> a loja aparece no feed com{' '}
                <strong className="font-bold text-black">Banner Single</strong>.
              </span>
            )}
            {plan.id === 'bronze_plus' && (
              <span>
                No <strong className="font-bold text-black">Plano Bronze Plus</strong> a loja terá{' '}
                <strong className="font-bold text-black">Banner Duplo</strong> no feed.
              </span>
            )}
            {plan.id === 'prata' && (
              <span>
                No <strong className="font-bold text-black">Plano Prata</strong> a loja terá{' '}
                <strong className="font-bold text-black">Banner Duplo</strong> no feed.
              </span>
            )}
            {plan.id === 'ouro' && (
              <span>
                No <strong className="font-bold text-black">Plano Ouro</strong> a loja terá{' '}
                <strong className="font-bold text-black">Banner Triplo</strong> no feed.
              </span>
            )}
            {plan.id === 'auto_50' && (
              <span>
                Para <strong className="font-bold text-black">Revendas &amp; Multimarcas</strong>: ficha de veículos completa +{' '}
                <strong className="font-bold text-black">Banner Duplo</strong> no feed.
              </span>
            )}
            {plan.id === 'auto_100' && (
              <span>
                Para <strong className="font-bold text-black">Concessionárias</strong>: máxima exposição com{' '}
                <strong className="font-bold text-black">Banner Triplo</strong> na Home e no feed.
              </span>
            )}
          </div>

          {/* Lista de Benefícios */}
          <h4
            className={`font-heading text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
              isHighlighted ? 'text-[#FB6600]' : 'text-gray-500'
            }`}
          >
            Benefícios inclusos:
          </h4>
          <ul className="space-y-2 text-xs text-gray-600 leading-relaxed mb-6">
            {plan.benefits.map((benefit, idx) => {
              const isBannerDifferential =
                benefit.includes('Banner Single') ||
                benefit.includes('Banner Duplo') ||
                benefit.includes('Banner Triplo')

              return (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={`font-bold shrink-0 ${
                      isHighlighted
                        ? 'text-[#FB6600]'
                        : isBronzePlus
                        ? 'text-amber-600'
                        : isAuto50
                        ? 'text-slate-800'
                        : 'text-emerald-600'
                    }`}
                  >
                    {isHighlighted ? '★' : '✓'}
                  </span>
                  <span
                    className={
                      isBannerDifferential
                        ? 'font-bold text-black'
                        : benefit.includes('mais:')
                        ? 'font-semibold text-gray-800'
                        : ''
                    }
                  >
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
          className={`w-full min-h-[44px] py-3 px-4 rounded-[6px] font-heading text-xs font-bold uppercase tracking-widest transition-all cursor-pointer active:scale-[0.98] ${
            isHighlighted
              ? 'bg-[#FB6600] hover:bg-[#e05b00] text-white shadow-md'
              : isBronzePlus
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
              : isAuto50
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
              : isPrata
              ? 'border-2 border-black hover:bg-black hover:text-white text-black'
              : 'bg-black hover:bg-neutral-800 text-white'
          }`}
        >
          {plan.ctaText}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-[2px] p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-[1160px] my-2 sm:my-6 bg-white rounded-[8px] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Topo do Modal com botão Voltar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800 bg-neutral-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors cursor-pointer mr-1 p-1.5 -ml-2 rounded hover:bg-white/10 min-h-[36px]"
              title="Voltar"
              aria-label="Voltar"
            >
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Voltar</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#FB6600] text-white flex items-center justify-center font-bold text-sm shrink-0">
              🏬
            </div>
            <div>
              <h2 className="font-heading text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                Escolha seu Plano • Kittanda Outlet
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-300">
                Planos para lojas em geral e pacotes dedicados para carros e concessionárias
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-white transition-colors p-1.5 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Seletor de Segmento (Todos | Lojas em Geral | Carros & Concessionárias) */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSegmentFilter('all')}
              className={`px-3.5 py-2 rounded-full font-heading text-xs font-bold transition-all cursor-pointer ${
                segmentFilter === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos os Planos (6)
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('geral')}
              className={`px-3.5 py-2 rounded-full font-heading text-xs font-bold transition-all cursor-pointer ${
                segmentFilter === 'geral'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lojas em Geral (4)
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('veiculos')}
              className={`px-3.5 py-2 rounded-full font-heading text-xs font-bold transition-all cursor-pointer ${
                segmentFilter === 'veiculos'
                  ? 'bg-[#FB6600] text-white shadow-xs'
                  : 'bg-orange-50 text-[#FB6600] border border-orange-200 hover:bg-orange-100'
              }`}
            >
              Carros &amp; Concessionárias (2)
            </button>
          </div>
          <span className="text-[11px] text-gray-500 hidden md:inline">
            Sem fidelidade • Ativação segura via Mercado Pago
          </span>
        </div>

        {/* Área Rolável dos Planos */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 bg-gray-50/70 space-y-8">
          {/* Seção 1: Planos para Lojas em Geral */}
          {(segmentFilter === 'all' || segmentFilter === 'geral') && (
            <section>
              <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                <div>
                  <span className="text-[11px] font-heading font-bold uppercase tracking-widest text-[#FB6600]">
                    Varejo &amp; Outlet
                  </span>
                  <h3 className="font-heading text-lg font-extrabold text-gray-900 tracking-tight">
                    Planos para Lojas em Geral
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Ideal para Moda, Casa, Beleza, Pet, Eletro, Agro e Escritório
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                {GENERAL_PLANS.map(renderPlanCard)}
              </div>
            </section>
          )}

          {/* Seção 2: Planos Dedicados para Loja de Carros e Concessionárias */}
          {(segmentFilter === 'all' || segmentFilter === 'veiculos') && (
            <section className="pt-2 border-t border-gray-200">
              <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-1">
                <div>
                  <span className="text-[11px] font-heading font-bold uppercase tracking-widest text-[#FB6600]">
                    Segmento Automotivo Exclusivo
                  </span>
                  <h3 className="font-heading text-lg font-extrabold text-gray-900 tracking-tight">
                    Planos para Lojas de Carros &amp; Concessionárias
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Até 12 fotos por veículo + Ficha técnica completa + FIPE interna privada
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch max-w-4xl">
                {VEHICLE_PLANS.map(renderPlanCard)}
              </div>
            </section>
          )}
        </div>

        {/* Rodapé de Confiança */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 shrink-0">
          <span>
            Pagamento processado com segurança pelo Mercado Pago (Pix, Cartão ou Boleto).
          </span>
          <span className="font-semibold text-gray-700">
            Altere ou faça upgrade de plano quando precisar.
          </span>
        </div>
      </div>
    </div>
  )
}
