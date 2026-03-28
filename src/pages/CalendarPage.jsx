import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntriesByDateRange } from '@/lib/supabase';
import { latestEntryForDay } from '@/lib/entriesHelpers';
import MoodDot, { getMoodColor } from '@/components/MoodDot';
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

export default function CalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
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
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getEntryForDay(day) {
    return latestEntryForDay(entries, day);
  }

  return (
    <div className="pt-8 pb-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 text-echo-text-muted hover:text-echo-text transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-xl text-echo-text text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h1>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 text-echo-text-muted hover:text-echo-text transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-echo-text-dim text-xs font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const entry = getEntryForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <button
              key={i}
              onClick={() => entry && setSelectedEntry(entry)}
              disabled={!entry}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200
                ${inMonth ? 'text-echo-text' : 'text-echo-text-dim/30'}
                ${today ? 'ring-1 ring-echo-accent/40' : ''}
                ${entry ? 'hover:bg-echo-surface cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={`text-xs ${today ? 'font-semibold text-echo-accent' : ''}`}>
                {format(day, 'd')}
              </span>
              {entry && (
                <div
                  className="w-2 h-2 rounded-full mt-0.5"
                  style={{ backgroundColor: getMoodColor(entry.sentiment_score) }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Entry count */}
      <div className="mt-4 text-center">
        <p className="text-echo-text-dim text-xs">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month
        </p>
      </div>

      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-echo-surface border-t border-echo-border rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-echo-border rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MoodDot score={selectedEntry.sentiment_score} size={12} />
                  <div>
                    <p className="text-echo-text font-medium text-sm">
                      {format(new Date(selectedEntry.created_at), 'EEEE, MMM d')}
                    </p>
                    <p className="text-echo-text-dim text-xs">
                      {format(new Date(selectedEntry.created_at), 'h:mm a')} · {selectedEntry.duration_seconds}s
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 text-echo-text-dim hover:text-echo-text"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary */}
              {selectedEntry.summary && (
                <p className="text-echo-text-muted text-sm mb-4 italic">
                  "{selectedEntry.summary}"
                </p>
              )}

              {/* Transcript */}
              <div className="mb-4">
                <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Transcript</p>
                <p className="text-echo-text text-sm leading-relaxed">
                  {selectedEntry.transcript}
                </p>
              </div>

              {selectedEntry.speaking_tone && (
                <div className="mb-4">
                  <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Tone</p>
                  <p className="text-echo-text-muted text-sm leading-relaxed">{selectedEntry.speaking_tone}</p>
                </div>
              )}

              {selectedEntry.keywords?.length > 0 && (
                <div className="mb-4">
                  <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.keywords.map((word, i) => (
                      <span
                        key={i}
                        className="text-xs bg-echo-card border border-echo-border text-echo-text-muted px-2.5 py-1 rounded-md"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Topics */}
              {selectedEntry.topics?.length > 0 && (
                <div className="mb-4">
                  <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.topics.map((topic, i) => (
                      <span key={i} className="text-xs text-echo-accent bg-echo-accent/10 px-2.5 py-1 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Acoustic Features */}
              <div className="grid grid-cols-2 gap-3">
                <AcousticStat label="Energy" value={selectedEntry.energy_level} />
                <AcousticStat label="Speaking Rate" value={selectedEntry.speaking_rate} suffix=" wpm" />
                <AcousticStat label="Pause Ratio" value={selectedEntry.pause_ratio} />
                <AcousticStat label="Pitch Variance" value={selectedEntry.pitch_variance} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AcousticStat({ label, value, suffix = '' }) {
  if (value == null) return null;
  return (
    <div className="p-3 bg-echo-card rounded-lg">
      <p className="text-echo-text-dim text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-echo-text text-sm font-mono mt-1">
        {typeof value === 'number' ? value.toFixed(2) : value}{suffix}
      </p>
    </div>
  );
}
