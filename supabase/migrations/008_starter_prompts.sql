-- 008_starter_prompts.sql
-- Starter prompts + RPC to fetch prompts for a conversation

create table if not exists public.starter_prompts (
  id bigserial primary key,
  intent_key text not null,
  text text not null,
  active boolean not null default true
);

insert into public.starter_prompts (intent_key, text)
values
('curiosity', 'O que te fez aceitar este match?'),
('curiosity', 'Ha quanto tempo andas curioso(a) sobre isto?'),
('connection', 'O que valorizas mais numa conversa a dois?'),
('connection', 'O que te faz sentir ouvido(a)?'),
('desire', 'O que te da mais tensao: silencio ou provocacao?'),
('desire', 'Preferes comecar devagar ou direto?'),
('casual', 'O que te apetece hoje, sem planos longos?'),
('no_labels', 'O que te atrai sem precisares de explicar?')
on conflict do nothing;

create or replace function public.rpc_starter_prompts_for_conversation(p_conversation_id bigint)
returns table(id bigint, text text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  col_a text;
  col_b text;
  other_id uuid;
  intent text;
  sql text;
begin
  uid := public._require_auth();

  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  sql := format(
    'select case when m.%I = $1 then m.%I else m.%I end
     from public.conversations c
     join public.matches m on m.id = c.match_id
     where c.id = $2 and m.status = ''active''',
    col_a, col_b, col_a
  );
  execute sql into other_id using uid, p_conversation_id;

  if other_id is null then
    return;
  end if;

  select i.intent_key into intent
  from public.intents i
  where i.user_id = other_id
    and i.expires_at > now()
  order by i.created_at desc
  limit 1;

  intent := coalesce(intent, 'no_labels');

  return query
  select sp.id, sp.text
  from public.starter_prompts sp
  where sp.intent_key = intent
    and sp.active = true
  order by random()
  limit 3;
end;
$$;

grant execute on function public.rpc_starter_prompts_for_conversation(bigint) to authenticated;
