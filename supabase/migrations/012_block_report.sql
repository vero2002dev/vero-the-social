-- 012_block_report.sql
-- Block + report system (minimal, effective) + blocked gating

create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

create table if not exists public.reports (
  id bigserial primary key,
  reporter uuid not null references public.profiles(id) on delete cascade,
  reported uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.blocks enable row level security;
alter table public.reports enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own"
on public.blocks for select
to authenticated
using (blocker = auth.uid());

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own"
on public.blocks for insert
to authenticated
with check (blocker = auth.uid());

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own"
on public.blocks for delete
to authenticated
using (blocker = auth.uid());

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports for insert
to authenticated
with check (reporter = auth.uid());

drop policy if exists "reports_select_none" on public.reports;
create policy "reports_select_none"
on public.reports for select
to authenticated
using (false);

create or replace function public._is_blocked(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks
    where (blocker = p_a and blocked = p_b)
       or (blocker = p_b and blocked = p_a)
  );
$$;

create or replace function public.rpc_block_user(p_blocked uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();

  if p_blocked is null then
    raise exception 'Invalid user';
  end if;

  if uid = p_blocked then
    raise exception 'Cannot block yourself';
  end if;

  insert into public.blocks(blocker, blocked)
  values (uid, p_blocked)
  on conflict do nothing;

  insert into public.events(user_id, name, meta)
  values (uid, 'user_block', jsonb_build_object('blocked', p_blocked));
end;
$$;

grant execute on function public.rpc_block_user(uuid) to authenticated;

create or replace function public.rpc_unblock_user(p_blocked uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();

  delete from public.blocks
  where blocker = uid and blocked = p_blocked;

  insert into public.events(user_id, name, meta)
  values (uid, 'user_unblock', jsonb_build_object('blocked', p_blocked));
end;
$$;

grant execute on function public.rpc_unblock_user(uuid) to authenticated;

create or replace function public.rpc_report_user(p_reported uuid, p_reason text, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := public._require_auth();

  if p_reported is null or uid = p_reported then
    raise exception 'Invalid user';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'Reason required';
  end if;

  insert into public.reports(reporter, reported, reason, details)
  values (uid, p_reported, trim(p_reason), nullif(trim(p_details), ''));

  insert into public.events(user_id, name, meta)
  values (uid, 'user_report', jsonb_build_object('reported', p_reported, 'reason', trim(p_reason)));
end;
$$;

grant execute on function public.rpc_report_user(uuid,text,text) to authenticated;

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

  if public._is_blocked(a, b) then
    return false;
  end if;

  return true;
end;
$$;

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
on public.messages for select
to authenticated
using (public._can_access_conversation(conversation_id, auth.uid()));

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public._can_access_conversation(conversation_id, auth.uid())
);

drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
on public.conversations for select
to authenticated
using (public._can_access_conversation(id, auth.uid()));

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

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select m.id, m.%I as user1, m.%I as user2, m.status, m.created_at, m.expires_at
     from public.matches m
     where m.status = ''pending''
       and (m.%I = $1 or m.%I = $1)
       and not public._is_blocked(m.%I, m.%I)
     order by m.created_at desc',
    col_a, col_b, col_a, col_b, col_a, col_b
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

  if p_query is null or length(trim(p_query)) < 2 then
    raise exception 'Pesquisa muito curta';
  end if;

  if length(p_query) > 32 then
    raise exception 'Pesquisa invalida';
  end if;

  q := trim(p_query);

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
