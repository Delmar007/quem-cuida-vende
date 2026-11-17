import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

function getTodayStartIso(): string {
  // Dia corrente no fuso de Campo Grande (UTC-4) / Brasil
  const now = new Date();
  const local = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00-04:00`).toISOString();
}

/**
 * GET `/api/feed`
 * Returns today's posts (promotions and products) from stores followed by the authenticated user.
 * Resets automatically every new day so the feed only keeps the current day's posts.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
  const todayStartIso = getTodayStartIso();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // 1️⃣ Lojas que o usuário segue
  const { data: follows, error: followsError } = await supabase
    .from('user_follows')
    .select('store_id')
    .eq('user_id', user.id);

  if (followsError) {
    return NextResponse.json({ error: followsError.message }, { status: 500 });
  }

  const storeIds = follows?.map((f: any) => f.store_id) ?? [];
  if (storeIds.length === 0) {
    return NextResponse.json({ promotions: [], followedStores: [], todayStartIso });
  }

  // 2️⃣ Promoções, produtos postados HOJE e dados das lojas seguidas
  const [promoResult, prodResult, storesResult] = await Promise.all([
    supabase
      .from('promotions')
      .select(`id, store_id, title, description, image_url, price_original, price_promotional, start_at, end_at, type, created_at, stores (name, logo_url)`)
      .in('store_id', storeIds)
      .gte('created_at', todayStartIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('products')
      .select(`id, store_id, name, description, image_url, price, promotional_price, promo_type, created_at, stores (name, logo_url)`)
      .in('store_id', storeIds)
      .eq('is_active', true)
      .gte('created_at', todayStartIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('stores')
      .select('*')
      .in('id', storeIds)
      .eq('is_active', true),
  ]);

  if (promoResult.error && prodResult.error) {
    return NextResponse.json({ error: promoResult.error.message }, { status: 500 });
  }

  const mappedPromos = (promoResult.data ?? []).map((p: any) => ({
    ...p,
    source: 'promotion',
  }));

  const mappedProducts = (prodResult.data ?? []).map((prod: any) => ({
    id: `prod-${prod.id}`,
    store_id: prod.store_id,
    title: prod.name,
    description: prod.description || '',
    image_url: prod.image_url || '',
    price_original: typeof prod.price === 'number' ? prod.price : 0,
    price_promotional:
      typeof prod.promotional_price === 'number' && prod.promotional_price > 0
        ? prod.promotional_price
        : typeof prod.price === 'number'
        ? prod.price
        : 0,
    start_at: prod.created_at,
    end_at: prod.created_at,
    type: prod.promo_type || 'novidade',
    created_at: prod.created_at,
    stores: prod.stores,
    source: 'product',
  }));

  const combined = [...mappedPromos, ...mappedProducts]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, limit);

  const followedStores = (storesResult.data ?? []).map((st: any) => ({
    id: st.id,
    name: st.name,
    slug: st.slug || st.id,
    logo_url: st.logo_url || null,
    small_banner_url: st.small_banner_url || null,
    large_banner_url: st.large_banner_url || null,
    reference_point: st.reference_point || st.neighborhood || null,
    raffle_prize_image_url: st.raffle_prize_image_url || st.prize_image_url || null,
    promo_start_date: st.promo_start_date || st.raffle_start_date || null,
    raffle_date: st.raffle_date || st.promo_end_date || null,
    raffle_rules: st.raffle_rules || st.description || null,
  }));

  return NextResponse.json({ promotions: combined, followedStores, todayStartIso });
}
