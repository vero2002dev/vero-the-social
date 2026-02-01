-- =================================================================
-- FIX: Update RLS for profile_interactions
-- PROBLEM: 'Likes You' page returns empty because users can't see rows where they are the target.
-- SOLUTION: Allow users to see interactions where they are actor OR target.
-- =================================================================

DROP POLICY IF EXISTS "Users can view their own interactions" ON profile_interactions;

CREATE POLICY "Users can view interactions involving them"
ON profile_interactions FOR SELECT
TO authenticated
USING (
    auth.uid() = actor_id 
    OR 
    auth.uid() = target_id
);
