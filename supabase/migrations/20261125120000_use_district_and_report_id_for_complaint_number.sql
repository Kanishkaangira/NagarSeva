-- New citizen complaint numbers use the district ID and the start of the
-- UserReport UUID, for example: 15-A1B2C3D4.
-- Existing complaint numbers remain unchanged so previously shared IDs stay valid.
ALTER TABLE public."UserReport"
  ALTER COLUMN complaint_number DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.set_user_report_complaint_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.complaint_number :=
    COALESCE(NULLIF(NEW.district_id::text, ''), '00')
    || '-'
    || pg_catalog.upper(
      pg_catalog.substr(
        pg_catalog.replace(NEW.id::text, '-', ''),
        1,
        8
      )
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_report_set_complaint_number
  ON public."UserReport";

CREATE TRIGGER user_report_set_complaint_number
  BEFORE INSERT ON public."UserReport"
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_report_complaint_number();
