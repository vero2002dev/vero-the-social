-- Reveal RPCs + expire jobs + cron schedule

create or replace function public.rpc_request_reveal(p_to_user uuid, p_kind text)
returns public.reveals
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  inserted public.reveals;
  col_a text;
  col_b text;
  sql text;
  has_match boolean;
begin
  uid := public._require_auth();

  if p_kind not in ('profile','media') then
    raise exception 'Invalid kind';
  end if;

  if p_to_user is null or p_to_user = uid then
    raise exception 'Invalid target';
  end if;

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select exists(select 1 from public.matches m where m.status = ''active'' and ((m.%I = $1 and m.%I = $2) or (m.%I = $1 and m.%I = $2)))',
    col_a, col_b, col_b, col_a
  );
  execute sql into has_match using uid, p_to_user;
  if not has_match then
    raise exception 'No active match';
  end if;

  select r.* into inserted
  from public.reveals r
  where r.from_user = uid
    and r.to_user = p_to_user
    and r.kind = p_kind
    and r.status = 'requested'
    and r.expires_at > now()
  limit 1;

  if found then
    return inserted;
  end if;

  insert into public.reveals(from_user, to_user, kind, status, expires_at)
  values (uid, p_to_user, p_kind, 'requested', now() + interval '24 hours')
  returning * into inserted;

  return inserted;
end;
$$;

grant execute on function public.rpc_request_reveal(uuid,text) to authenticated;

create or replace function public.rpc_respond_reveal(p_reveal_id bigint, p_action text)
returns public.reveals
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  r public.reveals;
  new_status text;
begin
  uid := public._require_auth();

  if p_action not in ('accept','reject') then
    raise exception 'Invalid action';
  end if;

  select * into r from public.reveals where id = p_reveal_id;

  if not found then
    raise exception 'Reveal not found';
  end if;

  if r.to_user <> uid then
    raise exception 'Not authorized';
  end if;

  if r.status <> 'requested' then
    raise exception 'Reveal is not requested';
  end if;

  if r.expires_at <= now() then
    update public.reveals set status = 'expired' where id = p_reveal_id returning * into r;
    return r;
  end if;

  new_status := case when p_action = 'accept' then 'accepted' else 'rejected' end;

  update public.reveals
    set status = new_status
  where id = p_reveal_id
  returning * into r;

  return r;
end;
$$;

grant execute on function public.rpc_respond_reveal(bigint,text) to authenticated;

create or replace function public.expire_vero_rows()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.matches
    set status = 'expired'
  where status = 'pending'
    and expires_at <= now();

  update public.reveals
    set status = 'expired'
  where status = 'requested'
    and expires_at <= now();
end;
$$;

do $$
begin
  begin
    create extension if not exists pg_cron;
  exception when others then
    -- ignore if not permitted
  end;

  begin
    perform cron.unschedule('vero_expire_rows');
  exception when others then
    -- ignore
  end;

  begin
    perform cron.schedule(
      'vero_expire_rows',
      '*/5 * * * *',
      $cron$select public.expire_vero_rows();$cron$
    );
  exception when others then
    -- ignore
  end;
end $$;
