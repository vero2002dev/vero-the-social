-- 004_storage_media_gate.sql
-- Storage: private_media access for conversation participants
-- Only if there is an accepted 'media' reveal between matched users.

create or replace function public._media_reveal_accepted_for_conversation(p_conversation_id bigint)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid;
  a uuid;
  b uuid;
  col_a text;
  col_b text;
  sql text;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  select col_a, col_b
    into col_a, col_b
  from public._matches_columns()
  limit 1;

  sql := format(
    'select m.%I, m.%I
       from public.conversations c
       join public.matches m on m.id = c.match_id
      where c.id = $1
        and m.status = ''active''',
    col_a, col_b
  );

  execute sql using p_conversation_id into a, b;

  if a is null or b is null then
    return false;
  end if;

  if not (uid = a or uid = b) then
    return false;
  end if;

  if exists (
    select 1
      from public.reveals r
     where r.kind = 'media'
       and r.status = 'accepted'
       and (
         (r.from_user = a and r.to_user = b)
         or
         (r.from_user = b and r.to_user = a)
       )
  ) then
    return true;
  end if;

  return false;
end;
$$;

drop policy if exists "private_media_read_own" on storage.objects;
drop policy if exists "private_media_insert_own" on storage.objects;
drop policy if exists "private_media_update_own" on storage.objects;
drop policy if exists "private_media_delete_own" on storage.objects;

create policy "private_media_read_owner_or_revealed_participant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private_media'
  and (
    (
      (storage.foldername(name))[1] = 'user'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or
    (
      (storage.foldername(name))[1] = 'user'
      and (storage.foldername(name))[3] = 'convo'
      and public._media_reveal_accepted_for_conversation(((storage.foldername(name))[4])::bigint)
    )
  )
);

create policy "private_media_insert_owner_only_when_revealed"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
  and (storage.foldername(name))[3] = 'convo'
  and public._media_reveal_accepted_for_conversation(((storage.foldername(name))[4])::bigint)
);

drop policy if exists "private_media_update_owner" on storage.objects;
create policy "private_media_update_owner"
on storage.objects for update
to authenticated
using (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (false);

create policy "private_media_delete_owner"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);
