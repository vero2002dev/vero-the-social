-- 009_invite_rewards.sql
-- Invite reward when invited user becomes active within 7 days

create table if not exists public.invite_rewards (
  id bigserial primary key,
  inviter uuid not null,
  invited uuid not null,
  rewarded boolean not null default false,
  created_at timestamptz not null default now(),
  unique(invited)
);

create or replace function public.check_invite_reward(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inviter_id uuid;
  unlock_at timestamptz;
  has_onboarding boolean;
  has_intent boolean;
  has_chat boolean;
begin
  if p_user is null then
    return;
  end if;

  select i.created_by
  into inviter_id
  from public.invite_claims ic
  join public.invites i on i.id = ic.invite_id
  where ic.user_id = p_user;

  if inviter_id is null then
    return;
  end if;

  if exists (
    select 1 from public.invite_rewards
    where invited = p_user and rewarded = true
  ) then
    return;
  end if;

  select min(e.created_at) into unlock_at
  from public.events e
  where e.user_id = p_user and e.name = 'unlock_success';

  if unlock_at is null then
    return;
  end if;

  if unlock_at < now() - interval '7 days' then
    return;
  end if;

  select exists (
    select 1 from public.events e
    where e.user_id = p_user and e.name = 'onboarding_done'
  ) into has_onboarding;

  select exists (
    select 1 from public.events e
    where e.user_id = p_user and e.name = 'intent_set'
  ) into has_intent;

  select exists (
    select 1 from public.events e
    where e.user_id = p_user and e.name = 'chat_send_text'
  ) into has_chat;

  if has_onboarding and has_intent and has_chat then
    insert into public.invite_rewards(inviter, invited, rewarded)
    values (inviter_id, p_user, true)
    on conflict (invited) do update set rewarded = true;

    insert into public.invites(code, created_by, status, expires_at)
    values (
      translate(encode(gen_random_bytes(9),'base64'),'=/+',''),
      inviter_id,
      'active',
      now() + interval '7 days'
    );
  end if;
end;
$$;

create or replace function public.on_event_check_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name = 'chat_send_text' then
    perform public.check_invite_reward(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists events_check_reward on public.events;
create trigger events_check_reward
after insert on public.events
for each row execute function public.on_event_check_reward();

create or replace function public.rpc_user_quality()
returns table(
  accept_rate numeric,
  chat_rate numeric,
  discover_bonus int,
  match_bonus int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  req int;
  acc int;
  chat int;
begin
  uid := public._require_auth();

  select count(*) into req
  from public.events
  where user_id = uid
    and name = 'match_request'
    and created_at >= now() - interval '7 days';

  select count(*) into acc
  from public.events
  where user_id = uid
    and name = 'match_accept'
    and created_at >= now() - interval '7 days';

  select count(*) into chat
  from public.events
  where user_id = uid
    and name = 'chat_send_text'
    and created_at >= now() - interval '7 days';

  accept_rate := case when req = 0 then 0 else round(acc::numeric / req::numeric, 4) end;
  chat_rate := case when acc = 0 then 0 else round(chat::numeric / acc::numeric, 4) end;

  discover_bonus := case when accept_rate > 0.4 then 1 else 0 end;
  match_bonus := case when chat_rate > 0.5 then 1 else 0 end;

  return query select accept_rate, chat_rate, discover_bonus, match_bonus;
end;
$$;

grant execute on function public.rpc_user_quality() to authenticated;
