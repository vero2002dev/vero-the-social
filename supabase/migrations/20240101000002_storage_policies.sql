-- =====================================================
-- VERO - Supabase Storage Policies
-- =====================================================
-- Creates buckets and policies for file storage
-- Run order: 3/4
-- NOTE: Run these in Supabase Dashboard or via SQL + Storage API

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Bucket: avatars (private with signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket: gallery (private with signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket: verifications (private, admin-only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES: avatars
-- =====================================================

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own avatar
CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar (if not locked)
CREATE POLICY "Users can update own avatar if not locked"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND avatar_locked = TRUE
  )
);

-- Users can delete their own avatar (if not locked)
CREATE POLICY "Users can delete own avatar if not locked"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND avatar_locked = TRUE
  )
);

-- Admins can read all avatars
CREATE POLICY "Admins can read all avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND is_admin()
);

-- =====================================================
-- STORAGE POLICIES: gallery
-- =====================================================

-- Users can upload to their own gallery folder
CREATE POLICY "Users can upload to own gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own gallery
CREATE POLICY "Users can read own gallery"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete from their own gallery
CREATE POLICY "Users can delete from own gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all gallery photos
CREATE POLICY "Admins can read all gallery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'gallery'
  AND is_admin()
);

-- Admins can delete gallery photos
CREATE POLICY "Admins can delete gallery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery'
  AND is_admin()
);

-- =====================================================
-- STORAGE POLICIES: verifications
-- =====================================================

-- Users can upload their verification files
CREATE POLICY "Users can upload verification files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own verification files
CREATE POLICY "Users can read own verification files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all verification files
CREATE POLICY "Admins can read all verification files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications'
  AND is_admin()
);

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Get signed URL for private files (server-side only)
-- This is called from API routes using service role key

CREATE OR REPLACE FUNCTION get_signed_url_for_user(
  bucket_name TEXT,
  file_path TEXT,
  requester_id UUID
)
RETURNS TEXT AS $$
DECLARE
  owner_id TEXT;
  is_admin_user BOOLEAN;
BEGIN
  -- Extract owner from path (format: {user_id}/filename)
  owner_id := split_part(file_path, '/', 1);
  
  -- Check if requester is admin
  is_admin_user := EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = requester_id
  );
  
  -- Verify access
  IF owner_id != requester_id::text AND NOT is_admin_user THEN
    -- For gallery, check if photo is approved and user is verified
    IF bucket_name = 'gallery' THEN
      IF NOT EXISTS (
        SELECT 1 FROM gallery_photos gp
        JOIN profiles p ON p.id = owner_id::uuid
        WHERE gp.url LIKE '%' || file_path
        AND gp.status = 'approved'
        AND p.verification_status = 'verified'
        AND is_verified(requester_id)
      ) THEN
        RAISE EXCEPTION 'Access denied';
      END IF;
    ELSE
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;
  
  -- Return the path (actual signed URL generation happens in app via service role)
  RETURN file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can upload own avatar" ON storage.objects
IS 'Users can upload files to their own avatar folder';

COMMENT ON POLICY "Admins can read all avatars" ON storage.objects
IS 'Admins can access all avatar files for moderation';

COMMENT ON FUNCTION get_signed_url_for_user IS 
'Validates access before generating signed URLs (used in API routes)';
