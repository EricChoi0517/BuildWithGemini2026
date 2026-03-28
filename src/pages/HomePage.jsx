import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntries, getInsights, getProfile, markInsightRead } from '@/lib/supabase';
import { latestEntryForDay } from '@/lib/entriesHelpers';
import { ensurePastWeekSummary } from '@/lib/weeklySummary';
import MoodDot from '@/components/MoodDot';
import { format, subDays, startOfDay, differenceInHours } from 'date-fns';

export default function HomePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [e, i, p] = await Promise.all([
          getEntries(user.id, { limit: 30 }),
          getInsights(user.id, { unreadOnly: true }),
          getProfile(user.id),
        ]);
        setEntries(e || []);
        setInsights(i || []);
        setProfile(p);
        ensurePastWeekSummary(user.id).catch((err) =>
          console.warn('Weekly summary sync skipped:', err)
        );
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || '';
  const greeting = getGreeting();

  // Build 30-day mood grid
  const today = startOfDay(new Date());
  const moodDays = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const entry = latestEntryForDay(entries, date);
    return {
      date,
      score: entry?.sentiment_score ?? null,
      hasEntry: !!entry,
    };
  });

  const lastEntry = entries[0];
  const showWelcomeBack =
    lastEntry && differenceInHours(new Date(), new Date(lastEntry.created_at)) >= 24;

  async function handleInsightOpen(insight) {
    try {
      await markInsightRead(insight.id);
      setInsights((prev) => prev.filter((x) => x.id !== insight.id));
    } catch (err) {
      console.error('Failed to mark insight read:', err);
    }
  }

  const recentEntries = entries.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-8 pb-4 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-echo-text-muted text-sm">{greeting}</p>
        <h1 className="font-display text-2xl text-echo-text mt-1">{displayName}</h1>
      </motion.div>

      {/* Quick Record CTA */}
      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            to="/record"
            className="block p-6 bg-gradient-to-br from-echo-accent/10 to-echo-accent/5 border border-echo-accent/20 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-echo-accent/20">
                <Mic size={20} className="text-echo-accent" />
              </div>
              <div>
                <p className="text-echo-text font-medium">Record your first entry</p>
                <p className="text-echo-text-muted text-sm mt-0.5">
                  Just 30 seconds — say whatever's on your mind.
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ) : null}

      {/* Mood Timeline — 30 days */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <h2 className="text-echo-text-muted text-xs font-medium uppercase tracking-wider">
            Last 30 days
          </h2>
          <div className="flex flex-wrap gap-[6px]">
            {moodDays.map((day, i) => (
              <MoodDot
                key={i}
                score={day.score}
                size={14}
                date={day.date}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Unread Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-echo-text-muted text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} />
            New Insights
          </h2>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight) => (
              <button
                type="button"
                key={insight.id}
                onClick={() => handleInsightOpen(insight)}
                className="w-full text-left p-4 bg-echo-surface border border-echo-border rounded-xl hover:border-echo-accent/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-echo-text text-sm font-medium">{insight.title}</p>
                    <p className="text-echo-text-muted text-xs mt-1 line-clamp-2">{insight.body}</p>
                  </div>
                  {insight.entry_count && (
                    <span className="text-[10px] text-echo-text-dim bg-echo-card px-2 py-0.5 rounded-full ml-3 whitespace-nowrap">
                      {insight.entry_count} entries
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-echo-text-muted text-xs font-medium uppercase tracking-wider">
              Recent Entries
            </h2>
            <Link to="/calendar" className="text-echo-accent text-xs flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>

          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-echo-surface border border-echo-border rounded-xl"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MoodDot score={entry.sentiment_score} size={8} />
                  <span className="text-echo-text-dim text-xs">
                    {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                  </span>
                  <span className="text-echo-text-dim text-xs">
                    {entry.duration_seconds}s
                  </span>
                </div>
                <p className="text-echo-text text-sm leading-relaxed line-clamp-2">
                  {entry.summary || entry.transcript}
                </p>
                {entry.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {entry.topics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-echo-text-dim bg-echo-card px-2 py-0.5 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Welcome back message if returning after absence */}
      {showWelcomeBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          <p className="text-echo-text-dim text-sm">Welcome back.</p>
        </motion.div>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}
