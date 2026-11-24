-- Separate citizen evidence uploads from government resolution photos.
-- Existing `report` objects and bucket are intentionally retained as legacy data.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'user-reports',
    'user-reports',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'govt-resolution',
    'govt-resolution',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Citizens can upload, view, and clean up their own report photos.
DROP POLICY IF EXISTS "Citizens upload their own UserReport photos" ON storage.objects;
CREATE POLICY "Citizens upload their own UserReport photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-reports'
  AND (storage.foldername(name))[1] = 'UserReport'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Citizens view their own UserReport photos" ON storage.objects;
CREATE POLICY "Citizens view their own UserReport photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-reports'
  AND (storage.foldername(name))[1] = 'UserReport'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Citizens delete their own UserReport photos" ON storage.objects;
CREATE POLICY "Citizens delete their own UserReport photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-reports'
  AND (storage.foldername(name))[1] = 'UserReport'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

-- Admins may view citizen photos only when the photo belongs to a report
-- inside their department/district scope.
DROP POLICY IF EXISTS "Admins view scoped UserReport photos" ON storage.objects;
CREATE POLICY "Admins view scoped UserReport photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-reports'
  AND EXISTS (
    SELECT 1
    FROM public."UserReport" AS user_report
    WHERE objects.name = ANY(user_report.image_urls)
      AND public.admin_can_access(user_report.id)
  )
);

-- Keep existing photos readable in the old Report/report bucket while new
-- uploads move to user-reports. The legacy bucket is no longer writable here.
DROP POLICY IF EXISTS "Citizens view legacy Report photos" ON storage.objects;
CREATE POLICY "Citizens view legacy Report photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('Report', 'report')
  AND (storage.foldername(name))[1] = 'UserReport'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
);

DROP POLICY IF EXISTS "Admins view scoped legacy Report photos" ON storage.objects;
CREATE POLICY "Admins view scoped legacy Report photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('Report', 'report')
  AND EXISTS (
    SELECT 1
    FROM public."UserReport" AS user_report
    WHERE objects.name = ANY(user_report.image_urls)
      AND public.admin_can_access(user_report.id)
  )
);

-- Keep complaint rows readable only to their citizen or a scoped admin.
DROP POLICY IF EXISTS "Admins view scoped UserReports" ON public."UserReport";
CREATE POLICY "Admins view scoped UserReports"
ON public."UserReport"
FOR SELECT
TO authenticated
USING (public.admin_can_access(id));

-- Citizens see resolution images only for their own complaint/group. Admins
-- can upload and manage photos only for complaints they are allowed to handle.
DROP POLICY IF EXISTS "Citizens view own resolution photos" ON storage.objects;
CREATE POLICY "Citizens view own resolution photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.owns_report(NULLIF((storage.foldername(name))[2], '')::uuid)
);

DROP POLICY IF EXISTS "Admins view scoped resolution photos" ON storage.objects;
CREATE POLICY "Admins view scoped resolution photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.admin_can_access(NULLIF((storage.foldername(name))[2], '')::uuid)
);

DROP POLICY IF EXISTS "Admins upload scoped resolution photos" ON storage.objects;
CREATE POLICY "Admins upload scoped resolution photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.admin_can_access(NULLIF((storage.foldername(name))[2], '')::uuid)
);

DROP POLICY IF EXISTS "Admins update scoped resolution photos" ON storage.objects;
CREATE POLICY "Admins update scoped resolution photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.admin_can_access(NULLIF((storage.foldername(name))[2], '')::uuid)
)
WITH CHECK (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.admin_can_access(NULLIF((storage.foldername(name))[2], '')::uuid)
);

DROP POLICY IF EXISTS "Admins delete scoped resolution photos" ON storage.objects;
CREATE POLICY "Admins delete scoped resolution photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'govt-resolution'
  AND (storage.foldername(name))[1] = 'GovtReport'
  AND public.admin_can_access(NULLIF((storage.foldername(name))[2], '')::uuid)
);

-- The admin portal stores the paths it uploads in GovtReport.resolution_image_urls.
DROP POLICY IF EXISTS "Admins view scoped GovtReports" ON public."GovtReport";
CREATE POLICY "Admins view scoped GovtReports"
ON public."GovtReport"
FOR SELECT
TO authenticated
USING (public.admin_can_access(report_id));

DROP POLICY IF EXISTS "Admins update scoped GovtReports" ON public."GovtReport";
CREATE POLICY "Admins update scoped GovtReports"
ON public."GovtReport"
FOR UPDATE
TO authenticated
USING (public.admin_can_access(report_id))
WITH CHECK (public.admin_can_access(report_id));
