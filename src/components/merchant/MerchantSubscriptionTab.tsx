'use client'

import React, { useState, useEffect } from 'react'
import {
  getStoreSubscriptionDetailsAction,
  simulatePaymentReactivationAction,
  StoreSubscriptionDetails,
} from '@/app/actions/merchant-tools'
import { manualSubscriptionInterventionAction } from '@/app/actions/subscriptions'

interface MerchantSubscriptionTabProps {
  storeId: string
  storeName: string
  onOpenPlansModal: () => void
}

export default function MerchantSubscriptionTab({
  storeId,
  storeName,
  onOpenPlansModal,
}: MerchantSubscriptionTabProps) {
  const [details, setDetails] = useState<StoreSubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadSubscription = async () => {
    setLoading(true)
    try {
      const res = await getStoreSubscriptionDetailsAction(storeId)
      if (res.success && res.subscription) {
        setDetails(res.subscription)
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (storeId) {
      loadSubscription()
    }
  }, [storeId])

  const handleSimulatePayment = async () => {
    setActionLoading(true)
    setFeedback(null)
    try {
      const res = await simulatePaymentReactivationAction(storeId)
      if (res.success) {
        setFeedback({ type: 'success', message: res.message })
        loadSubscription()
      } else {
        setFeedback({ type: 'error', message: res.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao processar pagamento.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSimulateDowngrade = async () => {
    const confirmed = window.confirm(
      'Deseja simular o rebaixamento automático por inadimplência após a tolerância de 10 dias? Apenas os 20 produtos mais antigos continuarão ativos e os excedentes serão suspensos com a flag suspended_by_downgrade.'
    )
    if (!confirmed) return

    setActionLoading(true)
    setFeedback(null)
    try {
      const res = await manualSubscriptionInterventionAction({
        storeId,
        action: 'downgrade',
        justification: 'Simulação de rebaixamento automático pós-tolerância (regra dia 10 + 10 dias).',
      })
      if (res.success) {
        setFeedback({
          type: 'success',
          message:
            'Rebaixamento executado com sucesso: loja mantida no plano Bronze com 20 produtos determinísticos e excedentes suspensos.',
        })
        loadSubscription()
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro na simulação.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Falha ao rebaixar.' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-neutral-500">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Carregando detalhes da assinatura e cobrança...
      </div>
    )
  }

  if (!details) {
    return (
      <div className="p-8 bg-white border border-neutral-200 text-center text-xs text-neutral-500">
        Informações da assinatura não encontradas.
      </div>
    )
  }

  const isFreePlan = details.contractedPlan === 'bronze'
  const isPaidAndUpToDate = !isFreePlan && !details.isInGracePeriod && !details.isDowngraded
  const feeFormatted = (details.monthlyFeeCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 12 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 12
          </span>
          <span className="text-xs font-bold text-neutral-500">• Cobrança Recorrente & Monetização</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Gestão de Assinatura, Cobrança e Planos Comerciais
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Regras de ciclo mensal (vencimento dia 10), tolerância de 10 dias corridos e reativação automática.
        </p>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3 text-xs rounded-[2px] flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="font-bold text-sm cursor-pointer">&times;</button>
        </div>
      )}

      {/* Alerta Específico se estiver no Período de Tolerância */}
      {details.isInGracePeriod && (
        <div className="p-5 bg-amber-50 border border-amber-300 rounded-[2px] text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">⏳</span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                Assinatura Vencida • Período de Tolerância em Andamento
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              O vencimento ocorreu no dia 10. Você possui mais <strong>{details.daysRemainingGrace} dias corridos</strong> de
              tolerância para efetuar o pagamento de <strong>{feeFormatted}</strong>. Sua loja continua funcionando
              normalmente com todos os benefícios do plano contratado durante este período.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={actionLoading}
            className="shrink-0 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Processando...' : 'Pagar Mensalidade Agora'}
          </button>
        </div>
      )}

      {/* Alerta se estiver Rebaixado por Inadimplência */}
      {details.isDowngraded && (
        <div className="p-5 bg-rose-50 border border-rose-300 rounded-[2px] text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                Plano Rebaixado para o Gratuito por Inadimplência
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1">
              O período de tolerância encerrou-se sem confirmação de pagamento. Sua loja foi mantida no ar com os{' '}
              <strong>20 produtos prioritários ativos</strong> e os <strong>{details.suspendedProductsCount} excedentes</strong>{' '}
              foram suspensos de forma segura. Ao regularizar o pagamento, o plano contratado e todos os produtos serão
              restaurados de forma imediata e idempotente!
            </p>
          </div>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={actionLoading}
            className="shrink-0 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
          >
            {actionLoading ? 'Restaurando...' : 'Regularizar e Reativar Produtos'}
          </button>
        </div>
      )}

      {/* Cartão de Resumo do Plano Atual */}
      <div className="bg-neutral-900 text-white p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-950/70 px-2 py-0.5 rounded">
                Plano Contratado
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-[11px] font-bold text-neutral-300">
                Plano Aplicado: <strong className="text-white uppercase">{details.effectivePlan}</strong>
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Plano {details.planName}
              </h3>
              <span className="text-base font-bold text-neutral-400">
                {feeFormatted}/mês
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-300 pt-2">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Vencimento Mensal</span>
                <span className="font-bold text-white">Dia 10 de cada mês</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Status Financeiro</span>
                <span className="font-bold text-white capitalize">
                  {details.isDowngraded ? 'Rebaixado' : details.isInGracePeriod ? 'Tolerância (10 dias)' : 'Em Dia'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Limite de Produtos</span>
                <span className="font-bold text-white">
                  {details.currentActiveProducts} de {details.maxAllowedProducts} ativos
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPlansModal}
              className="px-4 py-2.5 bg-[#FB6600] hover:bg-[#e01283] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center"
            >
              Alterar / Upgrade de Plano
            </button>

            {!isFreePlan && (
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-black text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer text-center disabled:opacity-50"
              >
                Confirmar Pagamento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regras Comerciais Transparentes */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3">
          Regras de Cobrança Automática e Tolerância • Kittanda Outlet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-600">
          <div className="p-4 bg-neutral-50 rounded-[2px] border border-neutral-200">
            <span className="text-sm block mb-1">📅</span>
            <strong className="text-neutral-900 block mb-1">1. Vencimento Fixo no Dia 10</strong>
            <p className="leading-relaxed">
              Todas as assinaturas comerciais têm fechamento unificado no dia 10 de cada mês, facilitando o controle
              orçamentário.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-[2px] border border-neutral-200">
            <span className="text-sm block mb-1">🛡️</span>
            <strong className="text-neutral-900 block mb-1">2. Tolerância de 10 Dias Corridos</strong>
            <p className="leading-relaxed">
              Caso haja atraso, sua loja continua no ar com 100% dos benefícios contratados até o dia 20 do mês.
            </p>
          </div>

          <div className="p-4 bg-neutral-50 rounded-[2px] border border-neutral-200">
            <span className="text-sm block mb-1">🔄</span>
            <strong className="text-neutral-900 block mb-1">3. Reativação Sem Perda de Dados</strong>
            <p className="leading-relaxed">
              Nenhum produto é apagado do banco de dados. Ao pagar a fatura, os produtos excedentes voltam a ficar ativos
              automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Simulações para Teste e Verificação */}
      <div className="bg-neutral-50 p-6 border border-dashed border-neutral-300 rounded-[2px]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
          Painel de Verificação & Simulações
        </h4>
        <p className="text-xs text-neutral-500 mb-4">
          Utilize as ações abaixo para testar as transições de estado, tolerância e restauração idempotente de produtos.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSimulateDowngrade}
            disabled={actionLoading}
            className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
          >
            Simular Inadimplência (Downgrade para 20 Produtos)
          </button>

          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={actionLoading}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-[2px] cursor-pointer disabled:opacity-50"
          >
            Simular Webhook de Pagamento (Reativação Automática)
          </button>
        </div>
      </div>

      {/* Histórico de Faturas */}
      <div className="bg-white border border-neutral-200 rounded-[2px] overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Histórico Recente de Cobranças
          </h3>
          <span className="text-[11px] text-neutral-500">Últimos lançamentos</span>
        </div>

        <div className="divide-y divide-neutral-100">
          {details.invoices.map((inv) => (
            <div key={inv.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">
                  Mensalidade • Vencimento em {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Referência: #{inv.id}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-neutral-900">
                  {(inv.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded ${
                    inv.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : inv.status === 'overdue'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inv.status === 'paid' ? 'Pago' : inv.status === 'overdue' ? 'Vencido' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
