-- =================================================================
-- FUNCTION: get_candidates
-- Fetches profiles that the user has NOT interacted with yet.
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
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM profiles p
  WHERE p.id != current_user_id
  AND p.id NOT IN (
    SELECT target_id 
    FROM profile_interactions 
    WHERE actor_id = current_user_id
  )
  AND p.id NOT IN (
    SELECT reported_profile_id
    FROM reports
    WHERE reporter_id = current_user_id
  )
  -- Optional: Add verification check if strict
  -- AND p.verification_status = 'verified'
  ORDER BY random() -- Shuffle results
  LIMIT limit_count;
END;
$$;
