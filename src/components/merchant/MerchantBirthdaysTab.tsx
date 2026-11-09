'use client'

import React, { useState, useEffect } from 'react'
import { getStoreBirthdayFollowersAction, BirthdayFollower } from '@/app/actions/merchant-tools'

interface MerchantBirthdaysTabProps {
  storeId: string
  storeName: string
}

export default function MerchantBirthdaysTab({
  storeId,
  storeName,
}: MerchantBirthdaysTabProps) {
  const [followers, setFollowers] = useState<BirthdayFollower[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  useEffect(() => {
    async function fetchBirthdays() {
      setLoading(true)
      try {
        const res = await getStoreBirthdayFollowersAction(storeId)
        if (res.success) {
          setFollowers(res.followers)
        }
      } catch (err) {
        console.error('Erro ao carregar aniversariantes:', err)
      } finally {
        setLoading(false)
      }
    }
    if (storeId) {
      fetchBirthdays()
    }
  }, [storeId])

  const handleSendWhatsAppGreeting = (follower: BirthdayFollower) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3020'
    const storeLink = `${baseUrl}/loja/${storeId}`
    const text = encodeURIComponent(
      `Olá ${follower.name}! 🎂🎉\n\nA equipe da loja *${storeName}* passa para te desejar um Feliz Aniversário repleto de saúde e conquistas!\n\nPara comemorar com você, liberamos um presente especial: *15% de desconto* na sua próxima compra esta semana com o cupom *NIVERVIP15*.\n\nVenha nos visitar ou confira nossas peças na vitrine: ${storeLink}`
    )
    const phone = follower.phone ? follower.phone.replace(/\D/g, '') : ''
    const waUrl = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(waUrl, '_blank')
  }

  const filtered = followers.filter((f) => {
    if (filter === 'today') return f.isToday
    if (filter === 'week') return f.isThisWeek
    if (filter === 'month') return f.isThisMonth
    return true
  })

  const todayCount = followers.filter((f) => f.isToday).length
  const weekCount = followers.filter((f) => f.isThisWeek).length

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 11 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 11
          </span>
          <span className="text-xs font-bold text-neutral-500">• Fidelização & Relacionamento</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Aniversariantes Seguidores da sua Loja
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Aproxime-se dos seus clientes fiéis com mensagens carinhosas e cupons de presente diretamente no WhatsApp.
        </p>
      </div>

      {/* Destaque para Aniversariantes de Hoje e da Semana */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-[2px] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
              Comemorando Hoje
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {todayCount} aniversariante(s) hoje 🎉
            </span>
            <span className="text-[11px] text-amber-800">
              Momento perfeito para parabenizar e gerar vendas imediatas!
            </span>
          </div>
          <span className="text-3xl">🎂</span>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200 p-5 rounded-[2px] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FB6600] block">
              Aniversários nesta Semana
            </span>
            <span className="text-2xl font-black text-neutral-900 mt-1 block">
              {weekCount} cliente(s) próximos
            </span>
            <span className="text-[11px] text-neutral-600">
              Prepare mimos ou condições exclusivas antecipadamente.
            </span>
          </div>
          <span className="text-3xl">🎁</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-black text-white'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
          }`}
        >
          Todos ({followers.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('today')}
          className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
            filter === 'today'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
          }`}
        >
          🎉 Hoje ({todayCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('week')}
          className={`px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors cursor-pointer ${
            filter === 'week'
              ? 'bg-[#FB6600] text-white'
              : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
          }`}
        >
          Esta Semana ({weekCount})
        </button>
      </div>

      {/* Tabela de Aniversariantes */}
      <div className="bg-white border border-neutral-200 rounded-[2px] overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Lista de Seguidores Aniversariantes
          </h3>
          <span className="text-[11px] text-neutral-500">Mês atual</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Buscando aniversariantes seguidores...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            Nenhum aniversariante encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  f.isToday ? 'bg-amber-50/50' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      f.isToday
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {f.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-neutral-900">{f.name}</h4>
                      {f.isToday && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded">
                          É Hoje! 🎉
                        </span>
                      )}
                      {f.isThisWeek && !f.isToday && (
                        <span className="px-2 py-0.5 bg-[#FB6600] text-white text-[9px] font-black uppercase tracking-wider rounded">
                          Esta Semana
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Aniversário em: <strong className="text-neutral-800">{f.dayAndMonth}</strong>
                      {f.phone ? ` • WhatsApp: ${f.phone}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppGreeting(f)}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>💬 Parabenizar no WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
