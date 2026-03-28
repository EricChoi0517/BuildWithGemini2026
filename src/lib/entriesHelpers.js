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

/** @returns {Record<string, number> | null} */
export function parseEmotionPercentages(entry) {
  const raw = entry?.emotion_context_notes;
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return null;
  try {
    const o = JSON.parse(raw);
    if (typeof o === 'object' && o !== null && !Array.isArray(o)) return o;
  } catch {
    /* prose-only context */
  }
  return null;
}

/**
 * One entry’s percentage for a Gemini emotion key (case-insensitive), 0–100 or null.
 */
export function getEmotionValueForEntry(entry, emotionKey) {
  const o = parseEmotionPercentages(entry);
  if (!o) return null;
  const found = Object.keys(o).find((k) => k.toLowerCase() === emotionKey.toLowerCase());
  if (found == null) return null;
  const n = Number(o[found]);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

/**
 * Average of a given emotion % across all sessions that day that include that field.
 * @returns {number | null}
 */
export function getDayEmotionAverage(entries, day, emotionKey) {
  const dayEntries = entriesForDay(entries, day);
  if (dayEntries.length === 0) return null;
  const vals = [];
  for (const e of dayEntries) {
    const v = getEmotionValueForEntry(e, emotionKey);
    if (v != null) vals.push(v);
  }
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
