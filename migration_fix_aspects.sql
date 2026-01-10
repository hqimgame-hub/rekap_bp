-- Add created_at column to aspects table if it's missing
ALTER TABLE public.aspects 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null;

-- Also checking aspect_rules just in case
ALTER TABLE public.aspect_rules 
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default timezone('utc'::text, now()) not null;
