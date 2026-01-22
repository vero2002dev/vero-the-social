-- RPCs + limits for VERO (Step 1C)

create or replace function public._require_auth()
returns uuid
language plpgsql
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  return uid;
end;
$$;

create or replace function public._get_plan(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.plan from public.subscriptions s where s.user_id = p_user),
    'free'
  );
$$;

create or replace function public._daily_limit_matches(plan text)
returns int
language sql
immutable
as $$
  select case when plan = 'premium' then 10 else 3 end;
$$;

create or replace function public._daily_limit_discover(plan text)
returns int
language sql
immutable
as $$
  select case when plan = 'premium' then 8 else 3 end;
$$;

create or replace function public._weekly_limit_invites(plan text)
returns int
language sql
immutable
as $$
  select case when plan = 'premium' then 5 else 2 end;
$$;

create or replace function public._today_start()
returns timestamptz
language sql
stable
as $$
  select date_trunc('day', now());
$$;

create or replace function public._week_start()
returns timestamptz
language sql
stable
as $$
  select date_trunc('week', now());
$$;

-- Match schema compatibility (user_a/user_b vs user1/user2)
create or replace function public._matches_columns()
returns table(col_a text, col_b text)
language plpgsql
as $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    col_a := 'user_a';
    col_b := 'user_b';
  else
    col_a := 'user1';
    col_b := 'user2';
  end if;
  return next;
end;
$$;

-- Ensure matches has status/expires_at
alter table public.matches
  add column if not exists status text not null default 'pending';

alter table public.matches
  add column if not exists expires_at timestamptz not null default (now() + interval '48 hours');

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'matches_status_check') then
    alter table public.matches
      add constraint matches_status_check
      check (status in ('pending','active','expired','blocked'));
  end if;
end $$;

-- =========================
-- RPC: set intent
-- =========================
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
  uid := public._require_auth();

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

-- =========================
-- RPC: discover
-- =========================
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
  uid := public._require_auth();
  plan := public._get_plan(uid);
  lim := public._daily_limit_discover(plan);

  select col_a, col_b into col_a, col_b from public._matches_columns() limit 1;

  sql := format($q$
    with latest_intent as (
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
      and not exists (
        select 1
        from public.matches m
        where (m.%I = $1 and m.%I = p.id)
           or (m.%I = $1 and m.%I = p.id)
          and m.status in ('pending','active','blocked')
      )
    order by random()
    limit %s
  $q$, col_a, col_b, col_b, col_a, lim);

  return query execute sql using uid;
end;
$$;

grant execute on function public.rpc_discover() to authenticated;

-- =========================
-- RPC: request match
-- =========================
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
  col_a text;
  col_b text;
  sql text;
  conflict_clause text;
begin
  uid := public._require_auth();

  if p_target is null or p_target = uid then
    raise exception 'Invalid target';
  end if;

  if not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'Target profile not found';
  end if;

  plan := public._get_plan(uid);
  lim := public._daily_limit_matches(plan);

  select col_a, col_b into col_a, col_b from public._matches_columns() limit 1;

  sql := format(
    'select count(*) from public.matches where %I = $1 and created_at >= public._today_start() and status in (''pending'',''active'',''expired'')',
    col_a
  );
  execute sql into used using uid;

  if used >= lim then
    raise exception 'Daily match request limit reached';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_min'
  ) then
    conflict_clause := 'on conflict (user_min, user_max) do update set created_at = public.matches.created_at';
  else
    conflict_clause := '';
  end if;

  sql := format(
    'insert into public.matches(%I, %I, status, expires_at) values ($1, $2, ''pending'', now() + interval ''48 hours'') %s returning *',
    col_a, col_b, conflict_clause
  );
  execute sql into inserted using uid, p_target;

  return inserted;
end;
$$;

grant execute on function public.rpc_request_match(uuid) to authenticated;

-- =========================
-- RPC: respond match
-- =========================
create or replace function public.rpc_respond_match(p_match_id bigint, p_action text)
returns table (
  match_id bigint,
  status text,
  conversation_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  col_a text;
  col_b text;
  conv_id bigint;
  allowed int;
begin
  uid := public._require_auth();
  select col_a, col_b into col_a, col_b from public._matches_columns() limit 1;

  execute format(
    'select 1 from public.matches where id = $1 and (%I = $2 or %I = $2)',
    col_a, col_b
  ) into allowed using p_match_id, uid;

  if allowed is null then
    raise exception 'Not authorized';
  end if;

  if p_action not in ('accept','reject') then
    raise exception 'Invalid action';
  end if;

  if p_action = 'reject' then
    update public.matches set status = 'expired' where id = p_match_id;
    return query select p_match_id, 'expired'::text, null::bigint;
    return;
  end if;

  update public.matches set status = 'active' where id = p_match_id;

  insert into public.conversations(match_id)
  values (p_match_id)
  on conflict (match_id) do nothing
  returning id into conv_id;

  if conv_id is null then
    select c.id into conv_id from public.conversations c where c.match_id = p_match_id;
  end if;

  return query select p_match_id, 'active'::text, conv_id;
end;
$$;

grant execute on function public.rpc_respond_match(bigint,text) to authenticated;

-- =========================
-- RPC: create invite
-- =========================
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
  uid := public._require_auth();

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

-- =========================
-- RPC: consume invite
-- =========================
create or replace function public.rpc_consume_invite(p_code text)
returns table (
  invite_id bigint,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  inv public.invites;
begin
  uid := public._require_auth();

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

  return query select inv.id, 'consumed'::text;
end;
$$;

grant execute on function public.rpc_consume_invite(text) to authenticated;
