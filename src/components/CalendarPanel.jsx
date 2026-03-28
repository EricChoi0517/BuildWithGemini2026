import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ListMusic } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntriesByDateRange } from '@/lib/supabase';
import { getDayMoodSummary } from '@/lib/entriesHelpers';
import { getMoodColor } from '@/components/MoodDot';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';

/** Month calendar with per-day average mood; used inside Analytics (and legacy redirect). */
export default function CalendarPanel() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      try {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const data = await getEntriesByDateRange(
          user.id,
          start.toISOString(),
          end.toISOString()
        );
        setEntries(data || []);
      } catch (err) {
        console.error('Failed to load calendar entries:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function dotColorForSummary(summary) {
    if (!summary) return null;
    if (summary.avgSentiment != null) return getMoodColor(summary.avgSentiment);
    return '#A8A29E';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 text-echo-text-muted hover:text-echo-text transition-colors rounded-lg hover:bg-echo-surface"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-display text-lg md:text-xl text-echo-text text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          type="button"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 text-echo-text-muted hover:text-echo-text transition-colors rounded-lg hover:bg-echo-surface"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-echo-text-dim text-sm font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const summary = getDayMoodSummary(entries, day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const dotColor = dotColorForSummary(summary);

          return (
            <button
              key={i}
              type="button"
              aria-label={
                summary
                  ? `${format(day, 'MMMM d')}, ${summary.count} recording${summary.count === 1 ? '' : 's'}, average mood`
                  : undefined
              }
              onClick={() => summary && setSelectedDay(day)}
              disabled={!summary}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200
                ${inMonth ? 'text-echo-text' : 'text-echo-text-dim/30'}
                ${today ? 'ring-1 ring-echo-accent/40' : ''}
                ${summary ? 'hover:bg-echo-surface cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={`text-base ${today ? 'font-semibold text-echo-accent' : ''}`}>
                {format(day, 'd')}
              </span>
              {summary && dotColor && (
                <div
                  className="w-2 h-2 rounded-full mt-0.5"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-echo-text-dim text-xs">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month
        </p>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <DaySummarySheet
            key={format(selectedDay, 'yyyy-MM-dd')}
            day={selectedDay}
            entries={entries}
            onClose={() => setSelectedDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DaySummarySheet({ day, entries, onClose }) {
  const summary = getDayMoodSummary(entries, day);
  if (!summary) return null;
  const dateStr = format(day, 'yyyy-MM-dd');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-echo-surface border-t border-echo-border rounded-t-3xl md:rounded-2xl md:border md:shadow-xl p-6 max-h-[70vh] overflow-y-auto"
      >
        <div className="w-10 h-1 bg-echo-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor:
                  summary.avgSentiment != null ? getMoodColor(summary.avgSentiment) : '#A8A29E',
              }}
            />
            <div className="min-w-0">
              <p className="text-echo-text font-medium text-sm">{format(day, 'EEEE, MMM d')}</p>
              <p className="text-echo-text-dim text-xs mt-0.5">
                {summary.count} recording{summary.count === 1 ? '' : 's'} this day
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-echo-text-dim hover:text-echo-text shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-xl border border-echo-border bg-echo-card/50 p-4 mb-5">
          <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Average mood</p>
          {summary.scoredCount > 0 ? (
            <p className="text-echo-text text-sm leading-relaxed">
              Averaged across {summary.scoredCount} session{summary.scoredCount === 1 ? '' : 's'} that have a
              mood score (out of {summary.count} total). The dot matches that average.
            </p>
          ) : (
            <p className="text-echo-text-muted text-sm leading-relaxed">
              No mood scores for these sessions yet. The marker is neutral; use Recorded sessions to read
              transcripts.
            </p>
          )}
        </div>

        <Link
          to={`/sessions?date=${dateStr}`}
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold bg-echo-accent text-white shadow-lg shadow-echo-accent/20 hover:bg-echo-accent/90 transition-colors"
        >
          <ListMusic size={18} />
          View sessions &amp; transcripts
        </Link>
      </motion.div>
    </motion.div>
  );
}
