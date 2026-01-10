-- Migration: Create missing settings table and configure RLS
-- Run this in your Supabase SQL Editor

-- 1. Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('school_start_time', '07:30', 'Jam masuk sekolah (HH:mm)'),
    ('late_penalty_minutes', '5', 'Kelipatan menit keterlambatan untuk denda poin'),
    ('late_penalty_points', '-1', 'Poin yang dideringkan tiap kelipatan menit')
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Admin full settings'
    ) THEN
        CREATE POLICY "Admin full settings" ON public.settings FOR ALL USING (get_my_role() = 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Others read settings'
    ) THEN
        CREATE POLICY "Others read settings" ON public.settings FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
END $$;
