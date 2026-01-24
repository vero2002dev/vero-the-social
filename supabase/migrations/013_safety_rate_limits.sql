-- 013_safety_rate_limits.sql
-- Rate limits + cooldowns + bans (minimal, effective)

create table if not exists public.bans (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.bans enable row level security;

drop policy if exists "bans_select_none" on public.bans;
create policy "bans_select_none"
on public.bans for select
to authenticated
using (false);

drop policy if exists "bans_write_none" on public.bans;
create policy "bans_write_none"
on public.bans for insert
to authenticated
with check (false);

create or replace function public._is_banned(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.bans b where b.user_id = p_user);
$$;

create or replace function public._require_not_banned()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();
  if public._is_banned(uid) then
    raise exception 'Account disabled';
  end if;
  return uid;
end;
$$;

create or replace function public._rate_limit(p_name text, p_max int, p_window_seconds int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  c int;
begin
  uid := public._require_not_banned();

  if p_max < 1 or p_window_seconds < 10 then
    raise exception 'Invalid rate limit';
  end if;

  select count(*) into c
  from public.events
  where user_id = uid
    and name = p_name
    and created_at >= (now() - (p_window_seconds || ' seconds')::interval);

  if c >= p_max then
    raise exception 'Slow down';
  end if;
end;
$$;

create or replace function public._cooldown_pair(p_name text, p_other uuid, p_window_seconds int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  c int;
begin
  uid := public._require_not_banned();

  if p_other is null then
    raise exception 'Invalid target';
  end if;

  select count(*) into c
  from public.events
  where user_id = uid
    and name = p_name
    and (meta->>'target')::uuid = p_other
    and created_at >= (now() - (p_window_seconds || ' seconds')::interval);

  if c > 0 then
    raise exception 'Cooldown active';
  end if;
end;
$$;

create or replace function public._can_access_conversation(p_conversation_id bigint, p_uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  col_a text;
  col_b text;
  a uuid;
  b uuid;
  sql text;
begin
  if p_uid is null then
    return false;
  end if;

  if public._is_banned(p_uid) then
    return false;
  end if;

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select m.%I, m.%I
       from public.conversations c
       join public.matches m on m.id = c.match_id
      where c.id = $1 and m.status = ''active''',
    col_a, col_b
  );
  execute sql into a, b using p_conversation_id;

  if a is null or b is null then
    return false;
  end if;

  if not (p_uid = a or p_uid = b) then
    return false;
  end if;

  if public._is_banned(a) or public._is_banned(b) then
    return false;
  end if;

  if public._is_blocked(a, b) then
    return false;
  end if;

  return true;
end;
$$;

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
  perform public._require_not_banned();

  if p_target is null or p_target = uid then
    raise exception 'Invalid target';
  end if;

  if public._is_blocked(uid, p_target) then
    raise exception 'Not allowed';
  end if;

  if public._is_banned(p_target) then
    raise exception 'Not found';
  end if;

  perform public._rate_limit('match_request_server', 2, 60);
  perform public._rate_limit('match_request_server', 6, 86400);
  perform public._cooldown_pair('match_request_server', p_target, 86400);

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

  insert into public.events(user_id, name, meta)
  values (uid, 'match_request_server', jsonb_build_object('target', p_target))
  on conflict do nothing;

  return inserted;
end;
$$;

grant execute on function public.rpc_request_match(uuid) to authenticated;

create or replace function public.rpc_search_user(p_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  intent_key text,
  intensity int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  q text;
begin
  uid := public._require_unlocked();
  perform public._require_not_banned();

  perform public._rate_limit('search_run_server', 10, 60);
  perform public._rate_limit('search_run_server', 60, 86400);

  if p_query is null or length(trim(p_query)) < 2 then
    raise exception 'Pesquisa muito curta';
  end if;

  if length(p_query) > 32 then
    raise exception 'Pesquisa invalida';
  end if;

  q := trim(p_query);

  insert into public.events(user_id, name, meta)
  values (uid, 'search_run_server', jsonb_build_object('q', q))
  on conflict do nothing;

  return query
  with latest_intent as (
    select i.user_id, i.intent_key, i.intensity,
           row_number() over (partition by i.user_id order by i.created_at desc) as rn
    from public.intents i
    where i.expires_at > now()
  )
  select
    p.id,
    p.username,
    coalesce(p.display_name, '') as display_name,
    coalesce(p.bio, '') as bio,
    li.intent_key,
    li.intensity
  from public.profiles p
  left join latest_intent li
    on li.user_id = p.id and li.rn = 1
  where p.id <> uid
    and p.unlocked = true
    and not public._is_blocked(p.id, uid)
    and not public._is_banned(p.id)
    and (
      p.username ilike (q || '%')
      or p.username ilike ('%' || q || '%')
    )
  order by
    case when p.username ilike (q || '%') then 0 else 1 end,
    p.username asc
  limit 10;
end;
$$;

grant execute on function public.rpc_search_user(text) to authenticated;

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
  perform public._require_not_banned();

  perform public._rate_limit('invite_create_server', 1, 60);
  perform public._rate_limit('invite_create_server', 3, 86400);

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

  insert into public.events(user_id, name, meta)
  values (uid, 'invite_create_server', jsonb_build_object('id', inserted.id))
  on conflict do nothing;

  return inserted;
end;
$$;

grant execute on function public.rpc_create_invite() to authenticated;

create or replace function public.rpc_inbox_pending()
returns table(
  id bigint,
  user1 uuid,
  user2 uuid,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  col_a text;
  col_b text;
  sql text;
begin
  uid := public._require_auth();
  perform public._require_not_banned();

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select m.id, m.%I as user1, m.%I as user2, m.status, m.created_at, m.expires_at
     from public.matches m
     where m.status = ''pending''
       and (m.%I = $1 or m.%I = $1)
       and not public._is_blocked(m.%I, m.%I)
       and not public._is_banned(m.%I)
     order by m.created_at desc',
    col_a, col_b, col_a, col_b, col_a, col_b, col_a
  );

  return query execute sql using uid;
end;
$$;

grant execute on function public.rpc_inbox_pending() to authenticated;

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
  my_intensity int;
  sql text;
begin
  uid := public._require_unlocked();
  perform public._require_not_banned();
  plan := public._get_plan(uid);
  lim := public._daily_limit_discover(plan);

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  select i.intensity into my_intensity
  from public.intents i
  where i.user_id = uid
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;
  my_intensity := coalesce(my_intensity, 3);

  if plan = 'premium' then
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
         and not public._is_banned(p.id)
         and not public._is_blocked(p.id, $1)
         and not exists (
           select 1
           from public.matches m
           where ((m.%I = $1 and m.%I = p.id) or (m.%I = $1 and m.%I = p.id))
             and m.status in (''pending'',''active'',''blocked'')
         )
       order by
         case when li.intent_key is not null then 0 else 1 end,
         abs(coalesce(li.intensity, 0) - $2),
         random()
       limit $3',
      col_a, col_b, col_b, col_a
    );
    return query execute sql using uid, my_intensity, lim;
  end if;

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
       and not public._is_banned(p.id)
       and not public._is_blocked(p.id, $1)
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
