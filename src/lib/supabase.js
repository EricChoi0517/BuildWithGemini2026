import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Check .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// ---- Entry Operations ----

export async function saveEntry(entry) {
  const { data, error } = await supabase
    .from('entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEntries(userId, { limit = 30, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getEntriesByDateRange(userId, startDate, endDate) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getEntryCount(userId) {
  const { count, error } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count;
}

export async function deleteEntry(userId, entryId) {
  const { error } = await supabase.from('entries').delete().eq('id', entryId).eq('user_id', userId);

  if (error) throw error;
}

// ---- Insight Operations ----

export async function getInsights(userId, { unreadOnly = false, includeDismissed = false } = {}) {
  let query = supabase
    .from('insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!includeDismissed) {
    query = query.eq('dismissed', false);
  }

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function saveInsight(insight) {
  const { data, error } = await supabase
    .from('insights')
    .insert(insight)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markInsightRead(insightId) {
  const { error } = await supabase
    .from('insights')
    .update({ is_read: true })
    .eq('id', insightId);

  if (error) throw error;
}

export async function dismissInsight(insightId) {
  const { error } = await supabase
    .from('insights')
    .update({ dismissed: true })
    .eq('id', insightId);

  if (error) throw error;
}

// ---- Profile Operations ----

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSettings(userId, settings) {
  const { error } = await supabase
    .from('profiles')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

// ---- Weekly Summary Operations ----

export async function getWeeklySummaries(userId, limit = 4) {
  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function saveWeeklySummary(row) {
  const { data, error } = await supabase
    .from('weekly_summaries')
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId, { display_name }) {
  const patch = { updated_at: new Date().toISOString() };
  if (display_name !== undefined) patch.display_name = display_name;

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);

  if (error) throw error;
}
