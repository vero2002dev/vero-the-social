-- =================================================================
-- SEED: STRESS TEST (POPULATION)
-- Generates 50 fake users to test Explore Feed & Performance
-- =================================================================

BEGIN;

DO $$
DECLARE
    i INT;
    new_id UUID;
    random_name TEXT;
    random_bio TEXT;
    random_avatar TEXT;
    random_type profile_type;
    is_verified_status verification_status;
BEGIN
    FOR i IN 1..50 LOOP
        new_id := uuid_generate_v4();
        
        -- Generate random data
        IF (random() < 0.5) THEN
            random_name := 'User ' || i;
            random_type := 'single';
            random_avatar := 'https://i.pravatar.cc/500?u=' || new_id; -- Consistent random avatar
        ELSE
            random_name := 'Couple ' || i;
            random_type := 'couple';
            random_avatar := 'https://images.unsplash.com/photo-1542596768-5d1d21f1cfb6?q=80&w=500&auto=format&fit=crop'; -- Generic couple
        END IF;

        IF (random() < 0.8) THEN
             is_verified_status := 'verified';
        ELSE
             is_verified_status := 'unverified';
        END IF;

        random_bio := 'This is a generated bio for stress testing. I love privacy and exclusive events. #' || i;

        -- 1. Insert Auth
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            new_id,
            'user' || i || '@test.com',
            'fake_pass', 
            NOW(),
            '{"provider":"email"}',
            '{}',
            NOW(),
            NOW()
        );

        -- 2. Insert Profile
        INSERT INTO public.profiles (id, display_name, couple_name, bio, profile_type, verification_status, avatar_url, terms_accepted_at)
        VALUES (
            new_id,
            CASE WHEN random_type = 'single' THEN random_name ELSE NULL END,
            CASE WHEN random_type = 'couple' THEN random_name ELSE NULL END,
            random_bio,
            random_type,
            is_verified_status,
            random_avatar,
            NOW()
        );

        -- 3. INTERACTION SIMULATION (Random Likes to Jorge)
        -- Jorge ID from seed_alessia.sql: 944a2574-756f-4f22-a621-fd7c2f2f1a06
        IF (random() < 0.3) THEN -- 30% chance to like Jorge
             INSERT INTO public.profile_interactions (actor_id, target_id, interaction_type)
             VALUES (new_id, '944a2574-756f-4f22-a621-fd7c2f2f1a06', 'like')
             ON CONFLICT (actor_id, target_id) DO NOTHING;
        END IF;

    END LOOP;
END $$;

COMMIT;
