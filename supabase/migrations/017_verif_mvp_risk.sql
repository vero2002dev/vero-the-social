-- 017_verif_mvp_risk.sql
-- Risk fields for profile photos + public list RPC + storage policy updates + verified visibility filters

alter table public.profile_photos
  add column if not exists dhash text,
  add column if not exists risk_score int not null default 0,
  add column if not exists review_status text not null default 'none'
    check (review_status in ('none','needs_review','reviewed_ok','reviewed_bad')),
  add column if not exists public_visible boolean not null default true;

create index if not exists profile_photos_dhash_idx on public.profile_photos(dhash);
create index if not exists profile_photos_review_idx on public.profile_photos(review_status, created_at asc);

create or replace function public.rpc_list_public_photos(p_user uuid)
returns table (
  id uuid,
  kind text,
  storage_path text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, kind, storage_path, created_at
  from public.profile_photos
  where user_id = p_user
    and status = 'approved'
    and public_visible = true
    and deleted_at is null
  order by created_at desc
  limit 12;
$$;

grant execute on function public.rpc_list_public_photos(uuid) to authenticated;

-- Update private_media insert policy to allow profile/extras/verify paths owned by user
drop policy if exists "private_media_insert_owner_only_when_revealed" on storage.objects;
create policy "private_media_insert_owner_only_when_revealed"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (
    (
      (storage.foldername(name))[3] = 'convo'
      and public._media_reveal_accepted_for_conversation(((storage.foldername(name))[4])::bigint)
    )
    or (storage.foldername(name))[3] = 'profile'
    or (storage.foldername(name))[3] = 'extras'
    or (storage.foldername(name))[3] = 'verify'
  )
);

-- Verified + visible filters in discovery/search/inbox
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
       and exists (
         select 1 from public.profiles p
         where p.id = m.%I
           and p.verification_status = ''verified''
           and p.visibility_status = ''visible''
           and p.banned_at is null
       )
       and exists (
         select 1 from public.profiles p
         where p.id = m.%I
           and p.verification_status = ''verified''
           and p.visibility_status = ''visible''
           and p.banned_at is null
       )
     order by m.created_at desc',
    col_a, col_b, col_a, col_b, col_a, col_b, col_a, col_a, col_b
  );

  return query execute sql using uid;
end;
$$;

grant execute on function public.rpc_inbox_pending() to authenticated;

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
    and p.verification_status = 'verified'
    and p.visibility_status = 'visible'
    and p.banned_at is null
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
         and p.verification_status = ''verified''
         and p.visibility_status = ''visible''
         and p.banned_at is null
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
       and p.verification_status = ''verified''
       and p.visibility_status = ''visible''
       and p.banned_at is null
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
