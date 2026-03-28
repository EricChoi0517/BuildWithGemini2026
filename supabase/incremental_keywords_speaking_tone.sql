-- Add per-entry keywords + speaking tone (run once if entries table already exists).
-- Fixes PostgREST PGRST204: "Could not find the 'keywords' column of 'entries' in the schema cache"
-- Supabase Dashboard → SQL Editor → paste → Run. Safe to re-run (IF NOT EXISTS).

alter table entries add column if not exists keywords text[];
alter table entries add column if not exists speaking_tone text;

notify pgrst, 'reload schema';
