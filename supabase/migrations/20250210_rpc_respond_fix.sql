-- Fix ambiguity in rpc_respond_match

create or replace function public.rpc_respond_match(p_match_id bigint, p_action text)
returns table (
  match_id bigint,
  status text,
  conversation_id bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  col_a text;
  col_b text;
  conv_id bigint;
  allowed int;
begin
  uid := public._require_auth();
  select mc.col_a, mc.col_b into col_a, col_b
  from public._matches_columns() as mc
  limit 1;

  execute format(
    'select 1 from public.matches where id = $1 and (%I = $2 or %I = $2)',
    col_a, col_b
  ) into allowed using p_match_id, uid;

  if allowed is null then
    raise exception 'Not authorized';
  end if;

  if p_action not in ('accept','reject') then
    raise exception 'Invalid action';
  end if;

  if p_action = 'reject' then
    update public.matches set status = 'expired' where id = p_match_id;
    return query select p_match_id, 'expired'::text, null::bigint;
    return;
  end if;

  update public.matches set status = 'active' where id = p_match_id;

  insert into public.conversations(match_id)
  values (p_match_id)
  on conflict (match_id) do nothing;

  select c.id into conv_id from public.conversations c where c.match_id = p_match_id;

  return query select p_match_id, 'active'::text, conv_id;
end;
$$;

grant execute on function public.rpc_respond_match(bigint,text) to authenticated;
