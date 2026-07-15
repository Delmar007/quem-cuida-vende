-- Adicionar colunas caso nao existam
alter table public.cars add column if not exists estado text;
alter table public.cars add column if not exists combustivel text;
alter table public.cars add column if not exists cambio text;
alter table public.cars add column if not exists tracao text;
alter table public.requests add column if not exists estado text;
alter table public.requests add column if not exists "veiculoTroca" jsonb;

-- Recarregar cache de esquema do Supabase (para evitar erro PGRST204)
NOTIFY pgrst, 'reload schema';
