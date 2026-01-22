-- 005_invite_unlock_paywall.sql
-- Invite unlock + usage counters + gating

alter table public.profiles
  add column if not exists unlocked boolean not null default false;

create table if not exists public.invite_claims (
  id bigserial primary key,
  invite_id bigint not null references public.invites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique(invite_id),
  unique(user_id)
);

alter table public.invite_claims enable row level security;

drop policy if exists "invite_claims_select_own" on public.invite_claims;
create policy "invite_claims_select_own"
on public.invite_claims for select
to authenticated
using (user_id = auth.uid());

create or replace function public._require_unlocked()
returns uuid
language plpgsql
as $$
declare
  uid uuid;
  ok boolean;
begin
  uid := public._require_auth();

  select p.unlocked into ok
  from public.profiles p
  where p.id = uid;

  if coalesce(ok,false) = false then
    raise exception 'Account locked: invite required';
  end if;

  return uid;
end;
$$;

create or replace function public.rpc_claim_invite(p_code text)
returns table(
  unlocked boolean,
  plan text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  inv public.invites;
  user_plan text;
begin
  uid := public._require_auth();

  if p_code is null or length(trim(p_code)) < 6 then
    raise exception 'Invalid code';
  end if;

  if exists (select 1 from public.profiles where id = uid and unlocked = true) then
    user_plan := public._get_plan(uid);
    return query select true, user_plan;
    return;
  end if;

  select * into inv
  from public.invites
  where code = p_code;

  if not found then
    raise exception 'Invalid code';
  end if;

  if inv.status <> 'active' then
    raise exception 'Invite not active';
  end if;

  if inv.expires_at <= now() then
    update public.invites set status = 'expired' where id = inv.id;
    raise exception 'Invite expired';
  end if;

  update public.invites
     set status = 'consumed',
         consumed_by = uid
   where id = inv.id;

  insert into public.invite_claims(invite_id, user_id)
  values (inv.id, uid)
  on conflict (user_id) do nothing;

  update public.profiles
     set unlocked = true
   where id = uid;

  user_plan := public._get_plan(uid);
  return query select true, user_plan;
end;
$$;

grant execute on function public.rpc_claim_invite(text) to authenticated;

create or replace function public.rpc_usage()
returns table(
  plan text,
  discover_limit int,
  discover_used int,
  discover_remaining int,
  match_limit int,
  match_used int,
  match_remaining int,
  invite_week_limit int,
  invite_week_used int,
  invite_week_remaining int,
  unlocked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  p text;
  dlim int;
  mlim int;
  ilim int;
  dused int;
  mused int;
  iused int;
  u boolean;
  col_a text;
  col_b text;
  sql text;
begin
  uid := public._require_auth();

  select unlocked into u from public.profiles where id = uid;

  p := public._get_plan(uid);
  dlim := public._daily_limit_discover(p);
  mlim := public._daily_limit_matches(p);
  ilim := public._weekly_limit_invites(p);

  dused := 0;

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select count(*) from public.matches m where m.%I = $1 and m.created_at >= public._today_start() and m.status in (''pending'',''active'',''expired'')',
    col_a
  );
  execute sql into mused using uid;

  select count(*) into iused
  from public.invites i
  where i.created_by = uid
    and i.created_at >= public._week_start();

  return query
  select
    p,
    dlim, dused, greatest(dlim - dused, 0),
    mlim, mused, greatest(mlim - mused, 0),
    ilim, iused, greatest(ilim - iused, 0),
    coalesce(u,false);
end;
$$;

grant execute on function public.rpc_usage() to authenticated;

create or replace function public.rpc_set_intent(
  p_intent_key text,
  p_intensity int,
  p_note text default null
)
returns public.intents
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  inserted public.intents;
begin
  uid := public._require_unlocked();

  if p_intent_key not in ('curiosity','connection','desire','private','casual','no_labels') then
    raise exception 'Invalid intent_key';
  end if;

  if p_intensity < 1 or p_intensity > 5 then
    raise exception 'Invalid intensity (1-5)';
  end if;

  update public.intents
     set expires_at = now()
   where user_id = uid
     and expires_at > now();

  insert into public.intents(user_id, intent_key, intensity, note, expires_at)
  values (uid, p_intent_key, p_intensity::smallint, nullif(p_note,''), now() + interval '24 hours')
  returning * into inserted;

  return inserted;
end;
$$;

grant execute on function public.rpc_set_intent(text,int,text) to authenticated;

create or replace function public.rpc_discover()
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_path text,
  intent_key text,
  intensity smallint,
  intent_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  plan text;
  lim int;
  col_a text;
  col_b text;
  sql text;
begin
  uid := public._require_unlocked();
  plan := public._get_plan(uid);
  lim := public._daily_limit_discover(plan);

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'with latest_intent as (
       select i.user_id, i.intent_key, i.intensity, i.expires_at,
              row_number() over (partition by i.user_id order by i.created_at desc) as rn
       from public.intents i
       where i.expires_at > now()
     )
     select
       p.id,
       p.username,
       p.display_name,
       p.bio,
       p.avatar_path,
       li.intent_key,
       li.intensity,
       li.expires_at
     from public.profiles p
     left join latest_intent li
       on li.user_id = p.id and li.rn = 1
     where p.id <> $1
       and p.unlocked = true
       and not exists (
         select 1
         from public.matches m
         where ((m.%I = $1 and m.%I = p.id) or (m.%I = $1 and m.%I = p.id))
           and m.status in (''pending'',''active'',''blocked'')
       )
     order by random()
     limit $2',
    col_a, col_b, col_b, col_a
  );

  return query execute sql using uid, lim;
