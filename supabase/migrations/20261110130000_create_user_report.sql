-- A profile row is created for each Supabase Auth user so UserReport.user_id
-- can reference profiles.id as requested.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default pg_catalog.now()
);

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_auth_user_insert on auth.users;
create trigger create_profile_after_auth_user_insert
  after insert on auth.users
  for each row execute function public.create_profile_for_auth_user();

-- Backfill profiles for any users that already existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Citizens can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create table if not exists public."UserReport" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  category text not null,
  description text,
  image_urls text[] not null default '{}',
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_address text not null default 'Sector 15, New Delhi',
  created_at timestamptz not null default pg_catalog.now(),
  -- Tracking and citizen feedback fields used by the app's reports screen.
  complaint_number text not null unique
    default ('NS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  status text not null default 'Reported' check (
    status in ('Reported', 'Assigned', 'In progress', 'Resolved')
  ),
  citizen_feedback text check (citizen_feedback in ('fixed', 'not_fixed')),
  updated_at timestamptz not null default pg_catalog.now()
);

create index if not exists user_report_user_created_at_idx
  on public."UserReport" (user_id, created_at desc);

create or replace function public.set_user_report_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger user_report_set_updated_at
  before update on public."UserReport"
  for each row execute function public.set_user_report_updated_at();

alter table public."UserReport" enable row level security;
revoke all on public."UserReport" from anon, authenticated;
grant select on public."UserReport" to authenticated;
grant insert (user_id, title, category, description, image_urls, latitude, longitude, location_address)
  on public."UserReport" to authenticated;
grant update (citizen_feedback) on public."UserReport" to authenticated;

create policy "Citizens can view their own reports"
  on public."UserReport" for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Citizens can create reports for themselves"
  on public."UserReport" for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Citizens can submit feedback on their own reports"
  on public."UserReport" for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'UserReport'
     ) then
    alter publication supabase_realtime add table public."UserReport";
  end if;
end;
$$;
