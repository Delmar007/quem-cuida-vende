'use client'

import React, { useState, useEffect } from 'react'
import { getStoreFavoritesAction, FavoriteProductItem } from '@/app/actions/merchant-tools'

interface MerchantFavoritesTabProps {
  storeId: string
  storeName: string
}

export default function MerchantFavoritesTab({
  storeId,
  storeName,
}: MerchantFavoritesTabProps) {
  const [favorites, setFavorites] = useState<FavoriteProductItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true)
      try {
        const res = await getStoreFavoritesAction(storeId)
        if (res.success) {
          setFavorites(res.favorites)
        }
      } catch (err) {
        console.error('Erro ao buscar favoritos:', err)
      } finally {
        setLoading(false)
      }
    }
    if (storeId) {
      loadFavorites()
    }
  }, [storeId])

  const totalFavoritesCount = favorites.reduce((sum, item) => sum + item.favoritesCount, 0)

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 10 */}
      <div className="bg-white p-6 border border-neutral-200 rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-black uppercase text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
            Tópico 10
          </span>
          <span className="text-xs font-bold text-neutral-500">• Desejo do Consumidor</span>
        </div>
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
          Lista de Produtos Preferidos pelos Clientes
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Descubra quais peças e produtos da sua loja foram marcados como favoritos pelo público na plataforma.
        </p>
      </div>

      {/* Card de Resumo de Favoritos */}
      <div className="bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-200 p-5 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB6600] block">
            Índice de Interesse dos Compradores
          </span>
          <h3 className="text-lg font-black text-neutral-900 mt-0.5">
            {totalFavoritesCount} corações recebidos na vitrine
          </h3>
          <p className="text-xs text-neutral-600 mt-1">
            Itens com alta pontuação de favoritos têm 3 vezes mais chances de fechar venda no WhatsApp quando colocados em oferta relâmpago.
          </p>
        </div>

        <div className="shrink-0 bg-white px-4 py-2.5 rounded-[2px] border border-orange-200 shadow-xs text-center">
          <span className="text-xl block">❤️</span>
          <span className="text-xs font-black text-neutral-900">{favorites.length} produtos</span>
          <span className="text-[10px] text-neutral-400 block uppercase">Com Favoritos</span>
        </div>
      </div>

      {/* Lista dos Produtos Favoritados */}
      <div className="bg-white border border-neutral-200 rounded-[2px] overflow-hidden shadow-sm">
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Ranking de Preferidos da sua Loja
          </h3>
          <span className="text-[11px] text-neutral-500">Ordenado por interesse</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Carregando lista de preferidos...
          </div>
        ) : favorites.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            <span className="text-3xl block mb-2">🤍</span>
            Nenhum produto foi favoritado ainda pelos clientes. Cadastre novidades atrativas para conquistar corações!
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {favorites.map((p, index) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-orange-50 text-[#FB6600] flex items-center justify-center font-bold text-xs font-mono shrink-0">
                    #{index + 1}
                  </div>
                  <div className="w-12 h-12 bg-neutral-100 rounded-[2px] overflow-hidden shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">🛍️</div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      {p.category}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.name}</h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      {p.promotionalPrice ? (
                        <>
                          <span className="text-xs font-black text-[#FB6600]">
                            R$ {Number(p.promotionalPrice).toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through">
                            R$ {Number(p.price).toFixed(2).replace('.', ',')}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-black text-neutral-900">
                          R$ {Number(p.price).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-[2px] border border-rose-200">
                    <span className="text-rose-600 text-sm">❤️</span>
                    <span className="text-xs font-black text-rose-900">
                      {p.favoritesCount} <span className="font-medium text-[11px] text-rose-700">favoritos</span>
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {p.isActive ? 'Ativo na Vitrine' : 'Pausado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
