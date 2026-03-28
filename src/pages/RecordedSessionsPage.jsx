import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, ListMusic } from 'lucide-react';
import { format, isSameDay, parseISO, isValid } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { getEntries, deleteEntry } from '@/lib/supabase';
import { getMoodColor } from '@/components/MoodDot';

const ENTRY_LIMIT = 200;

export default function RecordedSessionsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFilter = searchParams.get('date');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const parsedFilterDate = useMemo(() => {
    if (!dateFilter) return null;
    const d = parseISO(`${dateFilter}T12:00:00`);
    return isValid(d) ? d : null;
  }, [dateFilter]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await getEntries(user.id, { limit: ENTRY_LIMIT });
        if (!cancelled) setEntries(data || []);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        if (!cancelled) setError(err.message || 'Could not load recordings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredEntries = useMemo(() => {
    if (!parsedFilterDate) return entries;
    return entries.filter((e) => isSameDay(new Date(e.created_at), parsedFilterDate));
  }, [entries, parsedFilterDate]);

  const displayList = parsedFilterDate ? filteredEntries : entries;

  async function handleDelete(entryId) {
    if (!user) return;
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    setDeletingId(entryId);
    setError('');
    try {
      await deleteEntry(user.id, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      setExpandedId((id) => (id === entryId ? null : id));
    } catch (err) {
      setError(err.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-2 pb-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-echo-text flex items-center gap-2">
            <ListMusic className="w-7 h-7 text-echo-accent shrink-0 md:w-8 md:h-8" strokeWidth={1.75} />
            Recorded sessions
          </h1>
          <p className="text-echo-text-muted text-sm mt-1 max-w-xl">
            Open any session to read the full transcript. Remove recordings you don&apos;t want to keep.
          </p>
        </div>
        <Link
          to="/analytics?tab=calendar"
          className="text-sm text-echo-accent font-medium hover:underline shrink-0"
        >
          Back to calendar
        </Link>
      </header>

      {parsedFilterDate && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-echo-border bg-echo-surface px-4 py-3 text-sm">
          <span className="text-echo-text-muted">Showing</span>
          <span className="text-echo-text font-medium">{format(parsedFilterDate, 'EEEE, MMM d, yyyy')}</span>
          <button
            type="button"
            onClick={() => {
              setSearchParams({});
            }}
            className="ml-auto text-echo-accent text-xs font-medium hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {error && (
        <p className="text-echo-red text-sm text-center bg-echo-red/5 border border-echo-red/20 rounded-lg py-2 px-3">
          {error}
        </p>
      )}

      {displayList.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-echo-border bg-echo-surface/50">
          <p className="text-echo-text-muted text-sm">
            {parsedFilterDate ? 'No sessions on this day.' : 'No recordings yet.'}
          </p>
          <Link to="/record" className="inline-block mt-4 text-echo-accent text-sm font-medium hover:underline">
            Record something
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {displayList.map((entry) => {
            const open = expandedId === entry.id;
            return (
              <li key={entry.id}>
                <motion.div
                  layout
                  className="rounded-xl border border-echo-border bg-echo-surface overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : entry.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-echo-card/40 transition-colors"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: getMoodColor(entry.sentiment_score),
                        opacity: entry.sentiment_score != null ? 1 : 0.35,
                      }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-echo-text text-sm font-medium truncate">
                        {format(new Date(entry.created_at), 'EEE, MMM d · h:mm a')}
                      </p>
                      <p className="text-echo-text-dim text-xs mt-0.5">
                        {entry.duration_seconds != null ? `${Math.round(entry.duration_seconds)}s` : '—'}
                        {entry.summary ? ` · ${entry.summary}` : ''}
                      </p>
                    </div>
                    {open ? <ChevronUp size={18} className="text-echo-text-dim shrink-0" /> : <ChevronDown size={18} className="text-echo-text-dim shrink-0" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-echo-border/80 space-y-4">
                          <div>
                            <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-2">Transcript</p>
                            <p className="text-echo-text text-sm leading-relaxed whitespace-pre-wrap">
                              {entry.transcript || '—'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(entry.id)}
                              disabled={deletingId === entry.id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-echo-red bg-echo-red/5 border border-echo-red/20 hover:bg-echo-red/10 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                              {deletingId === entry.id ? 'Deleting…' : 'Delete recording'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </li>
            );
          })}
        </ul>
      )}

      {entries.length >= ENTRY_LIMIT && (
        <p className="text-center text-echo-text-dim text-xs">
          Showing your {ENTRY_LIMIT} most recent sessions.
        </p>
      )}
    </div>
  );
}
