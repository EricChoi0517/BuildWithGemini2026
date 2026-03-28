-- ============================================
-- EchoJournal Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- Extended user info beyond Supabase auth
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  settings jsonb default '{
    "theme": "dark",
    "notifications_enabled": false,
    "recording_duration": 30,
    "auto_stop": true
  }'::jsonb
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================
-- ENTRIES
-- Core journal entries with transcript + audio features
-- ============================================
create table entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),

  -- Transcript
  transcript text not null,
  duration_seconds real not null,

  -- Acoustic features (extracted client-side)
  energy_level real,          -- 0.0 to 1.0
  speaking_rate real,         -- words per minute
  pause_ratio real,           -- ratio of silence to speech
  pitch_variance real,        -- normalized variance

  -- Gemini extraction
  sentiment_score real,       -- -1.0 (negative) to 1.0 (positive)
  sentiment_label text,       -- 'positive', 'neutral', 'negative'
  entities text[],            -- people, places, things mentioned
  topics text[],              -- extracted themes
  unresolved_threads text[],  -- things mentioned with weight, not revisited
  summary text,               -- one-line summary of entry
  keywords text[],            -- salient words/phrases (distinct from broad topics)
  speaking_tone text,         -- inferred delivery / emotional tone of how they spoke
  facial_affect_summary text, -- visible expression / demeanor from optional webcam stills (Gemini)
  emotion_context_notes text, -- discrepancies (hyperbolic vs sad content, face vs words) + vs prior sessions

  -- Metadata
  is_demo boolean default false,
  demo_persona text           -- 'founder', 'student', 'parent'
);

create index idx_entries_user_date on entries (user_id, created_at desc);
create index idx_entries_sentiment on entries (user_id, sentiment_score);

-- ============================================
-- INSIGHTS
-- Generated insights across multiple entries
-- ============================================
create table insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),

  type text not null,
  -- Types: 'emotional_pattern', 'relationship_map', 'energy_correlation',
  --        'unresolved_thread', 'vocabulary_drift', 'memory_anchor',
  --        'this_time_last_month'

  title text not null,
  body text not null,
  confidence_score real,      -- 0.0 to 1.0
  entry_count integer,        -- how many entries this insight spans
  source_entry_ids uuid[],    -- which entries generated this
  is_read boolean default false,
  dismissed boolean default false
);

create index idx_insights_user on insights (user_id, created_at desc);
create index idx_insights_type on insights (user_id, type);

-- ============================================
-- WEEKLY SUMMARIES
-- ============================================
create table weekly_summaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  week_start date not null,
  week_end date not null,
  created_at timestamptz default now(),

  summary text not null,
  avg_sentiment real,
  entry_count integer,
  top_topics text[],
  emotional_arc text,         -- brief narrative of the week
  notable_entries uuid[]
);

create index idx_weekly_user on weekly_summaries (user_id, week_start desc);

-- One stored summary per user per calendar week (Monday start)
create unique index if not exists idx_weekly_summaries_user_week
  on weekly_summaries (user_id, week_start);

-- ============================================
-- ROW LEVEL SECURITY
-- Users can only access their own data
-- ============================================
alter table profiles enable row level security;
alter table entries enable row level security;
alter table insights enable row level security;
alter table weekly_summaries enable row level security;

-- Profiles
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Entries
create policy "Users can view own entries"
  on entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries"
  on entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries"
  on entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries"
  on entries for delete using (auth.uid() = user_id);

-- Insights
create policy "Users can view own insights"
  on insights for select using (auth.uid() = user_id);
create policy "Users can insert own insights"
  on insights for insert with check (auth.uid() = user_id);
create policy "Users can update own insights"
  on insights for update using (auth.uid() = user_id);

-- Weekly Summaries
create policy "Users can view own summaries"
  on weekly_summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries"
  on weekly_summaries for insert with check (auth.uid() = user_id);
