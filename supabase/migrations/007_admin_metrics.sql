-- 007_admin_metrics.sql
-- Admin allowlist + metrics RPC + events table

create table if not exists public.events (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_name_idx on public.events (name);
create index if not exists events_user_created_idx on public.events (user_id, created_at desc);

alter table public.events enable row level security;

drop policy if exists "events_insert_own" on public.events;
create policy "events_insert_own"
on public.events for insert
to authenticated
with check (user_id = auth.uid());

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_admin" on public.admin_users;
create policy "admin_users_select_admin"
on public.admin_users for select
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "admin_users_write_none" on public.admin_users;
create policy "admin_users_write_none"
on public.admin_users for insert
to authenticated
with check (false);

drop policy if exists "admin_users_update_none" on public.admin_users;
create policy "admin_users_update_none"
on public.admin_users for update
to authenticated
using (false)
with check (false);

drop policy if exists "admin_users_delete_none" on public.admin_users;
create policy "admin_users_delete_none"
on public.admin_users for delete
to authenticated
using (false);

drop policy if exists "events_select_admin" on public.events;
create policy "events_select_admin"
on public.events for select
to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create or replace function public._is_admin(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users a where a.user_id = p_user);
$$;

create or replace function public.rpc_is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();
  return public._is_admin(uid);
end;
$$;

grant execute on function public.rpc_is_admin() to authenticated;

create or replace function public.rpc_admin_metrics(p_days int default 14)
returns table (
  day date,
  unlock_success int,
  onboarding_done int,
  intent_set int,
  discover_view int,
  match_request int,
  match_accept int,
  chat_send_text int,
  invite_create int,
  invite_copy int,
  active_users int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();

  if not public._is_admin(uid) then
    raise exception 'Not authorized';
  end if;

  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'Invalid days (1-90)';
  end if;

  return query
  with days as (
    select (current_date - (g.i || ' days')::interval)::date as day
    from generate_series(0, p_days - 1) as g(i)
  ),
  e as (
    select
      (created_at at time zone 'utc')::date as day,
      name,
      user_id
    from public.events
    where created_at >= (now() - (p_days || ' days')::interval)
  ),
  counts as (
    select
      day,
      sum(case when name = 'unlock_success' then 1 else 0 end)::int as unlock_success,
      sum(case when name = 'onboarding_done' then 1 else 0 end)::int as onboarding_done,
      sum(case when name = 'intent_set' then 1 else 0 end)::int as intent_set,
      sum(case when name = 'discover_view' then 1 else 0 end)::int as discover_view,
      sum(case when name = 'match_request' then 1 else 0 end)::int as match_request,
      sum(case when name = 'match_accept' then 1 else 0 end)::int as match_accept,
      sum(case when name = 'chat_send_text' then 1 else 0 end)::int as chat_send_text,
      sum(case when name = 'invite_create' then 1 else 0 end)::int as invite_create,
      sum(case when name = 'invite_copy' then 1 else 0 end)::int as invite_copy,
      count(distinct user_id)::int as active_users
    from e
    group by day
  )
  select
    d.day,
    coalesce(c.unlock_success, 0),
    coalesce(c.onboarding_done, 0),
    coalesce(c.intent_set, 0),
    coalesce(c.discover_view, 0),
    coalesce(c.match_request, 0),
    coalesce(c.match_accept, 0),
    coalesce(c.chat_send_text, 0),
    coalesce(c.invite_create, 0),
    coalesce(c.invite_copy, 0),
    coalesce(c.active_users, 0)
  from days d
  left join counts c on c.day = d.day
  order by d.day asc;
end;
$$;

grant execute on function public.rpc_admin_metrics(int) to authenticated;

create or replace function public.rpc_admin_kpis(p_days int default 14)
returns table(
  days int,
  unlock_success int,
  onboarding_done int,
  intent_set int,
  match_request int,
  match_accept int,
  chat_send_text int,
  invite_create int,
  active_users int,
  onboard_rate numeric,
  intent_rate numeric,
  request_rate numeric,
  accept_rate numeric,
  chat_rate numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  u int;
  o int;
  i int;
  r int;
  a int;
  c int;
  inv int;
  au int;
begin
  uid := public._require_auth();
  if not public._is_admin(uid) then
    raise exception 'Not authorized';
  end if;

  if p_days is null or p_days < 1 or p_days > 90 then
    raise exception 'Invalid days (1-90)';
  end if;

  select
    sum(case when name='unlock_success' then 1 else 0 end)::int,
    sum(case when name='onboarding_done' then 1 else 0 end)::int,
    sum(case when name='intent_set' then 1 else 0 end)::int,
    sum(case when name='match_request' then 1 else 0 end)::int,
    sum(case when name='match_accept' then 1 else 0 end)::int,
    sum(case when name='chat_send_text' then 1 else 0 end)::int,
    sum(case when name='invite_create' then 1 else 0 end)::int,
    count(distinct user_id)::int
  into u,o,i,r,a,c,inv,au
  from public.events
  where created_at >= (now() - (p_days || ' days')::interval);

  return query
  select
    p_days,
    coalesce(u,0), coalesce(o,0), coalesce(i,0),
    coalesce(r,0), coalesce(a,0), coalesce(c,0),
    coalesce(inv,0), coalesce(au,0),
    case when coalesce(u,0)=0 then 0 else round(o::numeric/u::numeric, 4) end,
    case when coalesce(o,0)=0 then 0 else round(i::numeric/o::numeric, 4) end,
    case when coalesce(i,0)=0 then 0 else round(r::numeric/i::numeric, 4) end,
    case when coalesce(r,0)=0 then 0 else round(a::numeric/r::numeric, 4) end,
    case when coalesce(a,0)=0 then 0 else round(c::numeric/a::numeric, 4) end;
end;
$$;

grant execute on function public.rpc_admin_kpis(int) to authenticated;
