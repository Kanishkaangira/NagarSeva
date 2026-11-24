CREATE TYPE public.admin_role AS ENUM (
  'superadmin',
  'stateadmin',
  'districtadmin'
);

DROP INDEX IF EXISTS public.one_district_officer_per_dept;
DROP INDEX IF EXISTS public.one_authority_admin_per_dept;

ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_scope_check,
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

UPDATE public.admin_users
SET role = CASE role
  WHEN 'super_admin' THEN 'superadmin'
  WHEN 'authority_admin' THEN 'stateadmin'
  WHEN 'district_officer' THEN 'districtadmin'
  ELSE role
END;

ALTER TABLE public.admin_users
  ALTER COLUMN role TYPE public.admin_role
  USING role::text::public.admin_role;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_scope_check CHECK (
    (role = 'superadmin' AND department_id IS NULL AND district_id IS NULL)
    OR (role = 'stateadmin' AND department_id IS NOT NULL AND district_id IS NULL)
    OR (role = 'districtadmin' AND department_id IS NOT NULL AND district_id IS NOT NULL)
  );

CREATE UNIQUE INDEX one_district_officer_per_dept
  ON public.admin_users (department_id, district_id)
  WHERE role = 'districtadmin' AND is_active;

CREATE UNIQUE INDEX one_authority_admin_per_dept
  ON public.admin_users (department_id)
  WHERE role = 'stateadmin' AND is_active;

CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text
  FROM public.admin_users
  WHERE user_id = auth.uid()
    AND is_active
$function$;

CREATE OR REPLACE FUNCTION public.admin_can_access(p_report uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users AS admin_user
    JOIN public."GovtReport" AS government_report
      ON government_report.report_id = p_report
      OR EXISTS (
        SELECT 1
        FROM public."UserReport" AS linked_report
        WHERE linked_report.id = p_report
          AND linked_report.issue_id = government_report.report_id
      )
    WHERE admin_user.user_id = auth.uid()
      AND admin_user.is_active
      AND (
        admin_user.role = 'superadmin'
        OR (
          admin_user.role = 'stateadmin'
          AND government_report.department_id = admin_user.department_id
        )
        OR (
          admin_user.role = 'districtadmin'
          AND government_report.department_id = admin_user.department_id
          AND government_report.district_id = admin_user.district_id
        )
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.guard_govt_report_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  admin_role := public.current_admin_role();

  IF admin_role IS NULL THEN
    IF NEW.severity IS DISTINCT FROM OLD.severity
      OR NEW.priority_score IS DISTINCT FROM OLD.priority_score
      OR NEW.department_id IS DISTINCT FROM OLD.department_id
      OR NEW.district_id IS DISTINCT FROM OLD.district_id
      OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
      OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at
      OR NEW.authority_remarks IS DISTINCT FROM OLD.authority_remarks
      OR NEW.resolution_note IS DISTINCT FROM OLD.resolution_note
      OR NEW.resolution_image_urls IS DISTINCT FROM OLD.resolution_image_urls
      OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at
      OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('Reopened', 'Closed'))
    THEN
      RAISE EXCEPTION 'Citizens cannot change these fields';
    END IF;
  ELSE
    IF NEW.citizen_verification IS DISTINCT FROM OLD.citizen_verification
      OR NEW.citizen_feedback IS DISTINCT FROM OLD.citizen_feedback
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    THEN
      RAISE EXCEPTION 'Admins cannot change citizen verification fields';
    END IF;

    IF admin_role <> 'superadmin'
      AND (NEW.department_id IS DISTINCT FROM OLD.department_id
        OR NEW.district_id IS DISTINCT FROM OLD.district_id)
    THEN
      RAISE EXCEPTION 'Only Super Admin can change department or district';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "super admin reads all admins" ON public.admin_users;
CREATE POLICY "super admin reads all admins"
  ON public.admin_users
  FOR SELECT
  USING (current_admin_role() = 'superadmin');
