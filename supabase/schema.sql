-- mytoday schema: run once in the Supabase SQL editor for a fresh project.
-- Existing projects created with the email-login schema: run
-- migrations/002_passcode.sql instead.
--
-- The app is single-user and talks to Supabase only from the server with the
-- secret key. RLS stays on with no policies, so the public key can't read anything.

-- 그날의 파편: words, short sentences, or photos captured during the day.
create table if not exists public.fragments (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  content text,
  content_en text,
  image_path text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  constraint fragments_has_body check (content is not null or image_path is not null)
);

create index if not exists fragments_day_idx on public.fragments (day, created_at);

-- 하루 정리: the end-of-day diary/essay, its English version, and speaking attempts.
create table if not exists public.days (
  day date primary key,
  title text,
  body text,
  body_en text,
  speaking jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.fragments enable row level security;
alter table public.days enable row level security;

-- Private photo bucket; the server issues signed upload and view URLs.
insert into storage.buckets (id, name, public)
values ('fragments', 'fragments', false)
on conflict (id) do nothing;
