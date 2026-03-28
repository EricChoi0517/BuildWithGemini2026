import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntries, getInsights, getProfile, markInsightRead } from '@/lib/supabase';
import { latestEntryForDay } from '@/lib/entriesHelpers';
import { ensurePastWeekSummary } from '@/lib/weeklySummary';
import MoodDot, { getMoodColor } from '@/components/MoodDot';
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

  const scoreDaysCount = moodDays.filter(d => d.score !== null).length;
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

      {/* Mood Trend — Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-echo-text-muted text-xs font-medium uppercase tracking-wider">
          Mood Trend
        </h2>
        <div className="bg-echo-surface border border-echo-border rounded-2xl p-4 overflow-hidden min-h-[120px] flex flex-col justify-center">
          {scoreDaysCount >= 3 ? (
            <SentimentGraph data={moodDays} />
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-echo-text-muted text-xs font-medium italic">
                Record {3 - scoreDaysCount} more {3 - scoreDaysCount === 1 ? 'entry' : 'entries'} to unlock your trend.
              </p>
              <div className="max-w-[120px] mx-auto h-1 bg-echo-border/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-echo-accent transition-all duration-1000"
                  style={{ width: `${(scoreDaysCount / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Empty State / Welcome */}
      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-8"
        >
          <div className="p-8 bg-gradient-to-br from-echo-accent/10 via-echo-surface to-echo-surface border border-echo-accent/20 rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 bg-echo-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <Mic size={32} className="text-echo-accent" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display text-echo-text">Your emotional space</h2>
              <p className="text-echo-text-muted text-sm max-w-xs mx-auto">
                Echo helps you track your journey through voice. Record how you feel, and we'll help you see the patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-echo-surface/50 rounded-xl border border-echo-border/50">
                <p className="text-[10px] text-echo-accent font-bold uppercase tracking-wider mb-1">Step 1</p>
                <p className="text-xs text-echo-text font-medium">Record a 30s check-in</p>
              </div>
              <div className="p-3 bg-echo-surface/50 rounded-xl border border-echo-border/50">
                <p className="text-[10px] text-echo-accent font-bold uppercase tracking-wider mb-1">Step 2</p>
                <p className="text-xs text-echo-text font-medium">Get instant mood insights</p>
              </div>
            </div>

            <Link
              to="/record"
              className="block w-full py-4 bg-echo-accent text-white rounded-2xl font-medium shadow-lg shadow-echo-accent/30 hover:bg-echo-accent/90 transition-all active:scale-[0.98]"
            >
              Start Your First Entry
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 px-2">
            {[
              { label: 'Calm' },
              { label: 'Aware' },
              { label: 'Grounded' }
            ].map((feature, i) => (
              <div key={i} className="text-center py-2 bg-echo-surface/30 rounded-lg border border-echo-border/30">
                <p className="text-[10px] text-echo-text-dim font-medium uppercase tracking-[0.2em]">{feature.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-8"
        >
          <div className="space-y-3">
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
                {entry.speaking_tone && (
                  <p className="text-echo-text-dim text-[10px] mt-1.5 line-clamp-1 italic">
                    {entry.speaking_tone}
                  </p>
                )}
                {entry.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.keywords.slice(0, 5).map((word, i) => (
                      <span
                        key={`k-${i}`}
                        className="text-[9px] text-echo-text-muted border border-echo-border/80 px-1.5 py-0.5 rounded"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
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

      {/* Welcome back message */}
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

function SentimentGraph({ data }) {
  const width = 400;
  const height = 100;
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Filter data to only include days with scores
  const scoreDays = data
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.score !== null);

  if (scoreDays.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-echo-text-dim text-xs py-4 italic">
        Keep recording to see your mood trend.
      </div>
    );
  }

  // Linear scale to map to SVG coordinates
  const getX = (i) => padding + (i / 29) * graphWidth;
  const getY = (s) => padding + graphHeight - ((s + 1) / 2) * graphHeight;

  // Build the SVG path
  const pathData = scoreDays.reduce((acc, point, i) => {
    const x = getX(point.index);
    const y = getY(point.score);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible"
      style={{ filter: 'drop-shadow(0px 2px 4px rgba(124, 108, 255, 0.1))' }}
    >
      {/* Reference lines */}
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" strokeWidth={1} className="text-echo-border opacity-50" strokeDasharray="4 4" />

      {/* The main mood line */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#mood-gradient)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-700"
      />

      {/* Points on the line */}
      {scoreDays.slice(-10).map((point, i) => (
        <circle
          key={i}
          cx={getX(point.index)}
          cy={getY(point.score)}
          r={3}
          fill={getMoodColor(point.score)}
          className="transition-all duration-300"
        />
      ))}

      <defs>
        <linearGradient id="mood-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          {scoreDays.map((point, i) => (
            <stop
              key={i}
              offset={`${(point.index / 29) * 100}%`}
              stopColor={getMoodColor(point.score)}
            />
          ))}
        </linearGradient>
      </defs>
    </svg>
  );
}
