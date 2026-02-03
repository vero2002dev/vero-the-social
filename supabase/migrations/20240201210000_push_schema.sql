-- =================================================================
-- TABLE: push_subscriptions
-- Stores VAPID endpoints for users
-- =================================================================

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
ON push_subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =================================================================
-- FUNCTION: send_push_notification (Placeholder)
-- In a real setup, a Trigger would call an Edge Function / Webhook.
-- PostgreSQL cannot send HTTP requests natively without extensions (pg_net).
-- We will use a comments to indicate where the Database Webhook would be.
-- =================================================================
