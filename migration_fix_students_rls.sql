-- Fix RLS for Students Table
-- This migration ensures Admin has full access to the students table for bulk operations.

-- 1. Ensure RLS is enabled
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic or incomplete policies for admin if any
-- Note: Using common names identified from previous migrations/schema
DROP POLICY IF EXISTS "Admin manage students" ON public.students;
DROP POLICY IF EXISTS "Admin full access students" ON public.students;

-- 3. Create comprehensive Admin policy
CREATE POLICY "Admin full access students" 
ON public.students 
FOR ALL 
TO authenticated 
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- 4. Verify other roles (Kepsek, Petugas, Walas) still have their SELECT access
-- These were handled in migration_rls_refinement.sql, but we ensure they aren't blocked.
-- SELECT for Kepsek & Petugas (All)
-- SELECT for Walas (Own Class)
