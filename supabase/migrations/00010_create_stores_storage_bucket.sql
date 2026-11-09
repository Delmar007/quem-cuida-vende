-- Migração: Criação do Bucket de Imagens para Lojas (Logos e Banners)
-- Kittanda Outlet

-- 1. Criar o bucket 'stores' caso ainda não exista
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'stores',
    'stores',
    true,
    5242880, -- Limite de 5MB por arquivo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Políticas de Acesso ao Storage
DO $$
BEGIN
  -- Leitura pública de fotos do bucket stores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Imagens de lojas públicas para leitura' AND tablename = 'objects') THEN
    CREATE POLICY "Imagens de lojas públicas para leitura"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'stores');
  END IF;

  -- Upload permitido para usuários autenticados
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados enviam imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados enviam imagens"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;

  -- Atualização permitida para usuários autenticados
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados atualizam imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados atualizam imagens"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;

  -- Exclusão de imagens do bucket stores
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lojistas autenticados removem imagens' AND tablename = 'objects') THEN
    CREATE POLICY "Lojistas autenticados removem imagens"
      ON storage.objects FOR DELETE
      USING (bucket_id = 'stores' AND auth.role() = 'authenticated');
  END IF;
END $$;
