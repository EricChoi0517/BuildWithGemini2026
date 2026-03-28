import { extractInsights } from '@/lib/gemini';
import { saveEntry } from '@/lib/supabase';
import { runPostEntryHeuristics } from '@/lib/insights';

/**
 * Save a journal entry from plain text (no microphone / Live API).
 * Uses Gemini Flash for extraction when VITE_GEMINI_API_KEY is set; otherwise neutral fallbacks from extractInsights.
 */
export async function saveJournalFromText(userId, transcript, durationSeconds = 5) {
  const trimmed = transcript.trim();
  if (!trimmed) throw new Error('Transcript is empty');

  const acoustic = {};
  const insights = await extractInsights(trimmed, acoustic);

  const entry = await saveEntry({
    user_id: userId,
    transcript: trimmed,
    duration_seconds: durationSeconds,
    energy_level: null,
    speaking_rate: null,
    pause_ratio: null,
    pitch_variance: null,
    ...insights,
  });

  runPostEntryHeuristics(userId).catch((err) =>
    console.warn('Post-entry heuristics skipped:', err)
  );

  return entry;
}
