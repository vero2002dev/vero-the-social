-- Add terms_accepted_at to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Helper function to accept terms
CREATE OR REPLACE FUNCTION accept_terms()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET terms_accepted_at = NOW()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