end;
$$;

grant execute on function public.rpc_discover() to authenticated;

create or replace function public.rpc_request_match(p_target uuid)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  plan text;
  lim int;
  used int;
  inserted public.matches;
  target_unlocked boolean;
  col_a text;
  col_b text;
  sql text;
begin
  uid := public._require_unlocked();

  if p_target is null or p_target = uid then
    raise exception 'Invalid target';
  end if;

  select unlocked into target_unlocked from public.profiles where id = p_target;
  if coalesce(target_unlocked,false) = false then
    raise exception 'Target not available';
  end if;

  plan := public._get_plan(uid);
  lim := public._daily_limit_matches(plan);

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select count(*) from public.matches m where m.%I = $1 and m.created_at >= public._today_start() and m.status in (''pending'',''active'',''expired'')',
    col_a
  );
  execute sql into used using uid;

  if used >= lim then
    raise exception 'Daily match request limit reached';
  end if;

  sql := format(
    'insert into public.matches(%I, %I, status, expires_at)
     values ($1, $2, ''pending'', now() + interval ''48 hours'')
     on conflict (user_min, user_max) do update
       set created_at = public.matches.created_at
     returning *',
    col_a, col_b
  );
  execute sql into inserted using uid, p_target;

  return inserted;
end;
$$;

grant execute on function public.rpc_request_match(uuid) to authenticated;

create or replace function public.rpc_create_invite()
returns public.invites
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  plan text;
  lim int;
  used int;
  code text;
  inserted public.invites;
begin
  uid := public._require_unlocked();

  plan := public._get_plan(uid);
  lim := public._weekly_limit_invites(plan);

  select count(*) into used
  from public.invites i
  where i.created_by = uid
    and i.created_at >= public._week_start();

  if used >= lim then
    raise exception 'Weekly invite limit reached';
  end if;

  code := encode(gen_random_bytes(9), 'base64');
  code := translate(code, '=/+','');

  insert into public.invites(code, created_by, status, expires_at)
  values (code, uid, 'active', now() + interval '7 days')
  returning * into inserted;

  return inserted;
end;
$$;

grant execute on function public.rpc_create_invite() to authenticated;
