CREATE TYPE public.report_severity AS ENUM (
  'Low',
  'Moderate',
  'High',
  'Very High',
  'Critical'
);

ALTER TABLE public."GovtReport"
  DROP CONSTRAINT IF EXISTS "GovtReport_severity_check";

ALTER TABLE public."GovtReport"
  ALTER COLUMN severity DROP DEFAULT;

ALTER TABLE public."GovtReport"
  ALTER COLUMN severity TYPE public.report_severity
  USING (
    CASE severity
      WHEN 'Medium' THEN 'Moderate'
      ELSE severity
    END
  )::public.report_severity;

ALTER TABLE public."GovtReport"
  ALTER COLUMN severity SET DEFAULT 'Moderate'::public.report_severity;

ALTER TABLE public."GovtReport"
  ADD COLUMN reporter_count integer NOT NULL DEFAULT 0
    CONSTRAINT govt_report_reporter_count_check CHECK (reporter_count >= 0),
  ADD COLUMN department_confidence numeric(5, 4)
    CONSTRAINT govt_report_department_confidence_check
      CHECK (department_confidence BETWEEN 0 AND 1),
  ADD COLUMN severity_confidence numeric(5, 4)
    CONSTRAINT govt_report_severity_confidence_check
      CHECK (severity_confidence BETWEEN 0 AND 1),
  ADD COLUMN priority_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb
    CONSTRAINT govt_report_priority_breakdown_check
      CHECK (jsonb_typeof(priority_breakdown) = 'object'),
  ADD COLUMN department_model_version text,
  ADD COLUMN severity_model_version text,
  ADD COLUMN priority_model_version text,
  ADD COLUMN priority_calculated_at timestamp with time zone;

ALTER TABLE public."UserReport"
  ADD COLUMN issue_id uuid;

UPDATE public."UserReport" AS user_report
SET issue_id = government_report.report_id
FROM public."GovtReport" AS government_report
WHERE government_report.report_id = user_report.id;

ALTER TABLE public."UserReport"
  ADD CONSTRAINT user_report_issue_id_fkey
  FOREIGN KEY (issue_id)
  REFERENCES public."GovtReport" (report_id)
  ON DELETE SET NULL;

CREATE INDEX user_report_issue_id_idx
  ON public."UserReport" (issue_id);

UPDATE public."GovtReport" AS government_report
SET reporter_count = reporters.reporter_count
FROM (
  SELECT issue_id, count(DISTINCT user_id)::integer AS reporter_count
  FROM public."UserReport"
  WHERE issue_id IS NOT NULL
  GROUP BY issue_id
) AS reporters
WHERE government_report.report_id = reporters.issue_id;

