-- Migração: Sistema de Assinaturas, Cobrança Recorrente, Período de Tolerância e Rebaixamento Automático
-- Kittanda Outlet

-- 1. Separar e expandir colunas de controle financeiro na tabela stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS contracted_plan VARCHAR NOT NULL DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS effective_plan VARCHAR NOT NULL DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS monthly_fee_cents INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_day INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS current_period_due_date DATE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS downgrade_reason TEXT,
ADD COLUMN IF NOT EXISTS previous_plan VARCHAR,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR NOT NULL DEFAULT 'paid';

-- Sincronizar contracted_plan e effective_plan com o plano atual existente
UPDATE public.stores 
SET contracted_plan = plan, 
    effective_plan = plan 
WHERE contracted_plan IS NULL OR contracted_plan = 'bronze';

-- 2. Adicionar flag em products para indicar suspensão por rebaixamento financeiro
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS suspended_by_downgrade BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_suspension 
ON public.products(store_id, suspended_by_downgrade, is_active);

-- 3. Tabela de Faturas / Cobranças (subscription_invoices)
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    amount_cents INTEGER NOT NULL,
    plan VARCHAR NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending', -- pending, paid, past_due, canceled
    paid_at TIMESTAMPTZ,
    payment_provider VARCHAR DEFAULT 'manual', -- stripe, asaas, mercadopago, manual
    external_reference VARCHAR,
    payment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_store_status ON public.subscription_invoices(store_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.subscription_invoices(due_date);

-- 4. Tabela de Auditoria Financeira e Assinaturas (subscription_audit_logs)
CREATE TABLE IF NOT EXISTS public.subscription_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    actor_type VARCHAR NOT NULL, -- system_cron, webhook, admin_user, merchant
    actor_id UUID,
    action VARCHAR NOT NULL, -- marked_past_due, downgraded_to_free, reactivated_after_payment, plan_changed, manual_intervention, canceled
    previous_state JSONB,
    new_state JSONB,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_audit_store ON public.subscription_audit_logs(store_id, created_at DESC);

-- 5. Tabela de Idempotência de Webhooks (processed_webhook_events)
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR UNIQUE NOT NULL,
    provider VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    payload JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event ON public.processed_webhook_events(event_id);

-- 6. RLS e Políticas de Segurança
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Lojista pode ver as faturas da sua própria loja
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas visualizam faturas da sua loja' AND tablename = 'subscription_invoices') THEN
    CREATE POLICY "Lojistas visualizam faturas da sua loja" ON public.subscription_invoices
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.stores 
          WHERE stores.id = subscription_invoices.store_id 
          AND stores.owner_id = auth.uid()
        )
      );
  END IF;

  -- Administradores têm acesso total às faturas e logs de auditoria
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins gerenciam faturas' AND tablename = 'subscription_invoices') THEN
    CREATE POLICY "Admins gerenciam faturas" ON public.subscription_invoices
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role IN ('admin', 'master_admin')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins visualizam logs de auditoria' AND tablename = 'subscription_audit_logs') THEN
    CREATE POLICY "Admins visualizam logs de auditoria" ON public.subscription_audit_logs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_roles.user_id = auth.uid() 
          AND user_roles.role IN ('admin', 'master_admin')
        )
      );
  END IF;
END $$;
