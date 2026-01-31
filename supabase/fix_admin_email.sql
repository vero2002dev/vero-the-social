-- =================================================================
-- VERO: REPARAÇÃO MANUAL DE CONTA (Admin + Email Confirmado)
-- Rode este script no "SQL Editor" do seu painel Supabase
-- =================================================================

BEGIN;

-- 1. Forçar confirmação do email (Bypassa a necessidade de clicar no link)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'jorge.pinto.correia1@gmail.com';

-- 2. Adicionar como ADMIN
-- Insere na tabela admin_users se ainda não existir
INSERT INTO public.admin_users (user_id, email, granted_by)
SELECT id, email, id -- auto-concedido
FROM auth.users
WHERE email = 'jorge.pinto.correia1@gmail.com'
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- =================================================================
-- Verificão
-- =================================================================
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'jorge.pinto.correia1@gmail.com';
SELECT * FROM public.admin_users WHERE email = 'jorge.pinto.correia1@gmail.com';