CREATE OR REPLACE FUNCTION public.refresh_govt_report_reporter_count(
  p_issue_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM 1
  FROM public."GovtReport"
  WHERE report_id = p_issue_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public."GovtReport" AS government_report
  SET reporter_count = (
    SELECT count(DISTINCT user_report.user_id)::integer
    FROM public."UserReport" AS user_report
    WHERE user_report.issue_id = p_issue_id
  )
  WHERE government_report.report_id = p_issue_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.maintain_govt_report_reporter_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_issue_id uuid;
  new_issue_id uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_issue_id := OLD.issue_id;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    new_issue_id := NEW.issue_id;
  END IF;

  IF old_issue_id IS NOT NULL THEN
    PERFORM public.refresh_govt_report_reporter_count(old_issue_id);

    IF TG_OP = 'UPDATE'
       AND old_issue_id = OLD.id
       AND new_issue_id IS DISTINCT FROM old_issue_id
       AND NOT EXISTS (
         SELECT 1
         FROM public."UserReport"
         WHERE issue_id = old_issue_id
       ) THEN
      DELETE FROM public."GovtReport"
      WHERE report_id = old_issue_id;
    END IF;
  END IF;

  IF new_issue_id IS NOT NULL
     AND new_issue_id IS DISTINCT FROM old_issue_id THEN
    PERFORM public.refresh_govt_report_reporter_count(new_issue_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER user_report_maintain_issue_reporter_count
  AFTER INSERT OR UPDATE OF issue_id, user_id OR DELETE
  ON public."UserReport"
  FOR EACH ROW
  EXECUTE FUNCTION public.maintain_govt_report_reporter_count();

REVOKE ALL ON FUNCTION public.refresh_govt_report_reporter_count(uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_govt_report_for_user_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public."GovtReport" (report_id, status, citizen_feedback)
  VALUES (NEW.id, NEW.status, NEW.citizen_feedback)
  ON CONFLICT (report_id) DO NOTHING;

  UPDATE public."UserReport"
  SET issue_id = NEW.id
  WHERE id = NEW.id
    AND issue_id IS NULL;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_govt_report_status_to_user_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public."UserReport"
  SET status = NEW.status
  WHERE issue_id = NEW.report_id
    AND status IS DISTINCT FROM NEW.status;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_citizen_feedback_to_govt_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.issue_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public."GovtReport" AS government_report
  SET citizen_feedback = CASE
        WHEN feedback.has_not_fixed THEN 'not_fixed'
        WHEN feedback.reporter_count > 0
          AND feedback.fixed_reporter_count = feedback.reporter_count
          THEN 'fixed'
        ELSE NULL
      END,
      citizen_verification = CASE
        WHEN feedback.has_not_fixed THEN 'Still Exists'
        WHEN feedback.reporter_count > 0
          AND feedback.fixed_reporter_count = feedback.reporter_count
          THEN 'Confirmed'
        ELSE 'Pending'
      END,
      verified_at = CASE
        WHEN NOT feedback.has_not_fixed
          AND feedback.reporter_count > 0
          AND feedback.fixed_reporter_count = feedback.reporter_count
          THEN pg_catalog.now()
        ELSE NULL
      END
  FROM (
    SELECT
      count(DISTINCT user_report.user_id)::integer AS reporter_count,
      count(DISTINCT user_report.user_id)
        FILTER (WHERE user_report.citizen_feedback = 'fixed')::integer
        AS fixed_reporter_count,
      coalesce(
        bool_or(user_report.citizen_feedback = 'not_fixed'),
        false
      ) AS has_not_fixed
    FROM public."UserReport" AS user_report
    WHERE user_report.issue_id = NEW.issue_id
  ) AS feedback
  WHERE government_report.report_id = NEW.issue_id;

  RETURN NEW;
END;
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
        admin_user.role = 'super_admin'
        OR (
          admin_user.role = 'authority_admin'
          AND government_report.department_id = admin_user.department_id
        )
        OR (
          admin_user.role = 'district_officer'
          AND government_report.department_id = admin_user.department_id
          AND government_report.district_id = admin_user.district_id
        )
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.owns_report(p_report uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public."UserReport" AS user_report
    WHERE user_report.user_id = auth.uid()
      AND (
        user_report.id = p_report
        OR user_report.issue_id = p_report
      )
  )
$function$;

REVOKE ALL ON TABLE public."UserReport" FROM anon, authenticated;
GRANT SELECT ON TABLE public."UserReport" TO authenticated;
GRANT INSERT (
  user_id,
  "Issue Type",
  "Description",
  "MoreDetail",
  image_urls,
  latitude,
  longitude,
  location_address
)
ON TABLE public."UserReport"
TO authenticated;
GRANT UPDATE (citizen_feedback)
ON TABLE public."UserReport"
TO authenticated;

REVOKE ALL ON TABLE public."GovtReport" FROM anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public."GovtReport" TO authenticated;
GRANT USAGE ON TYPE public.report_severity TO authenticated, service_role;

COMMENT ON COLUMN public."UserReport".issue_id IS
  'Links this citizen submission to its canonical GovtReport issue.';
COMMENT ON COLUMN public."GovtReport".reporter_count IS
  'Number of distinct citizens whose UserReport rows are linked to this issue.';
COMMENT ON COLUMN public."GovtReport".priority_breakdown IS
  'Explainable priority JSON object with scored factors and human-readable reasons.';
COMMENT ON COLUMN public."GovtReport".department_confidence IS
  'AI department-routing confidence on a 0 to 1 scale.';
COMMENT ON COLUMN public."GovtReport".severity_confidence IS
  'AI severity-classification confidence on a 0 to 1 scale.';
