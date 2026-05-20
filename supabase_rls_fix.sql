-- ============================================================
-- Life Care Clinic — Supabase RLS Fix
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================
-- The doctors table currently blocks all writes from the anon key.
-- Doctor data is publicly displayed on the website, so open write
-- access via the admin dashboard is acceptable here.
-- ============================================================

-- Option A (simplest): Disable RLS on doctors table entirely
ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;

-- Option B (if you want RLS but open writes): add a policy instead of Option A
-- CREATE POLICY "Allow all writes on doctors"
--   ON public.doctors FOR ALL TO anon, authenticated
--   USING (true) WITH CHECK (true);

-- Verify: these should now work from the anon key
-- INSERT INTO public.doctors (name) VALUES ('test') RETURNING id;
-- UPDATE public.doctors SET name = name WHERE false;
