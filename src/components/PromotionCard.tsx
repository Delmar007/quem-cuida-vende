import React from 'react';
import Link from 'next/link';
import { formatCurrencyBRL } from '@/components/store/StoreProductsCatalog';

interface StoreInfo {
  name?: string;
  logo_url?: string;
}

export interface PromotionItem {
  id: string;
  store_id: string;
  product_id?: string | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  price_original?: number | null;
  price_promotional: number;
  start_at?: string | null;
  end_at?: string | null;
  type?: 'promocao' | 'novidade' | 'outlet' | string;
  created_at: string;
  stores?: StoreInfo | null;
}

interface PromotionCardProps {
  promotion: PromotionItem;
}

export default function PromotionCard({ promotion }: PromotionCardProps) {
  const storeName = promotion.stores?.name || 'Loja Parceira';
  const storeLogo = promotion.stores?.logo_url;

  const hasOriginalPrice =
    promotion.price_original && Number(promotion.price_original) > Number(promotion.price_promotional);

  const discountPercent = hasOriginalPrice
    ? Math.round(
        ((Number(promotion.price_original) - Number(promotion.price_promotional)) /
          Number(promotion.price_original)) *
          100
      )
    : null;

  // Formatar data relativa ou amigável
  const dateFormatted = new Date(promotion.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white border border-gray-200 rounded-none shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
      {/* Topo do Card: Loja e Data */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
        <Link
          href={`/loja/${promotion.store_id}`}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500 uppercase">
                {storeName.slice(0, 2)}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#FB6600] transition-colors line-clamp-1">
              {storeName}
            </h4>
            <span className="text-[10px] text-gray-400 block">{dateFormatted}</span>
          </div>
        </Link>

        {promotion.type && (
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-[2px] tracking-wider ${
              promotion.type === 'outlet'
                ? 'bg-black text-white'
                : promotion.type === 'novidade'
                ? 'bg-orange-100 text-[#FB6600]'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {promotion.type}
          </span>
        )}
      </div>

      {/* Imagem do Produto/Promoção */}
      <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden flex items-center justify-center">
        {promotion.image_url ? (
          <img
            src={promotion.image_url}
            alt={promotion.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-300 flex flex-col items-center gap-1">
            <svg className="w-10 h-10 stroke-[1.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Sem foto</span>
          </div>
        )}

        {discountPercent !== null && (
          <div className="absolute top-2 left-2 bg-[#FB6600] text-white text-[11px] font-bold px-2 py-0.5 rounded-[2px] shadow-sm">
            -{discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Conteúdo / Detalhes */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 mb-1">
            {promotion.title}
          </h3>
          {promotion.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {promotion.description}
            </p>
          )}

          {/* Preços */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-base sm:text-lg font-extrabold text-black">
              R$ {formatCurrencyBRL(promotion.price_promotional)}
            </span>
            {hasOriginalPrice && (
              <span className="text-xs text-gray-400 line-through">
                R$ {formatCurrencyBRL(promotion.price_original)}
              </span>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-gray-100">
          <Link
            href={`/loja/${promotion.store_id}`}
            className="w-full sm:flex-1 text-center py-2 px-3 border border-gray-300 text-gray-700 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Visitar Loja
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Olá! Vi a oferta "${promotion.title}" no Kittanda Outlet e gostaria de mais informações.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 text-center py-2 px-3 bg-black hover:bg-[#FB6600] text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
