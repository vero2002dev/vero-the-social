-- 015_legal_and_account_controls.sql
-- Legal acceptance + export + delete request (GDPR-lite)

-- 1) Legal versions (hardcoded for MVP)
create table if not exists public.legal_versions (
  id int primary key,
  terms_version text not null,
  privacy_version text not null,
  updated_at timestamptz not null default now()
);

insert into public.legal_versions (id, terms_version, privacy_version)
values (1, '2026-01-23', '2026-01-23')
on conflict (id) do nothing;

-- 2) Consent records
create table if not exists public.legal_consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  locale text,
  ip text,
  user_agent text
);

alter table public.legal_consents enable row level security;

drop policy if exists "legal_consents_select_own" on public.legal_consents;
create policy "legal_consents_select_own"
on public.legal_consents for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "legal_consents_upsert_own" on public.legal_consents;
create policy "legal_consents_upsert_own"
on public.legal_consents for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "legal_consents_update_own" on public.legal_consents;
create policy "legal_consents_update_own"
on public.legal_consents for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 3) Helper: require latest legal acceptance
create or replace function public._require_legal_acceptance()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  tv text;
  pv text;
  ok boolean;
begin
  uid := public._require_auth();

  select terms_version, privacy_version into tv, pv
  from public.legal_versions
  where id = 1;

  select exists(
    select 1
    from public.legal_consents lc
    where lc.user_id = uid
      and lc.terms_version = tv
      and lc.privacy_version = pv
  ) into ok;

  if not ok then
    raise exception 'Legal acceptance required';
  end if;
end;
$$;

-- 4) Gate helpers (central)
create or replace function public._require_unlocked()
returns uuid
language plpgsql
as $$
declare
  uid uuid;
  ok boolean;
begin
  uid := public._require_auth();
  perform public._require_legal_acceptance();

  select p.unlocked into ok
  from public.profiles p
  where p.id = uid;

  if coalesce(ok,false) = false then
    raise exception 'Account locked: invite required';
  end if;

  return uid;
end;
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
  perform public._require_legal_acceptance();

  if public._is_banned(uid) then
    raise exception 'Account disabled';
  end if;
  return uid;
end;
$$;

-- 5) RPC: accept legal (upsert)
create or replace function public.rpc_accept_legal(p_locale text, p_ip text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  tv text;
  pv text;
begin
  uid := public._require_auth();
  select terms_version, privacy_version into tv, pv from public.legal_versions where id = 1;

  insert into public.legal_consents(user_id, terms_version, privacy_version, locale, ip, user_agent)
  values (uid, tv, pv, p_locale, p_ip, p_user_agent)
  on conflict (user_id) do update
    set terms_version = excluded.terms_version,
        privacy_version = excluded.privacy_version,
        accepted_at = now(),
        locale = excluded.locale,
        ip = excluded.ip,
        user_agent = excluded.user_agent;
end;
$$;

grant execute on function public.rpc_accept_legal(text,text,text) to authenticated;

-- 6) RPC: export my data (limited)
create or replace function public.rpc_export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  out jsonb;
begin
  uid := public._require_not_banned();
  perform public._require_legal_acceptance();

  out := jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = uid),
    'events_last_500', (select jsonb_agg(to_jsonb(e)) from (select * from public.events where user_id=uid order by created_at desc limit 500) e),
    'blocks', (select jsonb_agg(to_jsonb(b)) from public.blocks b where b.blocker = uid),
    'signals_last_200', (select jsonb_agg(to_jsonb(s)) from (select * from public.signals where author=uid order by created_at desc limit 200) s)
  );

  return coalesce(out, '{}'::jsonb);
end;
$$;

grant execute on function public.rpc_export_my_data() to authenticated;

-- 7) Deletion request (optional audit)
create table if not exists public.account_deletion_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "delreq_insert_own" on public.account_deletion_requests;
create policy "delreq_insert_own"
on public.account_deletion_requests for insert
to authenticated
with check (user_id = auth.uid());
