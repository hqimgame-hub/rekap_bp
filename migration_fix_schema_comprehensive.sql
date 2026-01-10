-- Comprehensive Fix for Missing Columns
-- Execute this script in Supabase SQL Editor to ensure all columns exist

-- 1. Ensure 'aspects' table has 'created_at' and 'input_type'
ALTER TABLE public.aspects 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null,
ADD COLUMN IF NOT EXISTS input_type text check (input_type in ('qr', 'manual', 'select')) DEFAULT 'manual';

-- 2. Ensure 'aspect_rules' table has 'name', 'point', 'created_at'
ALTER TABLE public.aspect_rules 
ADD COLUMN IF NOT EXISTS name text not null DEFAULT 'Rule Name',
ADD COLUMN IF NOT EXISTS point integer not null DEFAULT 0,
ADD COLUMN IF NOT EXISTS condition jsonb DEFAULT null,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- 3. In case 'name' was missing, 'aspect_rules' creation might have failed or created partial table.
-- If you see errors about "relation does not exist", uncomment the line below:
-- DROP TABLE IF EXISTS public.aspect_rules;
-- And re-run the creation logic if needed. But ALTER COLUMN is safer for existing data.
