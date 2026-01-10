-- Refinement for Row Level Security (RLS)
-- Target: Ensure Walas only sees their own class data and Kepsek sees everything but read-only.

-- 1. Reset existing problematic policies
DROP POLICY IF EXISTS "Walas read own class students" ON students;
DROP POLICY IF EXISTS "Walas read class records" ON records;
DROP POLICY IF EXISTS "Kepsek read all records" ON records;
DROP POLICY IF EXISTS "Kepsek Petugas read all students" ON students;

-- 2. STUDENTS Table
-- Petugas & Kepsek: Read All
CREATE POLICY "Kepsek Petugas read all students" 
ON students FOR SELECT 
USING (get_my_role() IN ('kepsek', 'petugas'));

-- Walas: Read Only Their Class
CREATE POLICY "Walas read own class students" 
ON students FOR SELECT 
USING (get_my_role() = 'walas' AND class_id = get_my_class_id());


-- 3. RECORDS Table
-- Kepsek: Read All
CREATE POLICY "Kepsek read all records" 
ON records FOR SELECT 
USING (get_my_role() = 'kepsek');

-- Walas: Read Only Their Class Records
CREATE POLICY "Walas read class records" 
ON records FOR SELECT 
USING (get_my_role() = 'walas' AND class_id = get_my_class_id());


-- 4. PROFILES Table (Optional but good for privacy)
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read profiles in same class" 
ON profiles FOR SELECT 
USING (
    auth.uid() = id OR 
    get_my_role() IN ('admin', 'kepsek') OR
    (get_my_role() = 'walas' AND class_id = get_my_class_id())
);

-- 5. ASPEK & RULES (Already good, but ensuring Kepsek/Walas/Petugas can read)
-- "Others view aspects" and "Others view rules" already allow authenticated users to read.
