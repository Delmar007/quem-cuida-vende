-- Migração: Sistema de Filtros Combinados, Modalidade (Outlet / Novidades) e Ordenação Estável
-- Kittanda Outlet

-- 1. Garantir que a tabela stores possua todas as colunas necessárias
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
    subscription_status VARCHAR NOT NULL DEFAULT 'active',
    subscription_start_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_renews_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    followers_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Garantir colunas em products (is_outlet, is_novidade, published_at)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    promotional_price NUMERIC,
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'moda',
    subcategory TEXT,
    is_active BOOLEAN DEFAULT true,
    is_outlet BOOLEAN DEFAULT false,
    is_novidade BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas caso a tabela products já existisse sem elas
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_outlet BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_novidade BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Índices de alta performance para filtros combinados e ordenação estável
CREATE INDEX IF NOT EXISTS idx_products_category_subcategory ON public.products(category, subcategory) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_feed_ordering ON public.products(published_at DESC, id DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_modality ON public.products(is_outlet, is_novidade) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stores_alphabetical ON public.stores(lower(name)) WHERE is_active = true;

-- 4. Habilitar RLS e Políticas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de lojas ativas' AND tablename = 'stores') THEN
    CREATE POLICY "Leitura pública de lojas ativas" ON public.stores FOR SELECT USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Leitura pública de produtos ativos' AND tablename = 'products') THEN
    CREATE POLICY "Leitura pública de produtos ativos" ON public.products FOR SELECT USING (is_active = true);
  END IF;
END $$;
