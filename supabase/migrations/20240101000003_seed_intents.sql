-- =====================================================
-- VERO - Seed Intents
-- =====================================================
-- Populates intents table with predefined options
-- Run order: 4/4

-- =====================================================
-- SEED INTENTS
-- =====================================================
-- Sensual, premium copy (curta e elegante)

INSERT INTO intents (key, title, description, icon) VALUES
  (
    'meet',
    'Meet Tonight',
    'Looking to connect in person',
    'calendar-heart'
  ),
  (
    'explore',
    'Explore Desires',
    'Open to discovering new connections',
    'compass'
  ),
  (
    'chat',
    'Just Chat',
    'Start with conversation',
    'message-circle'
  ),
  (
    'serious',
    'Something Real',
    'Seeking genuine connection',
    'heart'
  ),
  (
    'playful',
    'Keep it Light',
    'Fun and flirty vibes',
    'sparkles'
  ),
  (
    'curious',
    'Curious Minds',
    'Exploring possibilities together',
    'eye'
  ),
  (
    'adventure',
    'Adventure Awaits',
    'Ready for something spontaneous',
    'rocket'
  ),
  (
    'intimate',
    'Deep Connection',
    'Quality over quantity',
    'flame'
  ),
  (
    'triad',
    'Three's Company',
    'Open to group dynamics',
    'users'
  ),
  (
    'virtual',
    'Virtual First',
    'Start online, see where it goes',
    'video'
  )
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- DEFAULT ADMIN USER (OPTIONAL)
-- =====================================================
-- Add your email here to bootstrap first admin
-- Replace with your actual email or manage via env

-- Example (uncomment and replace):
-- INSERT INTO admin_users (user_id, email, granted_by)
-- SELECT id, email, id
-- FROM auth.users
-- WHERE email = 'admin@vero.app'
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- VERIFY MIGRATION
-- =====================================================

-- Should return 10 intents
SELECT COUNT(*) as intent_count FROM intents;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE intents IS 'Seeded with 10 sensual intent options for MVP';
