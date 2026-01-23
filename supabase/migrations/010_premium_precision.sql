-- 010_premium_precision.sql
-- Premium precision ordering + reveal priority + subscriptions fields

alter table public.subscriptions
  add column if not exists stripe_customer_id text;

alter table public.subscriptions
  add column if not exists stripe_subscription_id text;

alter table public.subscriptions
  add column if not exists status text;

update public.subscriptions
set status = coalesce(status, 'active');

create or replace function public._get_plan(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select s.plan from public.subscriptions s where s.user_id = p_user and coalesce(s.status, 'active') = 'active'),
    'free'
  );
$$;

create or replace function public._daily_limit_matches(plan text)
returns int
language sql
immutable
as $$
  select case when plan = 'premium' then 4 else 3 end;
$$;

create or replace function public._daily_limit_discover(plan text)
returns int
language sql
immutable
as $$
  select case when plan = 'premium' then 4 else 3 end;
$$;

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

create or replace function public.rpc_pending_reveals()
returns table(
  id bigint,
  from_user uuid,
  to_user uuid,
  kind text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  from_user_plan text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();

  return query
  select
    r.id,
    r.from_user,
    r.to_user,
    r.kind,
    r.status,
    r.created_at,
    r.expires_at,
    coalesce(s.plan, 'free') as from_user_plan
  from public.reveals r
  left join public.subscriptions s
    on s.user_id = r.from_user and coalesce(s.status, 'active') = 'active'
  where r.to_user = uid
    and r.status = 'requested'
  order by
    case when coalesce(s.plan, 'free') = 'premium' then 0 else 1 end,
    r.created_at desc;
end;
$$;

grant execute on function public.rpc_pending_reveals() to authenticated;
