-- 016_profiles_locale.sql
alter table public.profiles
  add column if not exists locale text default 'pt-PT';
