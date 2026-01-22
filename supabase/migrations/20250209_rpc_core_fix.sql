-- Fix ambiguous col_a/col_b in RPCs

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

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

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

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

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
  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

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
