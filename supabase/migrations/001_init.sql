-- Step 1A: base schema + storage buckets + profiles RLS

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_path text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists bio text;

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  add column if not exists created_at timestamptz;

create unique index if not exists profiles_username_key on public.profiles (username);

-- intents
create table if not exists public.intents (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  intent_key text not null,
  intensity smallint not null,
  note text,
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now(),
  check (intent_key in ('curiosity','connection','desire','private','casual','no_labels')),
  check (intensity between 1 and 5)
);

create index if not exists intents_user_created_idx on public.intents (user_id, created_at desc);
create index if not exists intents_expires_idx on public.intents (expires_at);

-- matches
create table if not exists public.matches (
  id bigserial primary key,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  check (status in ('pending','active','expired','blocked')),
  check (user_a <> user_b)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'matches'
      and column_name = 'user_a'
  ) then
    create unique index if not exists matches_pair_unique
      on public.matches (least(user_a, user_b), greatest(user_a, user_b));
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'matches'
      and column_name = 'user1'
  ) then
    create unique index if not exists matches_pair_unique
      on public.matches (least(user1, user2), greatest(user1, user2));
  end if;
end $$;

-- reveals
create table if not exists public.reveals (
  id bigserial primary key,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  status text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  check (kind in ('profile','media')),
  check (status in ('requested','accepted','rejected','expired'))
);

create index if not exists reveals_to_status_idx on public.reveals (to_user, status);

-- conversations
create table if not exists public.conversations (
  id bigserial primary key,
  match_id bigint unique references public.matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- messages
create table if not exists public.messages (
  id bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  text text,
  image_path text,
  created_at timestamptz not null default now(),
  check (type in ('text','image')),
  check (
    (type = 'text' and text is not null and image_path is null)
    or (type = 'image' and image_path is not null)
  )
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- invites
create table if not exists public.invites (
  id bigserial primary key,
  code text unique not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  consumed_by uuid references public.profiles(id),
  status text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  check (status in ('active','consumed','revoked','expired'))
);

-- subscriptions
create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  check (plan in ('free','premium'))
);

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private_media', 'private_media', false)
on conflict (id) do nothing;

-- Base RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select"
on public.profiles
for select
to authenticated
using (true);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
