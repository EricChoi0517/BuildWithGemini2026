import { getEntries, getInsights, saveInsight } from '@/lib/supabase';

function sameIdSet(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((id, i) => id === sb[i]);
}

/**
 * Client-side pattern checks after a new entry (no Live API).
 * Fire-and-forget from the recorder hook.
 */
export async function runPostEntryHeuristics(userId) {
  const entries = await getEntries(userId, { limit: 12 });
  if (!entries?.length || entries.length < 3) return;

  const chronological = [...entries].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const last3 = chronological.slice(-3);
  const scores = last3.map((e) => e.sentiment_score);
  if (scores.some((s) => s == null || Number.isNaN(s))) return;

  const [s0, s1, s2] = scores;
  if (!(s0 > s1 && s1 > s2)) return;

  const sourceIds = last3.map((e) => e.id);
  const existing = await getInsights(userId, { includeDismissed: true });
  const dup = existing?.some(
    (i) =>
      i.type === 'emotional_pattern' &&
      i.dismissed === false &&
      sameIdSet(i.source_entry_ids, sourceIds)
  );
  if (dup) return;

  await saveInsight({
    user_id: userId,
    type: 'emotional_pattern',
    title: 'Mood has been trending down',
    body: 'Your last three journal entries show sentiment moving steadily downward. It might help to name what changed this week—or talk it through with someone you trust.',
    confidence_score: 0.72,
    entry_count: 3,
    source_entry_ids: sourceIds,
  });
}
