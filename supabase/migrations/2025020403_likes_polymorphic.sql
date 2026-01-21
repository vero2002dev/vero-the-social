alter table public.likes
  drop constraint if exists likes_check;

alter table public.likes
  alter column liked_id drop not null;

alter table public.likes
  alter column post_id drop not null;

alter table public.likes
  add constraint likes_check
  check (
    (post_id is not null and liked_id is null) or
    (post_id is null and liked_id is not null)
  );
