insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-report-images',
  'user-report-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Citizens upload their own report photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-report-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Citizens view their own report photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-report-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Citizens delete their own report photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-report-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
