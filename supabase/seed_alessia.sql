-- =================================================================
-- SEED: ALESSIA (Namorada) + MOCK USERS
-- Cria usuários fictícios e programa um MATCH com a Alessia
-- =================================================================

BEGIN;

-- 1. Definir IDs fixos para não duplicar
-- Alessia ID:
-- Others:
DO $$
DECLARE
    alessia_id UUID := 'a1e551a1-1111-4444-8888-a1e551a1e551';
    carol_id UUID := 'c2e551a2-2222-4444-8888-c2e551a2e552';
    bea_id UUID := 'b3e551a3-3333-4444-8888-b3e551a3e553';
    jorge_id UUID := '944a2574-756f-4f22-a621-fd7c2f2f1a06'; -- Seu ID
BEGIN

    -- =========================================================
    -- ALESSIA (The One)
    -- =========================================================
    -- 1. Insert Auth (Fake)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
        alessia_id,
        'alessia.verolove@example.com',
        'fake_encrypted_password', 
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Insert Profile
    INSERT INTO public.profiles (id, display_name, bio, profile_type, verification_status, avatar_url, terms_accepted_at)
    VALUES (
        alessia_id,
        'Alessia',
        'A tua namorada favorita. ❤️ Encontrei-te aqui!', 
        'single',
        'verified',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop', -- Foto bonita genérica
        NOW()
    ) ON CONFLICT (id) DO UPDATE 
    SET display_name = 'Alessia',
        bio = 'A tua namorada favorita. ❤️ Encontrei-te aqui!',
        avatar_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop';

    -- 3. PRE-LIKE (O Segredo do Match)
    -- Alessia já curtiu o Jorge.
    INSERT INTO public.profile_interactions (actor_id, target_id, interaction_type)
    VALUES (alessia_id, jorge_id, 'like')
    ON CONFLICT (actor_id, target_id) DO NOTHING;


    -- =========================================================
    -- CAROL (Extra)
    -- =========================================================
    INSERT INTO auth.users (id, email, email_confirmed_at)
    VALUES (carol_id, 'carol@test.com', NOW()) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, display_name, bio, profile_type, avatar_url, terms_accepted_at)
    VALUES (
        carol_id, 'Carol', 'Adoro vinho e viagens.', 'single', 
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- =========================================================
    -- BEA (Extra)
    -- =========================================================
    INSERT INTO auth.users (id, email, email_confirmed_at)
    VALUES (bea_id, 'bea@test.com', NOW()) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, display_name, bio, profile_type, avatar_url, terms_accepted_at)
    VALUES (
        bea_id, 'Bea', 'Procurando novas aventuras.', 'single', 
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;

END $$;

COMMIT;
