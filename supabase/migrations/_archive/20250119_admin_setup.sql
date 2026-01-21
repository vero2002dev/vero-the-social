alter table public.profiles
  add column if not exists is_admin boolean default false;

alter table public.profiles
  add column if not exists verified_at timestamptz;

alter table public.profiles
  add column if not exists id_doc_path text;

alter table public.profiles
  add column if not exists selfie_path text;
