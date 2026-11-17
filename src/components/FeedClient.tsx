'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PromotionCard, { PromotionItem } from '@/components/PromotionCard';
import EmptyFeedState from '@/components/EmptyFeedState';
import DefaultStoreAvatar from '@/components/DefaultStoreAvatar';
import { createClient } from '@/lib/supabase/client';

interface FollowedStoreFeedCard {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  small_banner_url?: string | null;
  large_banner_url?: string | null;
  reference_point?: string | null;
  raffle_prize_image_url?: string | null;
  promo_start_date?: string | null;
  raffle_date?: string | null;
  raffle_rules?: string | null;
}

function formatDatePtBr(raw?: string | null, fallback = '01/01/2026'): string {
  if (!raw) return fallback;
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function FeedClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'produtos' | 'lojas'>('produtos');
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [followedStores, setFollowedStores] = useState<FollowedStoreFeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // 1. Verificar autenticação e zerar contador diário ao entrar no Feed
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
    try {
      const now = new Date();
      const local = new Date(now.getTime() - 4 * 60 * 60 * 1000);
      const todayKey = local.toISOString().slice(0, 10);
      localStorage.setItem('kittanda_feed_last_seen_date', todayKey);
      localStorage.setItem('kittanda_feed_last_seen_at', now.toISOString());
      window.dispatchEvent(new Event('kittanda:feed-seen'));
    } catch {
      // ignore
    }
  }, []);

  // 2. Buscar todos os produtos/promoções postados hoje e lojas seguidas
  useEffect(() => {
    const loadInitialFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/feed?limit=100');
        if (res.status === 401) {
          setUser(null);
          setPromotions([]);
          setFollowedStores([]);
          return;
        }
        const data = await res.json();
        setPromotions(data.promotions || []);
        setFollowedStores(data.followedStores || []);
      } catch (e) {
        console.error('Erro ao carregar feed:', e);
      } finally {
        setLoading(false);
      }
    };
    loadInitialFeed();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 -mt-6 md:-mt-8 pb-8 pt-[10px]">
      <div className="max-w-[940px] mx-auto px-4">
        {/* Barra fixa logo abaixo da barra de categorias (10px de distância): botão voltar redondo (mobile) + OFERTAS QUE SIGO | LOJAS E PRÊMIOS */}
        <div className="sticky top-[56px] md:top-[47px] z-40 bg-gray-50/95 backdrop-blur-xs pb-2 pt-0 -mx-4 px-4 mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            aria-label="Voltar"
            title="Voltar"
            className="md:hidden w-9 h-9 rounded-full border border-gray-300 bg-white text-neutral-800 hover:border-[#FB6600] hover:text-[#FB6600] flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            role="tablist"
            aria-label="Alternar entre Ofertas que Sigo e Lojas e Prêmios"
            className="flex-1 grid grid-cols-2 border border-gray-300 rounded-[6px] overflow-hidden bg-white shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'produtos'}
              onClick={() => setActiveTab('produtos')}
              className={`py-2.5 px-3 text-[11.5px] sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'produtos'
                  ? 'bg-[#FB6600] text-white'
                  : 'bg-white text-neutral-800 hover:bg-orange-50/60 hover:text-[#FB6600]'
              }`}
            >
              <span>OFERTAS QUE SIGO</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  activeTab === 'produtos'
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {promotions.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'lojas'}
              onClick={() => setActiveTab('lojas')}
              className={`py-2.5 px-3 text-[11.5px] sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 border-l border-gray-200 ${
                activeTab === 'lojas'
                  ? 'bg-[#FB6600] text-white'
                  : 'bg-white text-neutral-800 hover:bg-orange-50/60 hover:text-[#FB6600]'
              }`}
            >
              <span>LOJAS E PRÊMIOS</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  activeTab === 'lojas'
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {followedStores.length}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 h-[360px] animate-pulse rounded-[6px]" />
            ))}
          </div>
        ) : activeTab === 'produtos' ? (
          promotions.length === 0 ? (
            <EmptyFeedState isAuthenticated={!!user} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          )
        ) : followedStores.length === 0 ? (
          <EmptyFeedState isAuthenticated={!!user} />
        ) : (
          /* ABA LOJAS: Cards empilhados (1 em cima do outro): 1/3 mini banner + 2/3 (linha do meio prêmio + linha de baixo dados e regras em MAIÚSCULAS) */
          <div className="flex flex-col gap-6">
            {followedStores.map((store) => {
              const miniBanner = store.small_banner_url || store.large_banner_url;
              const startDateText = formatDatePtBr(store.promo_start_date, '01/01/2026');
              const raffleDateText = formatDatePtBr(store.raffle_date, '02/01/2026');
              const rulesText = (
                store.raffle_rules ||
                'PARTICIPE SEGUINDO A LOJA NA KITTANDA OUTLET E ACOMPANHE AS OFERTAS E REGRAS OFICIAIS DIRETAMENTE COM O LOJISTA.'
              ).toUpperCase();

              return (
                <article
                  key={store.id}
                  className="bg-white border border-gray-200 rounded-[6px] overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* 1/3 SUPERIOR DO CARD: MINI BANNER DA LOJA */}
                  <Link
                    href={`/loja/${store.slug || store.id}`}
                    className="block w-full h-36 sm:h-44 bg-neutral-900 relative overflow-hidden group"
                  >
                    {miniBanner ? (
                      <img
                        src={miniBanner}
                        alt={`Mini banner ${store.name}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white px-4 text-center bg-gradient-to-r from-neutral-900 to-neutral-800">
                        <span className="text-lg sm:text-xl font-black uppercase tracking-wider">
                          {store.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
                          Mini Banner da Loja
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* 2/3 INFERIORES DIVIDIDOS EM 2 LINHAS */}
                  <div className="flex flex-col divide-y divide-gray-200">
                    {/* LINHA DO MEIO: IMAGEM DO PRÊMIO */}
                    <div className="p-3 sm:p-4 bg-neutral-50/70 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FB6600] mb-2">
                        Prêmio da Promoção / Sorteio
                      </span>
                      <div className="w-full h-44 sm:h-52 rounded-[4px] border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                        {store.raffle_prize_image_url ? (
                          <img
                            src={store.raffle_prize_image_url}
                            alt={`Prêmio ${store.name}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-neutral-400 px-4 text-center">
                            <svg
                              aria-hidden="true"
                              className="w-10 h-10 text-[#FB6600]/60 mb-1.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                              />
                            </svg>
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                              Imagem do Prêmio
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LINHA DE BAIXO: LOGO REDONDA, NOME + PONTO DE REFERÊNCIA, DATAS E CAIXA DE REGRAS EM MAIÚSCULAS */}
                    <div className="p-4 bg-white space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <Link
                          href={`/loja/${store.slug || store.id}`}
                          className="flex items-start gap-3 min-w-0 flex-1 group"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                            {store.logo_url ? (
                              <img
                                src={store.logo_url}
                                alt={store.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <DefaultStoreAvatar size="md" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold uppercase text-neutral-900 group-hover:text-[#FB6600] transition-colors leading-tight">
                              {store.name}
                            </h2>
                            {store.reference_point && (
                              <p className="text-xs font-bold uppercase text-[#FB6600] mt-0.5 leading-tight">
                                • {store.reference_point}
                              </p>
                            )}
                          </div>
                        </Link>

                        <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide shrink-0">
                          <div className="bg-neutral-50 border border-gray-200 px-2.5 py-1.5 rounded-[4px]">
                            <span className="text-[9.5px] text-neutral-500 block leading-none">
                              INÍCIO DA PROMOÇÃO
                            </span>
                            <span className="text-neutral-900 tabular-nums">{startDateText}</span>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-[4px]">
                            <span className="text-[9.5px] text-[#FB6600] block leading-none">
                              DATA DO SORTEIO
                            </span>
                            <span className="text-[#FB6600] tabular-nums">{raffleDateText}</span>
                          </div>
                        </div>
                      </div>

                      {/* Caixa com caracteres para texto de regras do sorteio (letras maiúsculas forçadas) */}
                      <div className="border border-gray-200 bg-neutral-50 rounded-[4px] p-3">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-1">
                          REGRAS DO SORTEIO
                        </span>
                        <p className="text-xs font-semibold text-neutral-800 leading-relaxed uppercase">
                          {rulesText}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
