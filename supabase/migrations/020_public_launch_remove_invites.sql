-- 020_public_launch_remove_invites.sql
-- Public launch: remove invite gate from core flow

-- Make profiles unlocked by default
alter table public.profiles
  alter column unlocked set default true;

-- Ensure all existing users are unlocked
update public.profiles
set unlocked = true
where unlocked is distinct from true;

-- Relax unlock gate for all RPCs (now equivalent to auth check)
create or replace function public._require_unlocked()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();
  return uid;
end;
$$;
