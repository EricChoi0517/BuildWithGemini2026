-- Optional webcam-derived facial demeanor summary (run once if entries already exists).
-- Safe to re-run.

alter table entries add column if not exists facial_affect_summary text;

notify pgrst, 'reload schema';
