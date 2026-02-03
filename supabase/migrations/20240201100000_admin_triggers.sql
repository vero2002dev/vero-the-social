-- =================================================================
-- TRIGGER: auto_verify_admins
-- Automatically marks a profile as 'verified' when added to admin_users
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = 'verified',
      verified_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_admin_created
  AFTER INSERT ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();
