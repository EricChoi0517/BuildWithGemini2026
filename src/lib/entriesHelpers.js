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
