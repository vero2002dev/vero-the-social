-- 016_verif_mvp_core.sql
-- VERIF-MVP core: profile flags, photos, verification requests, strikes/ban

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists verification_status text not null default 'unverified',
  add column if not exists visibility_status text not null default 'hidden',
  add column if not exists strikes int not null default 0,
  add column if not exists banned_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists baseline_photo_id uuid;

create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('profile','extra','selfie_verify')),
  storage_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','deleted')),
  reason text,
  meta jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists profile_photos_user_idx on public.profile_photos(user_id, created_at desc);

alter table public.profile_photos enable row level security;

drop policy if exists "photos_select_own" on public.profile_photos;
create policy "photos_select_own"
on public.profile_photos for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "photos_insert_own" on public.profile_photos;
create policy "photos_insert_own"
on public.profile_photos for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "photos_update_own" on public.profile_photos;
create policy "photos_update_own"
on public.profile_photos for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('initial','profile_change')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  challenge_code text not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_reason text
);

create index if not exists verreq_status_idx on public.verification_requests(status, created_at asc);
create index if not exists verreq_user_idx on public.verification_requests(user_id, created_at desc);

alter table public.verification_requests enable row level security;

drop policy if exists "verreq_select_own" on public.verification_requests;
create policy "verreq_select_own"
on public.verification_requests for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "verreq_insert_own" on public.verification_requests;
create policy "verreq_insert_own"
on public.verification_requests for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "verreq_update_none" on public.verification_requests;
create policy "verreq_update_none"
on public.verification_requests for update
to authenticated
using (false);

create or replace function public._is_banned(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bans b where b.user_id = p_user
  ) or exists (
    select 1 from public.profiles p where p.id = p_user and p.banned_at is not null
  );
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

grant execute on function public.rpc_start_verification(text) to authenticated;

create or replace function public.rpc_add_strike(p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  s int;
  threshold int := 3;
begin
  uid := public._require_not_banned();

  update public.profiles
  set strikes = strikes + 1
  where id = uid
  returning strikes into s;

  insert into public.events(user_id, name, meta)
  values (uid, 'photo_strike', jsonb_build_object('reason', p_reason, 'count', s))
  on conflict do nothing;

  if s >= threshold then
    update public.profiles
    set banned_at = now(),
        visibility_status = 'hidden'
    where id = uid;

    insert into public.events(user_id, name, meta)
    values (uid, 'user_banned', jsonb_build_object('reason', 'strikes'))
    on conflict do nothing;
  end if;
end;
$$;

grant execute on function public.rpc_add_strike(text) to authenticated;
