-- 011_search.sql
-- Username search with intent context (limited)

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
