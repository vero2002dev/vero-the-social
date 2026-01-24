-- 018_verif_start_patch.sql
-- Update rpc_start_verification to cancel previous pending requests (1 active max)

create or replace function public.rpc_start_verification(p_type text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  rid uuid;
  code text;
begin
  uid := public._require_not_banned();

  if p_type not in ('initial','profile_change') then
    raise exception 'Invalid type';
  end if;

  update public.verification_requests
  set status = 'cancelled'
  where user_id = uid
    and status = 'pending';

  code := upper(substr(md5(random()::text), 1, 6));

  insert into public.verification_requests(user_id, type, status, challenge_code)
  values (uid, p_type, 'pending', code)
  returning id into rid;

  update public.profiles
  set verification_status = 'pending',
      visibility_status = 'hidden'
  where id = uid;

  insert into public.events(user_id, name, meta)
  values (uid, 'verification_started', jsonb_build_object('type', p_type, 'request_id', rid))
  on conflict do nothing;

  return rid;
end;
$$;
