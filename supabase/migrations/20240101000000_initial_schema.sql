-- =====================================================
-- VERO - Initial Schema Migration
-- =====================================================
-- Creates all tables, enums, and basic constraints
-- Run order: 1/4

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE profile_type AS ENUM ('single', 'couple');

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected',
  'banned'
);

CREATE TYPE verification_request_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE photo_status AS ENUM (
  'approved',
  'pending_review',
  'rejected'
);

CREATE TYPE connection_type AS ENUM (
  'one_to_one',    -- 1→1
  'two_to_one',    -- 2→1
  'one_to_two',    -- 1→2
  'group'          -- 3+ pessoas
);

CREATE TYPE connection_status AS ENUM (
  'pending',
  'matched',
  'blocked'
);

CREATE TYPE member_role AS ENUM (
  'single',
  'couple'
);

-- =====================================================
-- TABLE: profiles
-- =====================================================
-- Core user profile table (extends auth.users)

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile type & identity
  profile_type profile_type NOT NULL DEFAULT 'single',
  display_name TEXT,           -- For singles
  couple_name TEXT,            -- For couples (e.g., "Ana & João")
  bio TEXT,
  
  -- Avatar (LOCKED after verification)
  avatar_url TEXT,
  avatar_locked BOOLEAN DEFAULT FALSE,
  
  -- Verification
  verification_status verification_status DEFAULT 'unverified',
  verified_at TIMESTAMPTZ,
  strikes INTEGER DEFAULT 0 CHECK (strikes >= 0 AND strikes <= 3),
  
  -- Active intent
  active_intent_id UUID, -- FK to intents (added later)
  
  -- Dynamics preferences (JSON array of accepted types)
  -- Example: ['one_to_one', 'two_to_one']
  accepted_dynamics JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT profile_name_check CHECK (
    (profile_type = 'single' AND display_name IS NOT NULL) OR
    (profile_type = 'couple' AND couple_name IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX idx_profiles_active_intent ON profiles(active_intent_id);
CREATE INDEX idx_profiles_type ON profiles(profile_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: intents
-- =====================================================
-- Predefined intents (seeded separately)

CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,  -- e.g., "meet", "tonight", "explore"
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,                  -- lucide icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intents_key ON intents(key);

-- Add FK constraint to profiles now that intents table exists
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_active_intent
FOREIGN KEY (active_intent_id) REFERENCES intents(id) ON DELETE SET NULL;

-- =====================================================
-- TABLE: gallery_photos
-- =====================================================
-- Additional photos beyond avatar

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status photo_status DEFAULT 'pending_review',
  
  -- Admin moderation
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_photos_owner ON gallery_photos(owner_id);
CREATE INDEX idx_gallery_photos_status ON gallery_photos(status);

-- =====================================================
-- TABLE: verification_requests
-- =====================================================
-- Verification submissions (selfie + proof)

CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status verification_request_status DEFAULT 'pending',
  
  -- Upload URLs (private storage)
  selfie_url TEXT NOT NULL,
  proof_url TEXT NOT NULL,  -- Can be video or multiple images (JSON array)
  
  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);

CREATE TRIGGER verification_requests_updated_at
BEFORE UPDATE ON verification_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: connections
-- =====================================================
-- Represents a match/connection between users

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_type connection_type NOT NULL,
  status connection_status DEFAULT 'pending',
  
  -- Optional: who initiated
  initiated_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_connections_status ON connections(status);
CREATE INDEX idx_connections_type ON connections(connection_type);

CREATE TRIGGER connections_updated_at
BEFORE UPDATE ON connections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: connection_members
-- =====================================================
-- Many-to-many: which profiles are in which connection

CREATE TABLE connection_members (
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  
  -- When they joined (for pending → matched flow)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (connection_id, profile_id)
);

CREATE INDEX idx_connection_members_profile ON connection_members(profile_id);
CREATE INDEX idx_connection_members_connection ON connection_members(connection_id);

-- =====================================================
-- TABLE: messages
-- =====================================================
-- Chat messages within connections

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  body TEXT NOT NULL,
  
  -- Optional: media attachments (JSON array of URLs)
  media_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Read receipts (JSON object: {user_id: timestamp})
  read_by JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_connection ON messages(connection_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- =====================================================
-- TABLE: reports
-- =====================================================
-- User reports for moderation

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,
  details TEXT,
  
  -- Admin resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  action_taken TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reports
  UNIQUE(reporter_id, reported_profile_id)
);

CREATE INDEX idx_reports_reported_profile ON reports(reported_profile_id);
CREATE INDEX idx_reports_resolved ON reports(resolved_at) WHERE resolved_at IS NULL;

-- =====================================================
-- TABLE: admin_users
-- =====================================================
-- Admin allowlist (alternative to env ADMIN_EMAILS)

CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- =====================================================
-- HELPER FUNCTION: is_admin
-- =====================================================
-- Check if current user is admin

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: is_verified
-- =====================================================
-- Check if a profile is verified

CREATE OR REPLACE FUNCTION is_verified(profile_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = profile_id
    AND verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: can_see_profile
-- =====================================================
-- Business rule: only verified users can see other profiles

CREATE OR REPLACE FUNCTION can_see_profile(viewer_id UUID, target_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Can always see own profile
  IF viewer_id = target_id THEN
    RETURN TRUE;
  END IF;
  
  -- Must be verified to see others
  RETURN is_verified(viewer_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with verification status and intent';
COMMENT ON TABLE intents IS 'Predefined intents for matching';
COMMENT ON TABLE gallery_photos IS 'Additional photos beyond avatar';
COMMENT ON TABLE verification_requests IS 'Verification submissions for review';
COMMENT ON TABLE connections IS 'Matches between users';
COMMENT ON TABLE connection_members IS 'Users participating in a connection';
COMMENT ON TABLE messages IS 'Chat messages in connections';
COMMENT ON TABLE reports IS 'User reports for moderation';
COMMENT ON TABLE admin_users IS 'Admin user allowlist';
