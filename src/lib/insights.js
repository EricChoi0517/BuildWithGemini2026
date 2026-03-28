import { getEntries, getInsights, saveInsight } from '@/lib/supabase';

function sameIdSet(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((id, i) => id === sb[i]);
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'as', 'by', 'with',
  'is', 'it', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'that', 'this', 'was', 'were', 'be',
  'been', 'have', 'has', 'had', 'do', 'did', 'just', 'like', 'really', 'very', 'so', 'not', 'no',
  'if', 'then', 'there', 'here', 'what', 'when', 'how', 'why', 'who', 'some', 'any', 'all', 'can',
  'could', 'would', 'should', 'today', 'thing', 'things', 'something', 'anything', 'maybe', 'think',
  'know', 'feel', 'feeling', 'going', 'went', 'get', 'got', 'out', 'about', 'into', 'up', 'down',
]);

function normalizePhrase(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 48);
}

/**
 * Declining sentiment across last three entries (chronological).
 */
async function runEmotionalDeclineInsight(userId) {
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

/**
 * Same keyword or topic label appears across many recent entries → surface as a trend.
 */
async function runRecurringKeywordInsights(userId) {
  const entries = await getEntries(userId, { limit: 36 });
  if (!entries || entries.length < 4) return;

  const phraseToIds = new Map();

  for (const e of entries) {
    const phrases = new Set();
    for (const k of e.keywords || []) {
      const p = normalizePhrase(k);
      if (p.length >= 3 && !STOPWORDS.has(p)) phrases.add(p);
    }
    for (const t of e.topics || []) {
      const p = normalizePhrase(t);
      if (p.length >= 3 && !STOPWORDS.has(p)) phrases.add(p);
    }
    for (const p of phrases) {
      if (!phraseToIds.has(p)) phraseToIds.set(p, new Set());
      phraseToIds.get(p).add(e.id);
    }
  }

  const candidates = [...phraseToIds.entries()]
    .filter(([, ids]) => ids.size >= 4)
    .sort((a, b) => b[1].size - a[1].size);

  const existing = await getInsights(userId, { includeDismissed: true });
  let created = 0;
  const maxNew = 2;

  for (const [phrase, idSet] of candidates) {
    if (created >= maxNew) break;
    const title = `Recurring theme: “${phrase}”`;
    const dup = existing?.some(
      (i) => i.type === 'recurring_trend' && i.title === title && !i.dismissed
    );
    if (dup) continue;

    const sourceIds = [...idSet].slice(0, 10);
    await saveInsight({
      user_id: userId,
      type: 'recurring_trend',
      title,
      body: `That showed up in ${idSet.size} recent entries. Worth noticing whether it’s draining, neutral, or energizing for you right now.`,
      confidence_score: Math.min(0.92, 0.45 + idSet.size * 0.06),
      entry_count: idSet.size,
      source_entry_ids: sourceIds,
    });
    created += 1;
  }
}

/**
 * Client-side pattern checks after a new entry (no Live API).
 */
export async function runPostEntryHeuristics(userId) {
  await runEmotionalDeclineInsight(userId);
  await runRecurringKeywordInsights(userId);
}
