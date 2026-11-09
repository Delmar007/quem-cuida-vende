-- Tipo enumerado para as permissões (roles)
CREATE TYPE app_role AS ENUM ('consumidor', 'lojista', 'admin');

-- 12.1. profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    preferred_city_id UUID, -- Será relacionado a cities posteriormente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para Profiles
-- Leituras públicas (dependendo da regra de negócio, ou apenas própria leitura)
CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON profiles 
    FOR UPDATE USING (auth.uid() = id);

-- 12.2. user_roles
CREATE TABLE user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'consumidor',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para Roles
-- Usuários podem ler seus próprios papéis
CREATE POLICY "Usuários leem seus papéis" ON user_roles 
    FOR SELECT USING (auth.uid() = user_id);

-- Inserções ou atualizações de papéis não podem ser feitas pelo próprio usuário livremente
-- Isso será gerenciado via Supabase Service Role (backend) para garantir que ninguém vire "admin" sozinho.

-- Gatilho para atualizar a coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Gatilho para criar um profile e user_role inicial ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (new.id, new.email);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'consumidor');
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
