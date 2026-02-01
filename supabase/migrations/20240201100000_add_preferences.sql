-- =================================================================
-- MIGRATION: Add Preferences Column
-- Store user discovery settings (age range, distance, gender/type preference)
-- =================================================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Example structure:
-- {
--   "show_me": ["single", "couple"],
--   "age_range": [18, 50],
--   "max_distance": 100
-- }
