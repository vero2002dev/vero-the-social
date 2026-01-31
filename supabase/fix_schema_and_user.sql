-- =================================================================
-- VERO: REPARAÇÃO FINAL (Bypass Total de Erros)
-- Este script conserta a tabela antes de inserir.
-- =================================================================

BEGIN;

-- 1. [PROFILES] Garante 'profile_type'
DO $$ BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type') THEN 
        CREATE TYPE profile_type AS ENUM ('single', 'couple'); 
    END IF; 
END $$;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type profile_type DEFAULT 'single';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. [ADMIN_USERS] Garante colunas 'email' e 'granted_by'
-- (Se a tabela não existir, cria. Se existir sem coluna, adiciona.)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='email') THEN
        ALTER TABLE public.admin_users ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='granted_by') THEN
        ALTER TABLE public.admin_users ADD COLUMN granted_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. [DATA] Conserta Usuário e Admin
-- Perfis
INSERT INTO public.profiles (id, terms_accepted_at, profile_type)
VALUES ('944a2574-756f-4f22-a621-fd7c2f2f1a06', NOW(), 'single')
ON CONFLICT (id) DO UPDATE 
SET terms_accepted_at = NOW(),
    profile_type = 'single';

-- Autenticação
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = '944a2574-756f-4f22-a621-fd7c2f2f1a06';

-- Admin (Upsert blindado)
INSERT INTO public.admin_users (user_id, email)
VALUES ('944a2574-756f-4f22-a621-fd7c2f2f1a06', 'jorge.pinto.correia1@gmail.com')
ON CONFLICT (user_id) DO UPDATE 
SET email = EXCLUDED.email; -- Se já existe, atualiza o email

-- 4. [FUNCTIONS] Garante is_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
