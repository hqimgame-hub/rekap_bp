-- Add gender column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('L', 'P'));
