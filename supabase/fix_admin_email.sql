-- =================================================================
-- VERO: REPARAÇÃO TOTAL (Admin + Email + Termos)
-- Rode isto no SQL Editor para desbloquear TUDO da sua conta
-- =================================================================

BEGIN;

-- 1. Confirmar email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = '944a2574-756f-4f22-a621-fd7c2f2f1a06';

-- 2. Aceitar Termos (Novo!)
-- Se o perfil não existir, cria um basico
INSERT INTO public.profiles (id, terms_accepted_at, profile_type)
VALUES ('944a2574-756f-4f22-a621-fd7c2f2f1a06', NOW(), 'single')
ON CONFLICT (id) DO UPDATE 
SET terms_accepted_at = NOW();

-- 3. Virar Admin
INSERT INTO public.admin_users (user_id, email, granted_by)
VALUES ('944a2574-756f-4f22-a621-fd7c2f2f1a06', 'jorge.pinto.correia1@gmail.com', '944a2574-756f-4f22-a621-fd7c2f2f1a06')
ON CONFLICT (email) DO NOTHING;

COMMIT;
