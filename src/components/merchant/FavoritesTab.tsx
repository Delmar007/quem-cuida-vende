'use client'

import React from 'react'
import { StoreAdminData } from '@/app/actions/store-admin'

interface FavoritesTabProps {
  store: StoreAdminData | null
}

export default function FavoritesTab({ store }: FavoritesTabProps) {
  const favoriteItems = [
    {
      id: 'fav-1',
      name: 'Vestido Midi Casual Outlet',
      category: 'Moda Feminina',
      price: 'R$ 89,90',
      favoritesCount: 42,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'fav-2',
      name: 'Conjunto Alfaiataria Feminina',
      category: 'Moda Feminina',
      price: 'R$ 149,90',
      favoritesCount: 38,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'fav-3',
      name: 'Tênis Couro Soft Novidade',
      category: 'Calçados',
      price: 'R$ 119,90',
      favoritesCount: 29,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'fav-4',
      name: 'Bolsa Estruturada Alça Dupla',
      category: 'Acessórios',
      price: 'R$ 79,90',
      favoritesCount: 21,
      inStock: true,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
    },
  ]

  const totalFavorites = favoriteItems.reduce((acc, item) => acc + item.favoritesCount, 0)

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Tópico 4 */}
      <div className="bg-white border border-neutral-200 p-6 rounded-[2px] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#FB6600] bg-orange-50 px-2 py-0.5 rounded">
                Tópico 4 • Desejo dos Consumidores
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                Lista de Desejos
              </span>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Lista de Preferidos dos Clientes
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Descubra quais produtos da sua loja foram salvos nos favoritos pelos clientes. Use essa informação para planejar descontos e novidades.
            </p>
          </div>

          <div className="text-right shrink-0 bg-orange-50/70 border border-orange-100 p-3 rounded-[2px]">
            <span className="text-2xl font-black text-[#FB6600]">{totalFavorites}</span>
            <span className="text-[10px] text-orange-950 uppercase font-bold block">
              Produtos Favoritados
            </span>
          </div>
        </div>

        {/* Dica de Ação Comercial */}
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-[2px] mb-6 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">
              Dica para Acelerar Vendas
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Itens favoritados têm uma intenção de compra até 5x maior. Quando você ativa um preço promocional de outlet em um item da lista de preferidos, os clientes que salvaram são atraídos imediatamente para concluir o pedido pelo WhatsApp.
            </p>
          </div>
        </div>

        {/* Grade de Produtos Favoritados */}
        <div className="border border-neutral-200 overflow-hidden">
          <div className="bg-neutral-100 p-3 text-[10.5px] font-bold uppercase text-neutral-700 grid grid-cols-12 gap-2">
            <span className="col-span-6 sm:col-span-5">Produto</span>
            <span className="col-span-3 sm:col-span-2">Categoria</span>
            <span className="col-span-3 sm:col-span-2">Preço</span>
            <span className="hidden sm:block sm:col-span-3 text-right">Favoritado por</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {favoriteItems.map((item) => (
              <div key={item.id} className="p-3.5 grid grid-cols-12 gap-2 items-center hover:bg-neutral-50">
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-200 rounded-[2px] overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-900 block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-green-700 font-semibold block">
                      Em estoque
                    </span>
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-2 text-xs text-neutral-600 truncate">
                  {item.category}
                </div>

                <div className="col-span-3 sm:col-span-2 text-xs font-bold text-neutral-900">
                  {item.price}
                </div>

                <div className="col-span-12 sm:col-span-3 flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-neutral-100">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#FB6600]">
                    <span>❤️</span>
                    <span>{item.favoritesCount} clientes</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Oferta relâmpago ativada para "${item.name}"!`)}
                    className="text-[10.5px] uppercase font-bold text-black border border-neutral-300 hover:border-black px-2.5 py-1 rounded-[2px] cursor-pointer"
                  >
                    Ativar Promoção
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
