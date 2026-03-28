import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { getEntriesByDateRange, getWeeklySummaries, saveWeeklySummary } from '@/lib/supabase';
import { generateWeeklySummary } from '@/lib/gemini';

const WEEK_STARTS_ON = 1; // Monday

function weekStartKey(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return format(new Date(value), 'yyyy-MM-dd');
}

/**
 * If the previous ISO week has enough entries and no row yet, generate and persist a summary.
 * Safe to call on every home/analytics load (idempotent).
 */
export async function ensurePastWeekSummary(userId) {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON });
  const targetWeekStart = subWeeks(thisWeekStart, 1);
  const targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: WEEK_STARTS_ON });

  const weekStartStr = format(targetWeekStart, 'yyyy-MM-dd');
  const weekEndStr = format(targetWeekEnd, 'yyyy-MM-dd');

  const summaries = await getWeeklySummaries(userId, 24);
  const already = summaries?.some((s) => weekStartKey(s.week_start) === weekStartStr);
  if (already) return;

  const entries = await getEntriesByDateRange(
    userId,
    targetWeekStart.toISOString(),
    targetWeekEnd.toISOString()
  );

  const minEntries = 3;
  if (!entries?.length || entries.length < minEntries) return;

  const ai = await generateWeeklySummary(entries);
  if (!ai?.summary) return;

  try {
    await saveWeeklySummary({
      user_id: userId,
      week_start: weekStartStr,
      week_end: weekEndStr,
      summary: ai.summary,
      avg_sentiment: typeof ai.avg_sentiment === 'number' ? ai.avg_sentiment : null,
      entry_count: entries.length,
      top_topics: Array.isArray(ai.top_topics) ? ai.top_topics : [],
      emotional_arc: ai.emotional_arc ?? null,
      notable_entries: entries.slice(0, 8).map((e) => e.id),
    });
  } catch (err) {
    // Unique violation if another tab won the race
    if (err?.code === '23505') return;
    throw err;
  }
}
