import React from 'react';
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
}

export default async function StoreDetailPage({ params }: StorePageProps) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();

  // Buscar loja pelo ID ou pelo Slug no Supabase
  let store: any = null;
  try {
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();
    if (storeData) {
      store = storeData;
    }
  } catch (err: any) {
    console.warn('Supabase store detail query exception:', err.message);
  }

  // Fallback para storage local caso a tabela ou loja não esteja no Supabase
  if (!store) {
    store = getLocalStoreById(id);
  }

  // Fallback para lojas de demonstração (seed)
  if (!store) {
    const seed = SEED_STORES.find((s) => s.id === id || s.slug === id);
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

        {/* Badge do Plano (Ouro / Prata / Bronze Plus) */}
        {store.plan && store.plan !== 'bronze' && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-[2px] border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-[2px] shadow-lg flex items-center gap-1.5">
            <span className={store.plan === 'ouro' ? 'text-[#FB6600]' : store.plan === 'bronze_plus' ? 'text-amber-400' : 'text-gray-300'}>★</span>
            <span>Loja Oficial {store.plan === 'bronze_plus' ? 'Bronze Plus' : store.plan}</span>
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
