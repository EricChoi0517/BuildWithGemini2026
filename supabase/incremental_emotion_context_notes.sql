-- Narrative notes: face/voice/word mismatches, hyperbole, vs. prior sessions (run once).
alter table entries add column if not exists emotion_context_notes text;

notify pgrst, 'reload schema';
