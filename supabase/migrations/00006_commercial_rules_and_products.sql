/*
  Migration: Adicionar colunas comerciais, fiscais e de assinatura na tabela stores
  - plan: bronze, prata, ouro
  - subscription_status: pending, active, overdue, canceled
  - subscription_start_at: início da assinatura
  - subscription_renews_at: data de renovação mensal
  - logo_url: logotipo comercial
  - description: descrição da loja
  - cnpj_cpf: identificação fiscal
  - followers_count: contador de seguidores
*/

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS plan VARCHAR NOT NULL DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_start_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS subscription_renews_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT,
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- Constraint para status de assinatura válidos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_subscription_status') THEN
    ALTER TABLE public.stores
    ADD CONSTRAINT check_subscription_status 
    CHECK (subscription_status IN ('pending', 'active', 'overdue', 'canceled'));
  END IF;
END $$;

-- Tabela de Produtos (caso ainda não exista no schema inicial)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    promotional_price NUMERIC,
    image_url TEXT,
    category TEXT,
    subcategory TEXT,
    is_active BOOLEAN DEFAULT true,
    is_outlet BOOLEAN DEFAULT false,
    is_novidade BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS em products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública de produtos ativos" ON public.products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Lojistas gerenciam produtos da sua loja" ON public.products
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = products.store_id 
        AND stores.owner_id = auth.uid()
      )
    );
