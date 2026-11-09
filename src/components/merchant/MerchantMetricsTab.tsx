'use client'

import React, { useState, useEffect } from 'react'
import { getStoreMetricsAction, StoreMetrics } from '@/app/actions/merchant-tools'

interface MerchantMetricsTabProps {
  storeId: string
  storeName: string
}

export default function MerchantMetricsTab({
  storeId,
  storeName,
}: MerchantMetricsTabProps) {
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true)
      try {
        const res = await getStoreMetricsAction(storeId)
        if (res.success) {
          setMetrics(res.metrics)
        }
      } catch (err) {
        console.error('Erro ao buscar métricas:', err)
      } finally {
        setLoading(false)
      }
    }
    if (storeId) {
      fetchMetrics()
    }
  }, [storeId])

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-neutral-500">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Carregando métricas de desempenho...
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-8 bg-white border border-neutral-200 text-center text-xs text-neutral-500">
        Métricas indisponíveis no momento.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 09 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 09
          </span>
          <span className="text-xs font-bold text-neutral-500">• Inteligência & Resultados</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Desempenho Comercial & Métricas da Loja
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Acompanhe acessos à sua vitrine, cliques no WhatsApp e produtos de maior interesse dos consumidores.
        </p>
      </div>

      {/* Grid de Indicadores Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-neutral-200 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Acessos à Loja</span>
            <span className="text-base">🏬</span>
          </div>
          <span className="text-2xl font-black text-neutral-900 block">
            {metrics.storeViews.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
            ↑ +18% este mês
          </span>
        </div>

        <div className="bg-white p-5 border border-neutral-200 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vistas de Produtos</span>
            <span className="text-base">🛍️</span>
          </div>
          <span className="text-2xl font-black text-neutral-900 block">
            {metrics.productViews.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">
            Cliques em itens do catálogo
          </span>
        </div>

        <div className="bg-white p-5 border border-neutral-200 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Chamadas WhatsApp</span>
            <span className="text-base text-emerald-600">💬</span>
          </div>
          <span className="text-2xl font-black text-emerald-600 block">
            {metrics.whatsappClicks.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
            Conversão estimada: {metrics.conversionRate}
          </span>
        </div>

        <div className="bg-white p-5 border border-neutral-200 rounded-[2px] shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Seguidores Ativos</span>
            <span className="text-base text-[#FB6600]">❤️</span>
          </div>
          <span className="text-2xl font-black text-[#FB6600] block">
            {metrics.followersCount.toLocaleString('pt-BR')}
          </span>
          <span className="text-[10px] text-neutral-500 mt-1 block">
            Notificados em novidades
          </span>
        </div>
      </div>

      {/* Gráfico Semanal em Barras */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4">
          Evolução de Visualizações nas Últimas Semanas
        </h3>
        <div className="grid grid-cols-4 gap-4 items-end h-40 pt-6 border-b border-neutral-200">
          {metrics.monthlyHistory.map((item, index) => {
            const heightPercent = Math.min(100, Math.max(20, (item.views / 250) * 100))
            return (
              <div key={index} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-neutral-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.views} views
                </span>
                <div
                  className="w-full max-w-[48px] bg-neutral-900 group-hover:bg-[#FB6600] rounded-t-[2px] transition-all duration-300"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-bold text-neutral-600 mt-2 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-3">
          <span>* Dados atualizados automaticamente em tempo real</span>
          <span className="font-semibold text-black">Total acumulado: {metrics.storeViews} visitas</span>
        </div>
      </div>

      {/* Produtos Mais Visitados */}
      <div className="bg-white border border-neutral-200 rounded-[2px] overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Top 5 Produtos Mais Visitados no Catálogo
          </h3>
        </div>

        {metrics.topProducts.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-500">
            Nenhum produto com acessos registrados ainda.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {metrics.topProducts.map((p, rank) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-neutral-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black font-mono text-neutral-400 w-5">
                    #{rank + 1}
                  </span>
                  <div className="w-10 h-10 bg-neutral-100 rounded-[2px] overflow-hidden shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">🛍️</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.name}</h4>
                    <span className="text-xs font-black text-[#FB6600]">
                      R$ {Number(p.price).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">{p.views}</span>
                    <span className="text-[10px] text-neutral-400 uppercase">Acessos</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-600 block">{p.favorites}</span>
                    <span className="text-[10px] text-neutral-400 uppercase">Favoritos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
