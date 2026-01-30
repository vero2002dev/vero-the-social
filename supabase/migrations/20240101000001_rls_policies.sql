-- =====================================================
-- VERO - Row-Level Security (RLS) Policies
-- =====================================================
-- Implements security rules for all tables
-- Run order: 2/4

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (with restrictions)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Avatar cannot be changed if locked
  AND (
    avatar_locked = FALSE
    OR avatar_url = (SELECT avatar_url FROM profiles WHERE id = auth.uid())
  )
);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Verified users can read other verified profiles
CREATE POLICY "Verified users can read other profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id != auth.uid()
  AND can_see_profile(auth.uid(), id)
  AND verification_status = 'verified'
);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- INTENTS POLICIES
-- =====================================================

-- All authenticated users can read intents
CREATE POLICY "Authenticated users can read intents"
ON intents FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify intents
CREATE POLICY "Admins can manage intents"
ON intents FOR ALL
TO authenticated
USING (is_admin());

-- =====================================================
-- GALLERY_PHOTOS POLICIES
-- =====================================================

-- Users can read their own photos (any status)
CREATE POLICY "Users can read own photos"
ON gallery_photos FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
ON gallery_photos FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON gallery_photos FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Verified users can read approved photos of other verified users
CREATE POLICY "Verified users can read approved photos"
ON gallery_photos FOR SELECT
TO authenticated
USING (
  owner_id != auth.uid()
  AND status = 'approved'
  AND is_verified(owner_id)
  AND is_verified(auth.uid())
);

-- Admins can read all photos
CREATE POLICY "Admins can read all photos"
ON gallery_photos FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update photo status
CREATE POLICY "Admins can update photos"
ON gallery_photos FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- VERIFICATION_REQUESTS POLICIES
-- =====================================================

-- Users can read their own verification requests
CREATE POLICY "Users can read own verification requests"
ON verification_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own verification requests
CREATE POLICY "Users can insert own verification request"
ON verification_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can read all verification requests
CREATE POLICY "Admins can read all verification requests"
ON verification_requests FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update verification requests
CREATE POLICY "Admins can update verification requests"
ON verification_requests FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- CONNECTIONS POLICIES
-- =====================================================

-- Users can read connections they're part of
CREATE POLICY "Users can read own connections"
ON connections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM connection_members
    WHERE connection_id = connections.id
    AND profile_id = auth.uid()
  )
);

-- Users can create connections (when initiating a connect)
CREATE POLICY "Users can create connections"
ON connections FOR INSERT
TO authenticated
WITH CHECK (initiated_by = auth.uid());

-- Users can update connections they're part of (e.g., accept/reject)
CREATE POLICY "Users can update own connections"
ON connections FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM connection_members
    WHERE connection_id = connections.id
    AND profile_id = auth.uid()
  )
);

-- Admins can read all connections
CREATE POLICY "Admins can read all connections"
ON connections FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- CONNECTION_MEMBERS POLICIES
-- =====================================================

-- Users can read members of connections they're in
CREATE POLICY "Users can read connection members"
ON connection_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM connection_members cm
    WHERE cm.connection_id = connection_members.connection_id
    AND cm.profile_id = auth.uid()
  )
);

-- Users can insert themselves into connections (when accepting)
CREATE POLICY "Users can join connections"
ON connection_members FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Users can delete themselves from connections (leave chat)
CREATE POLICY "Users can leave connections"
ON connection_members FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Admins can read all connection members
CREATE POLICY "Admins can read all connection members"
ON connection_members FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Users can read messages in connections they're part of
CREATE POLICY "Users can read messages in their connections"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM connection_members
    WHERE connection_id = messages.connection_id
    AND profile_id = auth.uid()
  )
);

-- Users can insert messages in connections they're part of
CREATE POLICY "Users can send messages in their connections"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM connection_members
    WHERE connection_id = messages.connection_id
    AND profile_id = auth.uid()
  )
);

-- Users can update their own messages (e.g., mark as edited)
CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Admins can read all messages
CREATE POLICY "Admins can read all messages"
ON messages FOR SELECT
TO authenticated
USING (is_admin());

-- =====================================================
-- REPORTS POLICIES
-- =====================================================

-- Users can read their own reports
CREATE POLICY "Users can read own reports"
ON reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Users can create reports
CREATE POLICY "Users can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND reporter_id != reported_profile_id  -- Can't report yourself
);

-- Admins can read all reports
CREATE POLICY "Admins can read all reports"
ON reports FOR SELECT
TO authenticated
USING (is_admin());

-- Admins can update reports (resolve)
CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
TO authenticated
USING (is_admin());

-- =====================================================
-- ADMIN_USERS POLICIES
-- =====================================================

-- Only existing admins can read admin list
CREATE POLICY "Admins can read admin list"
ON admin_users FOR SELECT
TO authenticated
USING (is_admin());

-- Only existing admins can add new admins
CREATE POLICY "Admins can add new admins"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Only existing admins can remove admins
CREATE POLICY "Admins can remove admins"
ON admin_users FOR DELETE
TO authenticated
USING (is_admin());

-- =====================================================
-- TRIGGERS FOR BUSINESS LOGIC
-- =====================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Lock avatar when verification is approved
CREATE OR REPLACE FUNCTION lock_avatar_on_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_status = 'verified' AND OLD.verification_status != 'verified' THEN
    NEW.avatar_locked = TRUE;
    NEW.verified_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_lock_avatar
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION lock_avatar_on_verification();

-- Auto-ban user on 3rd strike
CREATE OR REPLACE FUNCTION auto_ban_on_strikes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.strikes >= 3 AND OLD.strikes < 3 THEN
    NEW.verification_status = 'banned';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_auto_ban
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_ban_on_strikes();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can read own profile" ON profiles 
IS 'Users can always read their own profile data';

COMMENT ON POLICY "Verified users can read other profiles" ON profiles 
IS 'Only verified users can see other verified profiles (privacy gate)';

COMMENT ON POLICY "Users can read messages in their connections" ON messages 
IS 'Users can only read messages in connections they are members of';
