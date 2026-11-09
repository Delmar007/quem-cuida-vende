'use client'

import React from 'react'
import { getPlan, PlanId } from '@/lib/plans'

interface SubscriptionNoticeProps {
  contractedPlan?: string
  effectivePlan?: string
  subscriptionStatus?: string
  paymentStatus?: string
  gracePeriodEnd?: string | null
  currentPeriodDueDate?: string | null
  monthlyFeeCents?: number
  storeId?: string
  onPayClick?: () => void
}

export function SubscriptionNotice({
  contractedPlan = 'bronze',
  effectivePlan = 'bronze',
  subscriptionStatus = 'active',
  gracePeriodEnd,
  currentPeriodDueDate,
  monthlyFeeCents,
  onPayClick,
}: SubscriptionNoticeProps) {
  // Se estiver ativo e regular ou for plano gratuito, não precisa exibir aviso
  if (contractedPlan === 'bronze' || (subscriptionStatus === 'active' && effectivePlan === contractedPlan)) {
    return null
  }

  const planConfig = getPlan(contractedPlan)
  const feeFormatted = monthlyFeeCents ? `R$ ${(monthlyFeeCents / 100).toFixed(2).replace('.', ',')}` : planConfig.priceFormatted

  // CENÁRIO 1: Em período de tolerância (vencido no dia 10, aguardando pagamento até dia 20)
  if (subscriptionStatus === 'past_due') {
    const formattedEnd = gracePeriodEnd
      ? new Date(gracePeriodEnd).toLocaleDateString('pt-BR')
      : 'o término da tolerância'

    return (
      <div className="w-full bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm mb-6 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl select-none" role="img" aria-label="Aviso">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Mensalidade Pendente • Período de Tolerância
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                A mensalidade de <span className="font-semibold">{feeFormatted}</span> do seu{' '}
                <span className="font-semibold">{planConfig.name}</span> venceu no dia 10. Você tem tolerância de 10 dias (até {formattedEnd}) com todos os seus benefícios e catálogo ativos. Regularize agora para manter sua visibilidade.
              </p>
            </div>
          </div>
          <button
            onClick={onPayClick || (() => alert(`Iniciando pagamento da mensalidade de ${feeFormatted} do plano ${planConfig.name}...`))}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-medium text-xs rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            Pagar Mensalidade ({feeFormatted})
          </button>
        </div>
      </div>
    )
  }

  // CENÁRIO 2: Rebaixado para o plano gratuito (tolerância expirada)
  if (subscriptionStatus === 'downgraded' || effectivePlan === 'bronze') {
    return (
      <div className="w-full bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm mb-6 transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl select-none" role="img" aria-label="Alerta">🚨</span>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Plano Temporariamente Rebaixado para Bronze (Gratuito)
              </h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                O período de tolerância encerrou e o seu plano foi rebaixado para o Bronze gratuito. Seus produtos excedentes (acima de 20) foram <span className="font-semibold">suspensos temporariamente</span>, mas <span className="font-semibold underline">não foram apagados</span>. Ao regularizar o pagamento, seu plano e produtos serão reativados imediatamente.
              </p>
            </div>
          </div>
          <button
            onClick={onPayClick || (() => alert(`Regularizando assinatura do plano ${planConfig.name} (${feeFormatted})...`))}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#FB6600] hover:bg-[#e05b00] active:scale-95 text-white font-medium text-xs rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            Regularizar e Reativar Loja
          </button>
        </div>
      </div>
    )
  }

  return null
}
