insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'report',
  'report',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Citizens upload their own UserReport photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'report'
    and (storage.foldername(name))[1] = 'UserReport'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Citizens view their own UserReport photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'report'
    and (storage.foldername(name))[1] = 'UserReport'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

create policy "Citizens delete their own UserReport photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'report'
    and (storage.foldername(name))[1] = 'UserReport'
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

-- Remove the old bucket's user policies. The old, empty bucket is left in place;
-- Supabase requires bucket deletion to go through its Storage API.
drop policy if exists "Citizens upload their own report photos" on storage.objects;
drop policy if exists "Citizens view their own report photos" on storage.objects;
drop policy if exists "Citizens delete their own report photos" on storage.objects;
