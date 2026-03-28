import { isSameDay } from 'date-fns';

/** Most recent entry on the given calendar day (local timezone). */
export function latestEntryForDay(entries, day) {
  let best = null;
  for (const e of entries) {
    if (!isSameDay(new Date(e.created_at), day)) continue;
    if (!best || new Date(e.created_at) > new Date(best.created_at)) best = e;
  }
  return best;
}

/** All entries on the given calendar day (local timezone). */
export function entriesForDay(entries, day) {
  return entries.filter((e) => isSameDay(new Date(e.created_at), day));
}

/**
 * Aggregate mood for a calendar day: average sentiment across sessions that have a score.
 * @returns {null | { count: number, scoredCount: number, avgSentiment: number | null }}
 */
export function getDayMoodSummary(entries, day) {
  const dayEntries = entriesForDay(entries, day);
  if (dayEntries.length === 0) return null;
  const scored = dayEntries.filter(
    (e) => typeof e.sentiment_score === 'number' && !Number.isNaN(e.sentiment_score)
  );
  const avgSentiment =
    scored.length > 0
      ? scored.reduce((sum, e) => sum + e.sentiment_score, 0) / scored.length
      : null;
  return {
    count: dayEntries.length,
    scoredCount: scored.length,
    avgSentiment,
  };
}
