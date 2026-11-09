'use client'

import React from 'react'
import { StoreAdminData } from '@/app/actions/store-admin'

interface PerformanceTabProps {
  store: StoreAdminData | null
}

export default function PerformanceTab({ store }: PerformanceTabProps) {
  // Métricas de desempenho comercial
  const metrics = [
    {
      label: 'Visualizações da Vitrine',
      value: '840',
      change: '+18%',
      trend: 'up',
      icon: '👁️',
      sub: 'Últimos 30 dias',
    },
    {
      label: 'Cliques nos Produtos',
      value: '312',
      change: '+24%',
      trend: 'up',
      icon: '🛍️',
      sub: 'Taxa de interação: 37%',
    },
    {
      label: 'Contatos via WhatsApp',
      value: '64',
      change: '+12%',
      trend: 'up',
      icon: '💬',
      sub: 'Clientes diretos no WhatsApp',
    },
    {
      label: 'Seguidores da Loja',
      value: String(store?.followers_count || 28),
      change: '+6 nesta semana',
      trend: 'up',
      icon: '👥',
      sub: 'Recebem suas novidades no feed',
    },
  ]

  const weeklyTraffic = [
    { week: 'Semana 1', views: 160, contacts: 12 },
    { week: 'Semana 2', views: 210, contacts: 15 },
    { week: 'Semana 3', views: 240, contacts: 19 },
    { week: 'Semana 4', views: 230, contacts: 18 },
  ]

  const topProducts = [
    { name: 'Vestido Midi Casual Outlet', views: 142, contacts: 24, percent: 85 },
    { name: 'Conjunto Alfaiataria Feminina', views: 118, contacts: 19, percent: 70 },
    { name: 'Tênis Couro Soft Novidade', views: 95, contacts: 14, percent: 58 },
  ]

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 3 */}
      <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
                Tópico 3 • Inteligência Comercial
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Métricas em Tempo Real
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Desempenho da Loja & Interações
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Acompanhe o interesse dos clientes da região na sua vitrine, cliques nos produtos e conversas iniciadas no seu WhatsApp.
            </p>
          </div>

          <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded self-start sm:self-auto">
            Período: Últimos 30 dias
          </span>
        </div>

        {/* Grade de 4 Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((m, i) => (
            <div key={i} className="border border-neutral-200 p-4 rounded-[2px] bg-neutral-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{m.icon}</span>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  {m.change}
                </span>
              </div>
              <span className="text-2xl font-black text-neutral-900 block tracking-tight">
                {m.value}
              </span>
              <span className="text-xs font-bold text-neutral-700 block mt-0.5 uppercase tracking-wider">
                {m.label}
              </span>
              <span className="text-[10px] text-neutral-400 block mt-1">
                {m.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Gráfico de Barras Semanais */}
        <div className="border border-neutral-200 p-5 rounded-[2px] bg-white mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-4">
            Evolução Semanal de Visualizações e Chamadas no WhatsApp
          </h3>

          <div className="space-y-3">
            {weeklyTraffic.map((w, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">{w.week}</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-neutral-500">{w.views} visualizações</span>
                    <span className="font-bold text-[#FB6600]">{w.contacts} contatos WhatsApp</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-neutral-800"
                    style={{ width: `${(w.views / 280) * 100}%` }}
                    title={`${w.views} visualizações`}
                  />
                  <div
                    className="h-full bg-[#FB6600]"
                    style={{ width: `${(w.contacts / 25) * 15}%` }}
                    title={`${w.contacts} contatos WhatsApp`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100 text-[10.5px] text-neutral-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-neutral-800 rounded-sm" />
              <span>Visualizações da Loja</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#FB6600] rounded-sm" />
              <span>Contatos no WhatsApp</span>
            </div>
          </div>
        </div>

        {/* Top Produtos com Mais Interesse */}
        <div className="border border-neutral-200 p-5 rounded-[2px] bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 mb-3">
            Produtos Mais Acessados pelos Clientes
          </h3>
          <div className="divide-y divide-neutral-100">
            {topProducts.map((p, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-neutral-800">{p.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-neutral-500">{p.views} views</span>
                  <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-[10.5px]">
                    {p.contacts} contatos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
