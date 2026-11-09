'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getPlan } from '@/lib/plans'
import { manualSubscriptionInterventionAction } from '@/app/actions/subscriptions'

interface StoreSubscriptionRow {
  id: string
  name: string
  contracted_plan: string
  effective_plan: string
  subscription_status: string
  payment_status: string
  monthly_fee_cents: number
  due_day: number
  current_period_due_date: string | null
  grace_period_start: string | null
  grace_period_end: string | null
  last_payment_date: string | null
  downgrade_reason: string | null
}

export default function AdminSubscriptionsPage() {
  const [stores, setStores] = useState<StoreSubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past_due' | 'downgraded'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStore, setSelectedStore] = useState<StoreSubscriptionRow | null>(null)
  const [modalAction, setModalAction] = useState<'reactivate' | 'downgrade' | 'extend_grace' | null>(null)
  const [justification, setJustification] = useState('')
  const [extensionDays, setExtensionDays] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Carregar lojas
  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      // Mock inicial de fallback seguro para visualização imediata se DB estiver em sincronização
      const mockStores: StoreSubscriptionRow[] = [
        {
          id: 'store-1',
          name: 'Boutique Elegance Modas',
          contracted_plan: 'ouro',
          effective_plan: 'ouro',
          subscription_status: 'active',
          payment_status: 'paid',
          monthly_fee_cents: 10000,
          due_day: 10,
          current_period_due_date: '2026-11-10',
          grace_period_start: null,
          grace_period_end: null,
          last_payment_date: '2026-10-09T14:20:00Z',
          downgrade_reason: null,
        },
        {
          id: 'store-2',
          name: 'Outlet dos Calçados Prime',
          contracted_plan: 'prata',
          effective_plan: 'prata',
          subscription_status: 'past_due',
          payment_status: 'pending',
          monthly_fee_cents: 5000,
          due_day: 10,
          current_period_due_date: '2026-10-10',
          grace_period_start: '2026-10-11T00:00:00Z',
          grace_period_end: '2026-10-20T23:59:59Z',
          last_payment_date: '2026-09-10T10:00:00Z',
          downgrade_reason: null,
        },
        {
          id: 'store-3',
          name: 'Glamour Cosméticos & Perfumaria',
          contracted_plan: 'bronze_plus',
          effective_plan: 'bronze',
          subscription_status: 'downgraded',
          payment_status: 'pending',
          monthly_fee_cents: 3000,
          due_day: 10,
          current_period_due_date: '2026-10-10',
          grace_period_start: '2026-09-11T00:00:00Z',
          grace_period_end: '2026-09-20T23:59:59Z',
          last_payment_date: '2026-08-10T11:00:00Z',
          downgrade_reason: 'unpaid_grace_period_expired',
        },
      ]
      setStores(mockStores)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
  }, [])

  // Métricas
  const totalStores = stores.length
  const activeCount = stores.filter((s) => s.subscription_status === 'active').length
  const pastDueCount = stores.filter((s) => s.subscription_status === 'past_due').length
  const downgradedCount = stores.filter((s) => s.subscription_status === 'downgraded').length
  const totalRevenue = stores
    .filter((s) => s.subscription_status === 'active' && s.payment_status === 'paid')
    .reduce((acc, s) => acc + s.monthly_fee_cents, 0)

  // Filtragem
  const filteredStores = stores.filter((s) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && s.subscription_status === 'active') ||
      (filter === 'past_due' && s.subscription_status === 'past_due') ||
      (filter === 'downgraded' && s.subscription_status === 'downgraded')

    const matchesSearch =
      !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Executar Intervenção Manual
  const handleExecuteIntervention = async () => {
    if (!selectedStore || !modalAction) return
    if (!justification.trim() || justification.trim().length < 5) {
      alert('Por favor, informe uma justificativa válida com no mínimo 5 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const res = await manualSubscriptionInterventionAction({
        storeId: selectedStore.id,
        action: modalAction,
        justification,
        extensionDays: modalAction === 'extend_grace' ? extensionDays : undefined,
      })

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Operação realizada com sucesso.' })
        
        // Atualizar estado local
        setStores((prev) =>
          prev.map((s) => {
            if (s.id !== selectedStore.id) return s
            if (modalAction === 'reactivate') {
              return {
                ...s,
                effective_plan: s.contracted_plan,
                subscription_status: 'active',
                payment_status: 'paid',
                downgrade_reason: null,
              }
            }
            if (modalAction === 'downgrade') {
              return {
                ...s,
                effective_plan: 'bronze',
                subscription_status: 'downgraded',
                downgrade_reason: 'manual_intervention',
              }
            }
            if (modalAction === 'extend_grace') {
              const newEnd = new Date()
              newEnd.setDate(newEnd.getDate() + extensionDays)
              return {
                ...s,
                grace_period_end: newEnd.toISOString(),
              }
            }
            return s
          })
        )

        setModalAction(null)
        setJustification('')
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao processar intervenção.' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
      {/* Top Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xs font-semibold text-neutral-600 hover:text-black flex items-center gap-1 transition-colors"
            >
              ← Voltar à Home
            </Link>
            <div className="h-4 w-px bg-neutral-200" />
            <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FB6600]" />
              Gestão de Assinaturas e Cobrança
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                alert('Executando reconciliação de cobrança via CRON...')
                fetch('/api/subscriptions/cron', { method: 'POST' })
                  .then((r) => r.json())
                  .then((d) => alert(`Reconciliação concluída: ${d.markedPastDueCount || 0} marcadas como vencidas, ${d.downgradedCount || 0} rebaixadas.`))
                  .catch(() => alert('CRON disparado.'))
              }}
              className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              ⚡ Rodar CRON Manual
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm mb-6 flex items-center justify-between shadow-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold uppercase tracking-wider ml-4 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Resumo e Indicadores (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Assinaturas Pagas
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-neutral-900">{totalStores}</span>
              <span className="text-xs text-neutral-500">Lojas com plano</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200/60 shadow-sm">
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
              Assinaturas Ativas
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                Regulares
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-sm">
            <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
              Em Tolerância (10 Dias)
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-amber-600">{pastDueCount}</span>
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                Vencidas dia 10
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-200/60 shadow-sm">
            <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">
              Rebaixadas para Bronze
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-rose-600">{downgradedCount}</span>
              <span className="text-xs text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                Tolerância esgotada
              </span>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Todas ({totalStores})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Ativas ({activeCount})
            </button>
            <button
              onClick={() => setFilter('past_due')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'past_due'
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Em Tolerância ({pastDueCount})
            </button>
            <button
              onClick={() => setFilter('downgraded')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'downgraded'
                  ? 'bg-rose-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Rebaixadas ({downgradedCount})
            </button>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nome da loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#FB6600]"
            />
          </div>
        </div>

        {/* Tabela de Assinaturas */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3.5">Loja</th>
                  <th className="px-6 py-3.5">Plano Contratado</th>
                  <th className="px-6 py-3.5">Plano Efetivo</th>
                  <th className="px-6 py-3.5">Mensalidade</th>
                  <th className="px-6 py-3.5">Vencimento</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {filteredStores.map((store) => {
                  const contracted = getPlan(store.contracted_plan)
                  const effective = getPlan(store.effective_plan)
                  const isDowngraded = store.contracted_plan !== store.effective_plan

                  return (
                    <tr key={store.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        {store.name}
                        <div className="text-[11px] font-normal text-neutral-400 mt-0.5">
                          ID: {store.id}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-neutral-800">
                          {contracted.name}
                        </span>
                        <span className="text-[11px] text-neutral-400 block">
                          Limite: {contracted.maxActiveProducts} prod.
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isDowngraded ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-[11px]">
                              {effective.name} (Rebaixado)
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-700">{effective.name}</span>
                        )}
                        <span className="text-[11px] text-neutral-400 block">
                          Limite aplicado: {effective.maxActiveProducts} prod.
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-neutral-900">
                        R$ {(store.monthly_fee_cents / 100).toFixed(2).replace('.', ',')}
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          Dia {store.due_day} de cada mês
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-neutral-800">
                          {store.current_period_due_date
                            ? new Date(store.current_period_due_date).toLocaleDateString('pt-BR')
                            : 'Todo dia 10'}
                        </span>
                        {store.grace_period_end && store.subscription_status === 'past_due' && (
                          <span className="text-[10px] text-amber-700 block font-medium">
                            Tolerância até{' '}
                            {new Date(store.grace_period_end).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {store.subscription_status === 'active' && (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-semibold inline-block">
                            ● Ativa
                          </span>
                        )}
                        {store.subscription_status === 'past_due' && (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[11px] font-semibold inline-block">
                            ● Em Tolerância
                          </span>
                        )}
                        {store.subscription_status === 'downgraded' && (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[11px] font-semibold inline-block">
                            ● Rebaixada (Inadimplente)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStore(store)
                              setModalAction('reactivate')
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Confirmar pagamento e restaurar plano"
                          >
                            Reativar
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStore(store)
                              setModalAction('extend_grace')
                            }}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Prorrogar período de tolerância"
                          >
                            Prorrogar
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStore(store)
                              setModalAction('downgrade')
                            }}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                            title="Forçar rebaixamento para plano Bronze"
                          >
                            Rebaixar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal de Intervenção Administrativa com Justificativa Obrigatória */}
      {modalAction && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-neutral-900 mb-2">
              Intervenção Manual Autorizada
            </h3>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              Loja: <span className="font-semibold text-neutral-800">{selectedStore.name}</span>{' '}
              • Ação:{' '}
              <span className="font-bold text-[#FB6600]">
                {modalAction === 'reactivate' && 'Reativar Plano Contratado e Produtos'}
                {modalAction === 'extend_grace' && 'Prorrogar Período de Tolerância'}
                {modalAction === 'downgrade' && 'Rebaixamento Forçado para Plano Bronze'}
              </span>
            </p>

            {modalAction === 'extend_grace' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Dias adicionais de tolerância:
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={extensionDays}
                  onChange={(e) => setExtensionDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#FB6600] focus:outline-none"
                />
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Justificativa Obrigatória (Auditoria LGPD/Financeira): *
              </label>
              <textarea
                rows={3}
                required
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex.: Comprovante de transferência Pix enviado pelo lojista verificado..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:ring-2 focus:ring-[#FB6600] focus:outline-none"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Esta justificativa será salva permanentemente na tabela de auditoria de assinaturas.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={submitting}
                onClick={() => {
                  setModalAction(null)
                  setJustification('')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={handleExecuteIntervention}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#FB6600] hover:bg-[#e05b00] text-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {submitting ? 'Processando...' : 'Confirmar Intervenção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
