-- mytoday schema: run once in the Supabase SQL editor.

-- 그날의 파편: words, short sentences, or photos captured during the day.
create table if not exists public.fragments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  content text,
  content_en text,
  image_path text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  constraint fragments_has_body check (content is not null or image_path is not null)
);

create index if not exists fragments_user_day_idx on public.fragments (user_id, day, created_at);

-- 하루 정리: the end-of-day diary/essay, its English version, and speaking attempts.
create table if not exists public.days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  title text,
  body text,
  body_en text,
  speaking jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.fragments enable row level security;
alter table public.days enable row level security;

create policy "own fragments" on public.fragments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own days" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private photo bucket. Objects are stored as <user_id>/<file>.
insert into storage.buckets (id, name, public)
values ('fragments', 'fragments', false)
on conflict (id) do nothing;

create policy "own fragment photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'fragments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fragments' and (storage.foldername(name))[1] = auth.uid()::text);
