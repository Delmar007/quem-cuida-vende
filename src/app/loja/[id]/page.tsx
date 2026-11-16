import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FollowButton from '@/components/FollowButton';
import { SubscriptionNotice } from '@/components/SubscriptionNotice';
import { getLocalStoreById } from '@/lib/stores-storage';
import { getLocalProducts } from '@/lib/products-storage';
import { getStoreCategoriesAction } from '@/app/actions/categories';
import { getStorePromoTimerServer } from '@/lib/promo-timer-storage';
import PromoThermometerBar from '@/components/PromoThermometerBar';
import StoreProductsCatalog, { formatCurrencyBRL } from '@/components/store/StoreProductsCatalog';
import { SEED_STORES } from '@/lib/demo-stores';
import { toStoreSlug } from '@/lib/store-slug';
import { connection } from 'next/server';

export const instant = false;

const CATEGORY_MAP: Record<string, string> = {
  moda: 'Moda',
  pet: 'Pet',
  agro: 'Agro',
  carro: 'Carro',
  escritorio: 'Escritório',
  eletro: 'Eletro',
  casa: 'Casa',
  beleza: 'Beleza',
}

function formatCategorySubcategory(category?: string | null, subcategory?: string | null): string {
  if (!subcategory) return ''
  const catKey = (category || '').toLowerCase()
  const catLabel = CATEGORY_MAP[catKey] || (category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : '')
  return catLabel ? `${catLabel}/${subcategory}` : subcategory
}

interface StorePageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ produto?: string; p?: string }>;
}

