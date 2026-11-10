create table if not exists public."GovtReport" (
  report_id uuid primary key
    references public."UserReport" (id) on delete cascade,
  status text not null default 'Reported' check (
    status in ('Reported', 'Assigned', 'In Progress', 'Resolved', 'Reopened', 'Closed')
  ),
  severity text not null default 'Medium' check (
    severity in ('Low', 'Medium', 'High', 'Critical')
  ),
  priority_score integer check (priority_score between 0 and 100),
  department text,
  assigned_to uuid,
  authority_remarks text,
  resolution_note text,
  resolution_image_urls text[] not null default '{}',
  citizen_verification text not null default 'Pending' check (
    citizen_verification in ('Pending', 'Confirmed', 'Still Exists')
  ),
  citizen_feedback text check (citizen_feedback in ('fixed', 'not_fixed')),
  updated_at timestamptz not null default pg_catalog.now(),
  resolved_at timestamptz,
  verified_at timestamptz
);

-- Keep the citizen-facing status capable of reflecting the authority workflow.
alter table public."UserReport"
  drop constraint if exists "UserReport_status_check";
alter table public."UserReport"
  add constraint user_report_status_check
  check (status in ('Reported', 'Assigned', 'In progress', 'In Progress', 'Resolved', 'Reopened', 'Closed'));

create or replace function public.create_govt_report_for_user_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public."GovtReport" (report_id, status, citizen_feedback)
  values (new.id, new.status, new.citizen_feedback)
  on conflict (report_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_govt_report_after_user_report_insert on public."UserReport";
create trigger create_govt_report_after_user_report_insert
  after insert on public."UserReport"
  for each row execute function public.create_govt_report_for_user_report();

-- Backfill a government record for any reports already submitted.
insert into public."GovtReport" (report_id, status, citizen_feedback)
select id, status, citizen_feedback from public."UserReport"
on conflict (report_id) do nothing;

create or replace function public.set_govt_report_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger govt_report_set_updated_at
  before update on public."GovtReport"
  for each row execute function public.set_govt_report_updated_at();

create or replace function public.sync_citizen_feedback_to_govt_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public."GovtReport"
  set citizen_feedback = new.citizen_feedback,
      citizen_verification = case new.citizen_feedback
        when 'fixed' then 'Confirmed'
        when 'not_fixed' then 'Still Exists'
        else 'Pending'
      end,
      verified_at = case when new.citizen_feedback = 'fixed' then pg_catalog.now() else null end
  where report_id = new.id;
  return new;
end;
$$;

create trigger sync_user_report_feedback_to_govt_report
  after update of citizen_feedback on public."UserReport"
  for each row
  when (old.citizen_feedback is distinct from new.citizen_feedback)
  execute function public.sync_citizen_feedback_to_govt_report();

create or replace function public.sync_govt_report_status_to_user_report()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public."UserReport"
  set status = case new.status
        when 'In Progress' then 'In progress'
        else new.status
      end
  where id = new.report_id
    and status is distinct from case new.status
      when 'In Progress' then 'In progress'
      else new.status
    end;
  return new;
end;
$$;

create trigger sync_govt_report_status_to_user_report
  after update of status on public."GovtReport"
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_govt_report_status_to_user_report();

alter table public."GovtReport" enable row level security;
revoke all on public."GovtReport" from anon, authenticated;
grant all on public."GovtReport" to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'GovtReport'
     ) then
    alter publication supabase_realtime add table public."GovtReport";
  end if;
end;
$$;
