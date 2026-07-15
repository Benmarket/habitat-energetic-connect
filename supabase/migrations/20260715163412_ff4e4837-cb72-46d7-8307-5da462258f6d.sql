
-- Allow anon to update first_name/last_name on a lead they just created (within 15 min, still with placeholder name)
CREATE POLICY "Anon can complete recent lead name"
ON public.leads
FOR UPDATE
TO anon, authenticated
USING (
  first_name = 'Prospect'
  AND last_name = 'Solaire'
  AND created_at > now() - interval '15 minutes'
)
WITH CHECK (
  created_at > now() - interval '15 minutes'
);

GRANT UPDATE (first_name, last_name) ON public.leads TO anon, authenticated;
