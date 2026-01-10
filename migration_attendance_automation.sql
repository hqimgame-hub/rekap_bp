-- Migration: Add notes and settings for attendance automation

-- 1. Add notes column to records
ALTER TABLE public.records ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('school_start_time', '07:30', 'Jam masuk sekolah (HH:mm)'),
    ('late_penalty_minutes', '5', 'Kelipatan menit keterlambatan untuk denda poin'),
    ('late_penalty_points', '-1', 'Poin yang dideringkan tiap kelipatan menit')
ON CONFLICT (key) DO NOTHING;

-- 4. Ensure "Kehadiran" aspect exists
-- We'll do this in the server action if not found, but good to have a placeholder or seed
