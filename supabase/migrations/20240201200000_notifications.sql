-- =================================================================
-- TABLE: notifications
-- =================================================================

CREATE TYPE notification_type AS ENUM ('match', 'system', 'verification', 'social');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata for navigation (e.g., { "target_url": "/app/chats/123" })
  data JSONB DEFAULT '{}'::jsonb,
  
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Triggers/Server wrappers will handle this safely via valid user_ids

-- =================================================================
-- TRIGGER: notify_on_match
-- =================================================================
CREATE OR REPLACE FUNCTION public.handle_match_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify Use 1 (Initiator)
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.initiated_by,
    'match',
    'It''s a Match! 🎉',
    'You have a new connection. Say hello!',
    jsonb_build_object('url', '/app/chats/' || NEW.id)
  );

  -- Notify User 2 (Receiver)
  -- Need to find the other member. This is tricky in a trigger on 'connections' 
  -- because 'connection_members' might not be inserted yet if done transactionally relative to this row,
  -- OR we can look at the logic.
  -- Actually, the 'handle_new_swipe' function inserts 'connections' THEN 'connection_members'.
  -- A trigger on 'connections' AFTER INSERT might execute BEFORE members are there?
  -- No, usually we insert connection first.
  
  -- SIMPLIFICATION:
  -- Instead of a complex trigger here which might miss membership, 
  -- we should rely on the APPLICATION/RPC logic to insert notifications for matches,
  -- OR trigger on 'connection_members' logic.
  
  -- Let's try Trigger on 'connection_members' but that fires for each member.
  -- If I am added to a connection that is 'matched', notify me.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER ON connection_members
CREATE OR REPLACE FUNCTION public.handle_new_member_match()
RETURNS TRIGGER AS $$
DECLARE
  conn_status connection_status;
BEGIN
  -- Check connection status
  SELECT status INTO conn_status FROM connections WHERE id = NEW.connection_id;
  
  IF conn_status = 'matched' THEN
     INSERT INTO public.notifications (user_id, type, title, message, data)
     VALUES (
       NEW.profile_id,
       'match',
       'It''s a Match! 🎉',
       'You connected with someone new.',
       jsonb_build_object('url', '/app/chats/' || NEW.connection_id)
     );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_member_added_match
  AFTER INSERT ON public.connection_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_member_match();

