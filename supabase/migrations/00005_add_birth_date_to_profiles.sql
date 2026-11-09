/*
  Migration: Adicionar coluna birth_date na tabela profiles
  Permite salvar a data de nascimento do usuário para LGPD e cadastro complementar.
*/
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;
