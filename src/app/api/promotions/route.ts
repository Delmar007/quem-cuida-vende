import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PLANS, PlanId } from '@/lib/plans';

/**
 * Limites de produtos e promoções ativas por plano
 */
const PLAN_LIMITS: Record<string, { maxProducts: number; maxPromotions: number }> = {
  bronze: { maxProducts: PLANS.bronze.maxActiveProducts, maxPromotions: PLANS.bronze.maxPromotions },
  bronze_plus: { maxProducts: PLANS.bronze_plus.maxActiveProducts, maxPromotions: PLANS.bronze_plus.maxPromotions },
  prata: { maxProducts: PLANS.prata.maxActiveProducts, maxPromotions: PLANS.prata.maxPromotions },
  ouro: { maxProducts: PLANS.ouro.maxActiveProducts, maxPromotions: PLANS.ouro.maxPromotions },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      storeId,
      productId,
      title,
      description,
      imageUrl,
      priceOriginal,
      pricePromotional,
      startAt,
      endAt,
      type = 'promocao',
    } = body;

    if (!storeId || !title || !pricePromotional) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: loja, título e preço promocional' },
        { status: 400 }
      );
    }

    // 1. Verificar se o usuário é proprietário da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, owner_id, plan, subscription_status')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    if (store.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para publicar por esta loja' },
        { status: 403 }
      );
    }

    // 2. Validar limite de publicações conforme o plano
    const currentPlan = (store.plan || 'bronze').toLowerCase();
    const limits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.bronze;

    const { count, error: countError } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) >= limits.maxPromotions) {
      return NextResponse.json(
        {
          error: `Limite de publicações atingido para o plano ${currentPlan.toUpperCase()} (máximo: ${limits.maxPromotions}). Faça upgrade para publicar mais ofertas!`,
        },
        { status: 403 }
      );
    }

    // 3. Inserir a publicação no banco de dados
    const { data: newPromo, error: insertError } = await supabase
      .from('promotions')
      .insert({
        store_id: storeId,
        product_id: productId || null,
        title,
        description: description || null,
        image_url: imageUrl || null,
        price_original: priceOriginal ? Number(priceOriginal) : null,
        price_promotional: Number(pricePromotional),
        start_at: startAt || null,
        end_at: endAt || null,
        type,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, promotion: newPromo });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
