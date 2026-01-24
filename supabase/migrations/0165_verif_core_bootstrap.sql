-- 020_verif_core_bootstrap.sql
-- Ensure verification core tables/columns exist before risk migration.

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
