-- Migration: Split 'petugas' into 'petugas_input' and 'petugas_scan'
-- Also ensures 'kepsek' and other roles are correctly handled in RLS.

-- 1. Update Profiles Role Constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'kepsek', 'walas', 'petugas', 'petugas_input', 'petugas_scan'));

-- 2. Migrate existing 'petugas' to 'petugas_input' (default)
UPDATE public.profiles SET role = 'petugas_input' WHERE role = 'petugas';

-- 3. Update RLS Policies for STUDENTS
-- SELECT for Kepsek, Petugas (Input & Scan)
DROP POLICY IF EXISTS "Kepsek Petugas read all students" ON public.students;
CREATE POLICY "Kepsek Petugas read all students" 
ON public.students FOR SELECT 
USING (get_my_role() IN ('kepsek', 'petugas_input', 'petugas_scan'));

-- 4. Update RLS Policies for RECORDS
-- INSERT for Petugas Input & Admin
DROP POLICY IF EXISTS "Petugas insert records" ON public.records;
CREATE POLICY "Petugas insert records" 
ON public.records FOR INSERT 
WITH CHECK (get_my_role() IN ('admin', 'petugas_input', 'petugas_scan')); -- Allow scan too as it creates records

-- READ for Kepsek
DROP POLICY IF EXISTS "Kepsek read all records" ON public.records;
CREATE POLICY "Kepsek read all records" 
ON public.records FOR SELECT 
USING (get_my_role() = 'kepsek');

-- READ for Petugas (own inputs)
DROP POLICY IF EXISTS "Petugas read own inputs" ON public.records;
CREATE POLICY "Petugas read own inputs" 
ON public.records FOR SELECT 
USING (input_by = auth.uid() OR get_my_role() IN ('petugas_input', 'petugas_scan'));

-- 5. Update QR SESSIONS & LOGS
DROP POLICY IF EXISTS "Admin Petugas manage qr" ON public.qr_sessions;
CREATE POLICY "Admin Petugas manage qr" 
ON public.qr_sessions FOR ALL 
USING (get_my_role() IN ('admin', 'petugas_scan'));

DROP POLICY IF EXISTS "Admin Petugas manage logs" ON public.qr_logs;
CREATE POLICY "Admin Petugas manage logs" 
ON public.qr_logs FOR ALL 
USING (get_my_role() IN ('admin', 'petugas_scan'));

-- 6. Helper check (Optional but good)
-- Ensure 'petugas' still works if referenced somewhere, but preferred is the split roles.
