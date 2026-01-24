-- 014_signals.sql
-- Signals: micro-feed privado e efemero

create table if not exists public.signals (
  id bigserial primary key,
  conversation_id bigint not null references public.conversations(id) on delete cascade,
  author uuid not null references public.profiles(id) on delete cascade,
  text text,
  image_path text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists signals_convo_idx on public.signals (conversation_id, created_at desc);

alter table public.signals enable row level security;

drop policy if exists "signals_select_participants" on public.signals;
create policy "signals_select_participants"
on public.signals for select
to authenticated
using (public._can_access_conversation(conversation_id, auth.uid()));

drop policy if exists "signals_insert_author" on public.signals;
create policy "signals_insert_author"
on public.signals for insert
to authenticated
with check (
  author = auth.uid()
  and public._can_access_conversation(conversation_id, auth.uid())
);

create or replace function public.rpc_list_signals(p_conversation bigint)
returns table (
  id bigint,
  author uuid,
  text text,
  image_path text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.author, s.text, s.image_path, s.created_at
  from public.signals s
  where s.conversation_id = p_conversation
    and s.expires_at > now()
  order by s.created_at desc
  limit 10;
$$;

grant execute on function public.rpc_list_signals(bigint) to authenticated;

create or replace function public.rpc_create_signal(
  p_conversation bigint,
  p_text text,
  p_image_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  plan text;
  lim int;
begin
  uid := public._require_not_banned();

  if p_text is null and p_image_path is null then
    raise exception 'Empty signal';
  end if;

  plan := public._get_plan(uid);
  lim := case when plan = 'premium' then 8 else 3 end;

  perform public._rate_limit('signal_create_server', lim, 86400);

  insert into public.signals(
    conversation_id,
    author,
    text,
    image_path,
    expires_at
  ) values (
    p_conversation,
    uid,
    nullif(trim(p_text),''),
    p_image_path,
    now() + interval '24 hours'
  );

  insert into public.events(user_id, name, meta)
  values (uid, 'signal_create', jsonb_build_object('conversation', p_conversation));
end;
$$;

grant execute on function public.rpc_create_signal(bigint,text,text) to authenticated;
