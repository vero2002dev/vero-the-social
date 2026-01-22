-- Patch to align with Step 1A spec (safe for existing schema)

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles updated_at
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- subscriptions updated_at + created_at
alter table public.subscriptions
  add column if not exists created_at timestamptz not null default now();

alter table public.subscriptions
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- handle_new_user + trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'user_' || replace(new.id::text, '-', '')::text,
    coalesce(new.raw_user_meta_data->>'display_name', null)
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- matches generated columns (support user_a/user_b or user1/user2)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'matches' and column_name = 'status'
    ) then
      execute $sql$
        create policy messages_insert_participants
        on public.messages for insert
        to authenticated
        with check (
          sender_id = auth.uid()
          and exists (
            select 1
            from public.conversations c
            join public.matches m on m.id = c.match_id
            where c.id = messages.conversation_id
              and (m.user_a = auth.uid() or m.user_b = auth.uid())
              and m.status = 'active'
          )
        )
      $sql$;
    else
      execute $sql$
        create policy messages_insert_participants
        on public.messages for insert
        to authenticated
        with check (
          sender_id = auth.uid()
          and exists (
            select 1
            from public.conversations c
            join public.matches m on m.id = c.match_id
            where c.id = messages.conversation_id
              and (m.user_a = auth.uid() or m.user_b = auth.uid())
          )
        )
      $sql$;
    end if;
    alter table public.matches
      add column if not exists user_min uuid generated always as (least(user_a, user_b)) stored;
    alter table public.matches
      add column if not exists user_max uuid generated always as (greatest(user_a, user_b)) stored;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1'
  ) then
    alter table public.matches
      add column if not exists user_min uuid generated always as (least(user1, user2)) stored;
    alter table public.matches
      add column if not exists user_max uuid generated always as (greatest(user1, user2)) stored;
  end if;
end $$;

create unique index if not exists matches_unique_pair_idx on public.matches (user_min, user_max);
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    create index if not exists matches_user_a_idx on public.matches (user_a);
    create index if not exists matches_user_b_idx on public.matches (user_b);
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1'
  ) then
    create index if not exists matches_user_a_idx on public.matches (user1);
    create index if not exists matches_user_b_idx on public.matches (user2);
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'status'
  ) then
    create index if not exists matches_status_idx on public.matches (status);
  end if;
end $$;

-- RLS enable + base policies (idempotent)
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.intents enable row level security;
alter table public.matches enable row level security;
alter table public.reveals enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.invites enable row level security;

drop policy if exists profiles_select_auth on public.profiles;
create policy profiles_select_auth
on public.profiles for select
to authenticated
using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists subscriptions_update_own on public.subscriptions;
create policy subscriptions_update_own
on public.subscriptions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists intents_crud_own on public.intents;
create policy intents_crud_own
on public.intents for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  drop policy if exists matches_select_participants on public.matches;
  drop policy if exists matches_update_participants on public.matches;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    execute $sql$
      create policy matches_select_participants
      on public.matches for select
      to authenticated
      using (user_a = auth.uid() or user_b = auth.uid())
    $sql$;

    execute $sql$
      create policy matches_update_participants
      on public.matches for update
      to authenticated
      using (user_a = auth.uid() or user_b = auth.uid())
      with check (user_a = auth.uid() or user_b = auth.uid())
    $sql$;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1'
  ) then
    execute $sql$
      create policy matches_select_participants
      on public.matches for select
      to authenticated
      using (user1 = auth.uid() or user2 = auth.uid())
    $sql$;

    execute $sql$
      create policy matches_update_participants
      on public.matches for update
      to authenticated
      using (user1 = auth.uid() or user2 = auth.uid())
      with check (user1 = auth.uid() or user2 = auth.uid())
    $sql$;
  end if;
end $$;

drop policy if exists reveals_select_participants on public.reveals;
create policy reveals_select_participants
on public.reveals for select
to authenticated
using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists reveals_insert_from_user on public.reveals;
create policy reveals_insert_from_user
on public.reveals for insert
to authenticated
with check (from_user = auth.uid());

drop policy if exists reveals_update_participants on public.reveals;
create policy reveals_update_participants
on public.reveals for update
to authenticated
using (from_user = auth.uid() or to_user = auth.uid())
with check (from_user = auth.uid() or to_user = auth.uid());

do $$
begin
  drop policy if exists conversations_select_participants on public.conversations;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    execute $sql$
      create policy conversations_select_participants
      on public.conversations for select
      to authenticated
      using (
        exists (
          select 1 from public.matches m
          where m.id = conversations.match_id
            and (m.user_a = auth.uid() or m.user_b = auth.uid())
        )
      )
    $sql$;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1'
  ) then
    execute $sql$
      create policy conversations_select_participants
      on public.conversations for select
      to authenticated
      using (
        exists (
          select 1 from public.matches m
          where m.id = conversations.match_id
            and (m.user1 = auth.uid() or m.user2 = auth.uid())
        )
      )
    $sql$;
  end if;
end $$;

do $$
begin
  drop policy if exists messages_select_participants on public.messages;
  drop policy if exists messages_insert_participants on public.messages;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user_a'
  ) then
    execute $sql$
      create policy messages_select_participants
      on public.messages for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversations c
          join public.matches m on m.id = c.match_id
          where c.id = messages.conversation_id
            and (m.user_a = auth.uid() or m.user_b = auth.uid())
        )
      )
    $sql$;

  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'matches' and column_name = 'user1'
  ) then
    execute $sql$
      create policy messages_select_participants
      on public.messages for select
      to authenticated
      using (
        exists (
          select 1
          from public.conversations c
          join public.matches m on m.id = c.match_id
          where c.id = messages.conversation_id
            and (m.user1 = auth.uid() or m.user2 = auth.uid())
        )
      )
    $sql$;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'matches' and column_name = 'status'
    ) then
      execute $sql$
        create policy messages_insert_participants
        on public.messages for insert
        to authenticated
        with check (
          sender_id = auth.uid()
          and exists (
            select 1
            from public.conversations c
            join public.matches m on m.id = c.match_id
            where c.id = messages.conversation_id
              and (m.user1 = auth.uid() or m.user2 = auth.uid())
              and m.status = 'active'
          )
        )
      $sql$;
    else
      execute $sql$
        create policy messages_insert_participants
        on public.messages for insert
        to authenticated
        with check (
          sender_id = auth.uid()
          and exists (
            select 1
            from public.conversations c
            join public.matches m on m.id = c.match_id
            where c.id = messages.conversation_id
              and (m.user1 = auth.uid() or m.user2 = auth.uid())
          )
        )
      $sql$;
    end if;
  end if;
end $$;

drop policy if exists invites_select_creator on public.invites;
create policy invites_select_creator
on public.invites for select
to authenticated
using (created_by = auth.uid());

drop policy if exists invites_insert_creator on public.invites;
create policy invites_insert_creator
on public.invites for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists invites_update_creator on public.invites;
create policy invites_update_creator
on public.invites for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());
