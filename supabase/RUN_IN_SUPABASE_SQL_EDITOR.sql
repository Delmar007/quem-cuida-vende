-- ==============================================================================
-- KITTANDA OUTLET — SCRIPT MESTRE DE BANCO DE DADOS SUPABASE
-- Execute este script completo no SQL Editor do painel Supabase:
-- https://supabase.com/dashboard/project/vooczwqifbbwtspzcdpz/sql
-- ==============================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÃO AUXILIAR PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. AJUSTES NA TABELA profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 4. TABELA DE LOJAS (stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    responsible_name TEXT,
    phone TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    category TEXT NOT NULL DEFAULT 'moda',
    subcategories TEXT[] DEFAULT '{}',
    large_banner_url TEXT,
    small_banner_url TEXT,
    logo_url TEXT,
    description TEXT,
    cnpj_cpf TEXT,
    plan VARCHAR NOT NULL DEFAULT 'bronze',
    contracted_plan VARCHAR NOT NULL DEFAULT 'bronze',
    effective_plan VARCHAR NOT NULL DEFAULT 'bronze',
    monthly_fee_cents INTEGER NOT NULL DEFAULT 0,
    due_day INTEGER NOT NULL DEFAULT 10,
    current_period_due_date DATE,
    last_payment_date TIMESTAMPTZ,
    grace_period_start TIMESTAMPTZ,
    grace_period_end TIMESTAMPTZ,
    downgrade_reason TEXT,
    previous_plan VARCHAR,
    subscription_status VARCHAR NOT NULL DEFAULT 'active',
    payment_status VARCHAR NOT NULL DEFAULT 'paid',
    subscription_start_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_renews_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    followers_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de lojas ativas' AND tablename = 'stores') THEN
    CREATE POLICY "Leitura pública de lojas ativas" ON public.stores
        FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas podem criar sua loja' AND tablename = 'stores') THEN
    CREATE POLICY "Lojistas podem criar sua loja" ON public.stores
        FOR INSERT WITH CHECK (auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas podem atualizar sua própria loja' AND tablename = 'stores') THEN
    CREATE POLICY "Lojistas podem atualizar sua própria loja" ON public.stores
        FOR UPDATE USING (auth.uid() = owner_id);
  END IF;
END $$;

-- Trigger para updated_at em stores
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. TABELA DE PRODUTOS (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    price NUMERIC NOT NULL,
    promotional_price NUMERIC,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    subcategory TEXT,
    is_active BOOLEAN DEFAULT true,
    is_outlet BOOLEAN DEFAULT false,
    is_novidade BOOLEAN DEFAULT false,
    suspended_by_downgrade BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas se a tabela já existir
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT;

-- Ativar RLS em products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de produtos ativos' AND tablename = 'products') THEN
    CREATE POLICY "Leitura pública de produtos ativos" ON public.products
        FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas gerenciam produtos da sua loja' AND tablename = 'products') THEN
    CREATE POLICY "Lojistas gerenciam produtos da sua loja" ON public.products
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = products.store_id 
            AND stores.owner_id = auth.uid()
          )
        );
  END IF;
END $$;

-- 6. TABELA DE PLANOS COMERCIAIS (commercial_plans)
CREATE TABLE IF NOT EXISTS public.commercial_plans (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    price_cents INTEGER NOT NULL,
    max_active_products INTEGER NOT NULL,
    max_promotions INTEGER NOT NULL,
    has_secondary_category_banner BOOLEAN NOT NULL DEFAULT false,
    has_highlight_novidades BOOLEAN NOT NULL DEFAULT false,
    has_main_page_banner BOOLEAN NOT NULL DEFAULT false,
    has_birthday_list BOOLEAN NOT NULL DEFAULT false,
    has_monthly_raffles BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.commercial_plans (
    id, name, price_cents, max_active_products, max_promotions, 
    has_secondary_category_banner, has_highlight_novidades, has_main_page_banner, has_birthday_list, has_monthly_raffles
) VALUES 
    ('bronze', 'Bronze', 0, 20, 5, false, false, false, false, false),
    ('bronze_plus', 'Bronze Plus', 3000, 100, 15, true, true, false, false, false),
    ('prata', 'Prata', 5000, 200, 30, true, true, false, false, false),
    ('ouro', 'Ouro', 10000, 400, 100, true, true, true, true, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    max_active_products = EXCLUDED.max_active_products,
    max_promotions = EXCLUDED.max_promotions,
    has_secondary_category_banner = EXCLUDED.has_secondary_category_banner,
    has_highlight_novidades = EXCLUDED.has_highlight_novidades,
    has_main_page_banner = EXCLUDED.has_main_page_banner,
    has_birthday_list = EXCLUDED.has_birthday_list,
    has_monthly_raffles = EXCLUDED.has_monthly_raffles;

-- 7. TABELAS DE PROMOÇÕES E SEGUIDORES
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuários gerenciam seus follows' AND tablename = 'user_follows') THEN
    CREATE POLICY "Usuários gerenciam seus follows" ON public.user_follows
        FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de follows' AND tablename = 'user_follows') THEN
    CREATE POLICY "Leitura pública de follows" ON public.user_follows
        FOR SELECT USING (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage NUMERIC,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura de promoções ativas' AND tablename = 'promotions') THEN
    CREATE POLICY "Leitura de promoções ativas" ON public.promotions
        FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas gerenciam suas promoções' AND tablename = 'promotions') THEN
    CREATE POLICY "Lojistas gerenciam suas promoções" ON public.promotions
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = promotions.store_id 
            AND stores.owner_id = auth.uid()
          )
        );
  END IF;
END $$;

-- 8. TABELAS FINANCEIRAS E FATURAS
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    plan VARCHAR NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    payment_provider VARCHAR DEFAULT 'manual',
    external_reference VARCHAR,
    payment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    actor_type VARCHAR NOT NULL,
    actor_id UUID,
    action VARCHAR NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR UNIQUE NOT NULL,
    provider VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- 9. CRIAÇÃO DO BUCKET DE IMAGENS DO STORAGE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'stores',
    'stores',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Imagens de lojas públicas para leitura' AND tablename = 'objects') THEN
    CREATE POLICY "Imagens de lojas públicas para leitura"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'stores');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados enviam imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados enviam imagens"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados atualizam imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados atualizam imagens"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados removem imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados removem imagens"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- 10. DISPOSITIVO Nº 6 — CATEGORIAS E SUBCATEGORIAS DE PRODUTOS DA LOJA
CREATE TABLE IF NOT EXISTS public.store_categories (
    id TEXT PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de categorias ativas' AND tablename = 'store_categories') THEN
    CREATE POLICY "Leitura pública de categorias ativas" ON public.store_categories
        FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas gerenciam categorias da sua loja' AND tablename = 'store_categories') THEN
    CREATE POLICY "Lojistas gerenciam categorias da sua loja" ON public.store_categories
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = store_categories.store_id 
            AND stores.owner_id = auth.uid()
          )
        );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.store_subcategories (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.store_categories(id) ON DELETE CASCADE NOT NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_subcategories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de subcategorias ativas' AND tablename = 'store_subcategories') THEN
    CREATE POLICY "Leitura pública de subcategorias ativas" ON public.store_subcategories
        FOR SELECT USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas gerenciam subcategorias da sua loja' AND tablename = 'store_subcategories') THEN
    CREATE POLICY "Lojistas gerenciam subcategorias da sua loja" ON public.store_subcategories
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = store_subcategories.store_id 
            AND stores.owner_id = auth.uid()
          )
        );
  END IF;
END $$;

