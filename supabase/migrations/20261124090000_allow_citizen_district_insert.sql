-- The district selector submits the selected districts.id on UserReport.
-- Citizens also need to read the active district names for the selector.
GRANT SELECT ON TABLE public.districts TO authenticated;

DROP POLICY IF EXISTS "Citizens can view active districts" ON public.districts;
CREATE POLICY "Citizens can view active districts"
ON public.districts
FOR SELECT
TO authenticated
USING (is_active = true);

-- Grant only this additional UserReport insert column to authenticated citizens.
GRANT INSERT (district_id)
ON TABLE public."UserReport"
TO authenticated;
