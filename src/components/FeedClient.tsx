'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import PromotionCard, { PromotionItem } from '@/components/PromotionCard';
import EmptyFeedState from '@/components/EmptyFeedState';
import { createClient } from '@/lib/supabase/client';

export default function FeedClient() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState<any>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // 1. Verificar autenticação
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  // 2. Buscar promoções iniciais
  const loadInitialFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feed?limit=12');
      if (res.status === 401) {
        setUser(null);
        setPromotions([]);
        setHasMore(false);
        return;
      }
      const data = await res.json();
      const items = data.promotions || [];
      setPromotions(items);
      if (items.length < 12) {
        setHasMore(false);
      }
    } catch (e) {
      console.error('Erro ao carregar feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialFeed();
  }, []);

  // 3. Carregamento progressivo (Infinite Scroll)
  const loadMorePromotions = useCallback(async () => {
    if (loadingMore || !hasMore || promotions.length === 0) return;
    setLoadingMore(true);

    try {
      const lastItem = promotions[promotions.length - 1];
      const cursor = lastItem.created_at;
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}&limit=12`);
      const data = await res.json();
      const newItems = data.promotions || [];

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setPromotions((prev) => [...prev, ...newItems]);
        if (newItems.length < 12) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar mais itens do feed:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, promotions]);

  // Observer para o elemento sentinela no final da lista
  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePromotions();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMorePromotions]);

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-[940px] mx-auto px-4">
        {/* Cabeçalho da Seção Feed */}
        <div className="mb-8 border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
              Meu Feed de Ofertas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Novidades e promoções exclusivas das lojas que você segue na Kittanda Outlet
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-black text-white self-start sm:self-auto uppercase tracking-wider">
            Personalizado
          </span>
        </div>

        {/* Estado de Carregamento Inicial */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-gray-200 h-[380px] animate-pulse flex flex-col">
                <div className="h-14 bg-gray-100 border-b border-gray-100" />
                <div className="flex-1 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <EmptyFeedState isAuthenticated={!!user} />
        ) : (
          <>
            {/* Grid de Promoções */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>

            {/* Sentinela de Intersection Observer para Carregamento Contínuo */}
            <div ref={observerRef} className="py-8 flex justify-center items-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Carregando mais novidades...
                </div>
              )}
              {!hasMore && promotions.length > 0 && (
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  Você viu todas as novidades por enquanto
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
