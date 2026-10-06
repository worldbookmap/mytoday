-- Switch from per-user email login to a single passcode.
-- Run once in the Supabase SQL editor if you already ran the original schema.sql.
-- Existing fragments, days, and photos are kept.

drop policy if exists "own fragments" on public.fragments;
drop policy if exists "own days" on public.days;
drop policy if exists "own fragment photos" on storage.objects;

drop index if exists public.fragments_user_day_idx;
alter table public.fragments drop column if exists user_id;
create index if not exists fragments_day_idx on public.fragments (day, created_at);

-- If more than one account wrote a summary for the same day, keep the latest.
delete from public.days d
using public.days newer
where d.day = newer.day and d.updated_at < newer.updated_at;

alter table public.days drop constraint if exists days_pkey;
alter table public.days drop column if exists user_id;
alter table public.days add primary key (day);
