-- Run once if you already applied an older schema.sql (before entries UPDATE + weekly unique index).

create policy "Users can update own entries"
  on entries for update using (auth.uid() = user_id);

create unique index if not exists idx_weekly_summaries_user_week
  on weekly_summaries (user_id, week_start);
