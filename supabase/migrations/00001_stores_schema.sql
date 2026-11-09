-- Migração Fase 3: Estrutura para Perfis Completos e Abertura de Lojas

-- 1. Adicionar data de nascimento no perfil do usuário
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Tabela de Lojas
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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
    category TEXT NOT NULL DEFAULT 'vestuario',
    subcategories TEXT[] DEFAULT '{}',
    large_banner_url TEXT,
    small_banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Lojas
CREATE POLICY "Leitura pública de lojas ativas" ON stores
    FOR SELECT USING (is_active = true);

CREATE POLICY "Lojistas podem criar sua loja" ON stores
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Lojistas podem atualizar sua própria loja" ON stores
    FOR UPDATE USING (auth.uid() = owner_id);

-- Gatilho para atualizar updated_at automaticamente na tabela stores
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
