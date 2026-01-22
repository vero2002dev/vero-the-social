alter table public.profiles
  add column if not exists intent text;

alter table public.profiles
  drop constraint if exists profiles_intent_check;

alter table public.profiles
  add constraint profiles_intent_check
  check (
    intent in (
      'curiosidade',
      'conexao',
      'desejo',
      'conversa',
      'privado',
      'passageiro'
    )
  );

alter table public.matches
  add column if not exists expires_at timestamptz;

update public.matches
set expires_at = coalesce(expires_at, created_at + interval '48 hours');
