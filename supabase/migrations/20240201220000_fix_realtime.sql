-- =================================================================
-- FIX: enable_realtime
-- Enable Supabase Realtime for critical tables.
-- Without this, subscribe() in the client does nothing.
-- =================================================================

BEGIN;

-- 1. Check if publication exists (Supabase default), if not create it (rare)
-- usually 'supabase_realtime' exists.

-- 2. Add tables to publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- Maybe profile_interactions for "Who Liked Me" realtime? 
-- High volume, maybe skip for now to save bandwidth.

COMMIT;
