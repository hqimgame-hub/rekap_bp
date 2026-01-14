-- Migration: Add notes column to records table
-- Run this in your Supabase SQL Editor to fix the schema error

ALTER TABLE public.records ADD COLUMN IF NOT EXISTS notes TEXT;
