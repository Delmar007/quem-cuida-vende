-- Migração: Adição do Novo Plano Comercial Bronze Plus (R$ 30,00/mês - 100 produtos ativos)
-- Kittanda Outlet

-- 1. Tabela descritiva de Planos Comerciais (referência e regras de negócio)
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

-- Inserir / Atualizar os 4 planos comerciais da Kittanda Outlet
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

-- 2. Atualizar ou adicionar constraint de planos válidos na tabela stores
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_store_plan') THEN
    ALTER TABLE public.stores DROP CONSTRAINT check_store_plan;
  END IF;
  
  ALTER TABLE public.stores
  ADD CONSTRAINT check_store_plan 
  CHECK (lower(plan) IN ('bronze', 'bronze_plus', 'prata', 'ouro'));
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback silencioso caso a tabela stores não possua a coluna plan ainda
    NULL;
END $$;