function toAbsoluteOgImageUrl(rawUrl?: string | null): string | null {
  const val = (rawUrl || '').trim();
  if (!val || val.startsWith('data:')) return null;
  if (/^https?:\/\//i.test(val)) return val;
  if (val.startsWith('/')) return `https://www.kittanda.com.br${val}`;
  return null;
}

async function findStoreByParam(rawParam: string): Promise<any | null> {
  const id = decodeURIComponent(rawParam);
  const hyphenVariant = id.replace(/_/g, '-');
  const underscoreVariant = id.replace(/-/g, '_');
  const supabase = await createClient();

  let store: any = null;
  try {
    const slugCandidates = Array.from(new Set([id, hyphenVariant, underscoreVariant]));
    const orFilters = [
      `id.eq.${id}`,
      ...slugCandidates.map((s) => `slug.eq.${s}`),
    ].join(',');
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .or(orFilters)
      .limit(1)
      .maybeSingle();
    if (storeData) {
      store = storeData;
    }

    if (!store) {
      const { data: allStores } = await supabase.from('stores').select('*');
      if (allStores && allStores.length > 0) {
        const targetNorm = toStoreSlug(id);
        store =
          allStores.find(
            (s: any) => s.slug === id || toStoreSlug(s.name || '') === targetNorm
          ) || null;
      }
    }
  } catch {
    // fallback local
  }

  if (!store) {
    store =
      getLocalStoreById(id) ||
      getLocalStoreById(hyphenVariant) ||
      getLocalStoreById(underscoreVariant);
  }

  if (!store) {
    const targetNorm = toStoreSlug(id);
    const seed = SEED_STORES.find(
      (s) =>
        s.id === id ||
        s.slug === id ||
        s.slug === hyphenVariant ||
        toStoreSlug(s.name) === targetNorm
    );
    if (seed) store = seed;
  }

  return store;
}

export async function generateMetadata({
  params,
  searchParams,
}: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const resolvedQuery = searchParams ? await searchParams : {};
  const targetProductId = (resolvedQuery.produto || resolvedQuery.p || '').trim();

  const store = await findStoreByParam(id);
  if (!store) {
    return {
      title: 'Loja não encontrada | Kittanda Outlet',
    };
  }

  const locationTag = store.reference_point || store.neighborhood || store.city || '';
  const storeBannerImg =
    toAbsoluteOgImageUrl(store.large_banner_url) ||
    toAbsoluteOgImageUrl(store.small_banner_url) ||
    toAbsoluteOgImageUrl(store.logo_url) ||
    'https://www.kittanda.com.br/logo-kittanda-laranja.png';

  if (targetProductId) {
    let targetProd: any = null;
    try {
      const supabase = await createClient();
      const { data: dbProd } = await supabase
        .from('products')
        .select('*')
        .eq('id', targetProductId)
        .maybeSingle();
      if (dbProd) targetProd = dbProd;
    } catch {
      // fallback local
    }
    if (!targetProd) {
      targetProd =
        getLocalProducts(store.id).find((p) => p.id === targetProductId) || null;
    }

    if (targetProd) {
      const hasPromo = Boolean(
        typeof targetProd.promotional_price === 'number' &&
          targetProd.promotional_price > 0 &&
          targetProd.promotional_price < targetProd.price
      );
      const effectivePrice = hasPromo
        ? targetProd.promotional_price
        : targetProd.price;
      const priceText = formatCurrencyBRL(effectivePrice);
      const prodImage =
        toAbsoluteOgImageUrl(targetProd.images?.[0] || targetProd.image_url) ||
        storeBannerImg;
      const ogTitle = `${targetProd.name} — R$ ${priceText} | ${store.name}`;
      const ogDescription = `${store.name}${locationTag ? ` • ${locationTag}` : ''} — Confira a disponibilidade pelo WhatsApp na Kittanda Outlet.`;

      return {
        title: ogTitle,
        description: ogDescription,
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          type: 'website',
          locale: 'pt_BR',
          siteName: 'Kittanda Outlet',
          images: [{ url: prodImage, width: 1200, height: 630, alt: targetProd.name }],
        },
        twitter: {
          card: 'summary_large_image',
          title: ogTitle,
          description: ogDescription,
          images: [prodImage],
        },
      };
    }
  }

  const storeTitle = `${store.name}${locationTag ? ` • ${locationTag}` : ''} | Catálogo Oficial Kittanda`;
  const storeDescription =
    store.description ||
    `Confira o estoque e ofertas de ${store.name} na Kittanda Outlet e reserve pelo WhatsApp.`;

  return {
    title: storeTitle,
    description: storeDescription,
    openGraph: {
      title: storeTitle,
      description: storeDescription,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Kittanda Outlet',
      images: [{ url: storeBannerImg, width: 1200, height: 630, alt: store.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: storeTitle,
      description: storeDescription,
      images: [storeBannerImg],
    },
  };
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  await connection();
  const { id: rawParam } = await params;
  const id = decodeURIComponent(rawParam);
  const hyphenVariant = id.replace(/_/g, '-');
  const underscoreVariant = id.replace(/-/g, '_');
  const supabase = await createClient();

  // Buscar loja pelo ID ou pelo Slug no Supabase (aceitando _ ou -)
  let store: any = null;
  try {
    const slugCandidates = Array.from(new Set([id, hyphenVariant, underscoreVariant]));
    const orFilters = [
      `id.eq.${id}`,
      ...slugCandidates.map((s) => `slug.eq.${s}`),
    ].join(',');
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .or(orFilters)
      .limit(1)
      .maybeSingle();
    if (storeData) {
      store = storeData;
    }

    // Fallback: se ainda não achou pelo slug, tenta corresponder pelo nome convertido em slug
    if (!store) {
      const { data: allStores } = await supabase
        .from('stores')
        .select('*');
      if (allStores && allStores.length > 0) {
        const targetNorm = toStoreSlug(id);
        store =
          allStores.find(
            (s: any) =>
              s.slug === id ||
              toStoreSlug(s.name || '') === targetNorm
          ) || null;
      }
    }
  } catch (err: any) {
    console.warn('Supabase store detail query exception:', err.message);
  }

  // Fallback para storage local caso a tabela ou loja não esteja no Supabase
  if (!store) {
    store =
      getLocalStoreById(id) ||
      getLocalStoreById(hyphenVariant) ||
      getLocalStoreById(underscoreVariant);
  }

  // Fallback para lojas de demonstração (seed)
  if (!store) {
    const targetNorm = toStoreSlug(id);
    const seed = SEED_STORES.find(
      (s) =>
        s.id === id ||
        s.slug === id ||
        s.slug === hyphenVariant ||
        toStoreSlug(s.name) === targetNorm
    );
    if (seed) {
      store = seed;
    }
  }

  if (!store) {
    notFound();
  }

  // Buscar produtos da loja (Supabase + Local fallback)
  let products: any[] = [];
  try {
    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (prods) products = prods;
  } catch (err: any) {
    // tabela products pode não existir ainda
  }

  const localProds = getLocalProducts(store.id).filter((p) => p.is_active);
  for (const lp of localProds) {
    if (!products.some((p) => p.id === lp.id)) {
      products.push(lp);
    }
  }

  // Buscar categorias da loja para o menu de navegação e filtros
  const { categories: storeCategories } = await getStoreCategoriesAction(store.id);

  // Buscar cronômetro de promoção (termômetro temporal) da loja
  const promoTimer = await getStorePromoTimerServer(store.id);

  // Buscar ofertas/promoções da loja
  let promotions: any[] = [];
  try {
    const { data: promos } = await supabase
      .from('promotions')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false });
    if (promos) promotions = promos;
  } catch (err: any) {
    // tabela promotions pode não existir ainda
  }

  const fullAddress = [
    store.street ? `${store.street}, ${store.number || 'S/N'}` : null,
    store.neighborhood,
    store.city && store.state ? `${store.city} - ${store.state}` : store.city,
    store.cep ? `CEP: ${store.cep}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const whatsappMessage = encodeURIComponent(
    `Olá! Encontrei sua loja "${store.name}" na Kittanda Outlet e gostaria de mais informações.`
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = Boolean(user && store.owner_id === user.id);

  return (
    <div className="min-h-screen pb-16">
      {isOwner && (
        <SubscriptionNotice
          contractedPlan={store.contracted_plan || store.plan}
          effectivePlan={store.effective_plan || store.plan}
          subscriptionStatus={store.subscription_status}
          paymentStatus={store.payment_status}
          gracePeriodEnd={store.grace_period_end}
          currentPeriodDueDate={store.current_period_due_date}
          monthlyFeeCents={store.monthly_fee_cents}
          storeId={store.id}
        />
      )}

      {/* Banner de Destaque da Loja */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[21/7] max-h-[360px] bg-neutral-900 overflow-hidden flex items-center justify-center">
        {store.large_banner_url ? (
          <img
            src={store.large_banner_url}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-500 text-center p-6">
            <span className="text-3xl font-black uppercase text-gray-400 block tracking-wider">
              {store.name}
            </span>
            <span className="text-xs uppercase tracking-widest text-gray-500">
              Kittanda Outlet
            </span>
          </div>
        )}

        {/* Badge do Plano */}
        {store.plan && store.plan !== 'bronze' && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-[2px] border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-[2px] shadow-lg flex items-center gap-1.5">
            <span className={store.plan === 'ouro' || store.plan === 'auto_100' ? 'text-[#FB6600]' : store.plan === 'bronze_plus' ? 'text-amber-400' : 'text-gray-300'}>★</span>
            <span>
              Loja Oficial{' '}
              {store.plan === 'bronze_plus'
                ? 'Bronze Plus'
                : store.plan === 'auto_50'
                ? 'Loja de Carros'
                : store.plan === 'auto_100'
                ? 'Concessionária'
                : store.plan}
            </span>
          </div>
        )}
      </div>

      {/* Termômetro Temporal de Promoção abaixo do Banner */}
      <PromoThermometerBar
        title={promoTimer?.title || 'Outlet'}
        startDate={promoTimer?.startDate}
        endDate={promoTimer?.endDate}
        isActive={promoTimer ? promoTimer.isActive : true}
        variant="banner"
      />

      {/* Menu e Vitrine de Produtos da Loja */}
      <div className="mt-6">
        <StoreProductsCatalog
          storeId={store.id}
          storeSlug={store.slug}
          promoTimer={promoTimer}
          products={products}
          categories={storeCategories}
          storeName={store.name}
          storePhone={store.phone}
          storeInstagramUrl={store.instagram_url}
          storeLogoUrl={store.logo_url}
          storeAddress={fullAddress}
          storeDescription={store.description}
          storeCategory={store.category}
          storeSubcategories={store.subcategories || []}
        />
      </div>
    </div>
  );
}
