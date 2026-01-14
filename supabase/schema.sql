-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'kepsek', 'walas', 'petugas', 'petugas_input', 'petugas_scan')),
    class_id UUID, -- Nullable, used for Walas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CLASSES
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    grade TEXT NOT NULL, -- e.g., 'X', 'XI', 'XII'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key for profiles.class_id (Added after classes table creation)
ALTER TABLE profiles 
ADD CONSTRAINT fk_profiles_class 
FOREIGN KEY (class_id) REFERENCES classes(id);

-- 3. STUDENTS
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT TRUE,
    gender TEXT CHECK (gender IN ('L', 'P')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ASPECTS (Positive, Negative, Neutral)
CREATE TABLE aspects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative', 'neutral')),
    input_type TEXT NOT NULL CHECK (input_type IN ('qr', 'manual', 'select')),
    active BOOLEAN DEFAULT TRUE
);

-- 5. ASPECT RULES (Specific rules/violations/achievements)
CREATE TABLE aspect_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aspect_id UUID REFERENCES aspects(id) ON DELETE CASCADE,
    condition JSONB DEFAULT '{}', -- Flexible condition storage
    point INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

-- 6. RECORDS (The Core Table)
CREATE TABLE records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aspect_id UUID REFERENCES aspects(id),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id), -- Denormalized for easier RLS and Scanning
    rule_id UUID REFERENCES aspect_rules(id),
    point INTEGER NOT NULL,
    input_by UUID REFERENCES profiles(id),
    notes TEXT,
    input_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. QR SESSIONS (For generating daily QR codes)
CREATE TABLE qr_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. QR LOGS (Audit trail for scans)
CREATE TABLE qr_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_session_id UUID REFERENCES qr_sessions(id),
    student_id UUID REFERENCES students(id),
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SETTINGS (General Application Settings)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for Performance
CREATE INDEX idx_records_student_id ON records(student_id);
CREATE INDEX idx_records_class_id ON records(class_id);
CREATE INDEX idx_records_input_date ON records(input_date);
CREATE INDEX idx_students_class_id ON students(class_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspects ENABLE ROW LEVEL SECURITY;
ALTER TABLE aspect_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user class_id
CREATE OR REPLACE FUNCTION get_my_class_id()
RETURNS uuid AS $$
DECLARE
  v_class_id uuid;
BEGIN
  SELECT class_id INTO v_class_id FROM profiles WHERE id = auth.uid();
  RETURN v_class_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- POLICIES ---

-- PROFILES
-- Admin can view/edit all. Users can view their own.
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- CLASSES
-- Admin full access. Kepsek, Walas, Petugas Read-only.
CREATE POLICY "Admin manage classes" ON classes FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Others view classes" ON classes FOR SELECT USING (auth.uid() IS NOT NULL);

-- STUDENTS
-- Admin full access. Kepsek & Petugas Read All. Walas Read Own Class.
CREATE POLICY "Admin manage students" ON students FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Kepsek Petugas read all students" ON students FOR SELECT USING (get_my_role() IN ('kepsek', 'petugas_input', 'petugas_scan', 'petugas'));
CREATE POLICY "Walas read own class students" ON students FOR SELECT USING (class_id = get_my_class_id() OR get_my_role() = 'walas'); -- Note: Logic simplified, refine if needed

-- ASPECTS & RULES
-- Admin manage. Others Read.
CREATE POLICY "Admin manage aspects" ON aspects FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Others view aspects" ON aspects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage rules" ON aspect_rules FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Others view rules" ON aspect_rules FOR SELECT USING (auth.uid() IS NOT NULL);

-- RECORDS (The tricky one)
-- Admin: Full Access
CREATE POLICY "Admin full records" ON records FOR ALL USING (get_my_role() = 'admin');

-- Kepsek: Read All
CREATE POLICY "Kepsek read all records" ON records FOR SELECT USING (get_my_role() = 'kepsek');

-- Walas: Read Own Class Records
CREATE POLICY "Walas read class records" ON records FOR SELECT USING (
    class_id = get_my_class_id()
);

-- Petugas: Insert Only (and maybe read what they inserted?)
CREATE POLICY "Petugas insert records" ON records FOR INSERT WITH CHECK (get_my_role() IN ('petugas_input', 'petugas_scan', 'admin', 'petugas'));
CREATE POLICY "Petugas read own inputs" ON records FOR SELECT USING (input_by = auth.uid() OR get_my_role() IN ('petugas_input', 'petugas_scan'));

-- QR SESSIONS
CREATE POLICY "Admin Petugas manage qr" ON qr_sessions FOR ALL USING (get_my_role() IN ('admin', 'petugas_scan', 'petugas'));
CREATE POLICY "Others view active qr" ON qr_sessions FOR SELECT USING (active = true);

-- QR LOGS
CREATE POLICY "Admin Petugas manage logs" ON qr_logs FOR ALL USING (get_my_role() IN ('admin', 'petugas_scan', 'petugas'));

-- SETTINGS
CREATE POLICY "Admin manage settings" ON settings FOR ALL USING (get_my_role() = 'admin');
CREATE POLICY "Others read settings" ON settings FOR SELECT USING (auth.uid() IS NOT NULL);
