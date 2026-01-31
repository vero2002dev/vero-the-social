-- =================================================================
-- STORAGE UPDATE: Make Avatars Public
-- Allow all users to see each other's avatars (essential for Feed)
-- =================================================================

-- 1. Update bucket to Public
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';

-- 2. Add Policy: Anyone (Authenticated) can view any avatar
-- Note: 'public' bucket usually implies public access if RLS allows it.
-- We must ensure RLS allows SELECT for everyone.

DROP POLICY IF EXISTS "Users can read own avatar" ON storage.objects;

CREATE POLICY "Give public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Keep specific insert/update/delete policies from previous migration
-- (Those restricted write access to owner, which is correct)
