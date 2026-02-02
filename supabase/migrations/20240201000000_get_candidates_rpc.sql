-- =================================================================
-- FUNCTION: get_candidates (v2)
-- Fetches profiles respecting user preferences (Singles/Couples)
-- =================================================================

CREATE OR REPLACE FUNCTION get_candidates(
  limit_count INT DEFAULT 10
)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  my_preferences JSONB;
  show_singles BOOLEAN;
  show_couples BOOLEAN;
BEGIN
  -- 1. Get my preferences
  SELECT preferences INTO my_preferences
  FROM profiles
  WHERE id = current_user_id;
  
  -- Default to TRUE if null
  show_singles := COALESCE((my_preferences->>'show_singles')::BOOLEAN, TRUE);
  show_couples := COALESCE((my_preferences->>'show_couples')::BOOLEAN, TRUE);

  -- 2. Query
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.id != current_user_id
  -- Exclude seen
  AND p.id NOT IN (
    SELECT target_id 
    FROM profile_interactions 
    WHERE actor_id = current_user_id
  )
  -- Exclude reported
  AND p.id NOT IN (
    SELECT reported_profile_id
    FROM reports
    WHERE reporter_id = current_user_id
  )
  -- Apply Filters
  AND (
    (show_singles = TRUE AND p.profile_type = 'single') OR
    (show_couples = TRUE AND p.profile_type = 'couple')
  )
  ORDER BY random()
  LIMIT limit_count;
END;
$$;
