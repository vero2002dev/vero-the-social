-- Step 1B storage policies

-- Avatars (private)
drop policy if exists "avatars_read_auth" on storage.objects;
create policy "avatars_read_auth"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Private media (private)
drop policy if exists "private_media_read_own" on storage.objects;
create policy "private_media_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "private_media_insert_own" on storage.objects;
create policy "private_media_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "private_media_update_own" on storage.objects;
create policy "private_media_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "private_media_delete_own" on storage.objects;
create policy "private_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'private_media'
  and (storage.foldername(name))[1] = 'user'
  and (storage.foldername(name))[2] = auth.uid()::text
);
