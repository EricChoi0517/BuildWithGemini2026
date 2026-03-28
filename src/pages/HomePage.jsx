import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getEntries, getInsights, getProfile, markInsightRead } from '@/lib/supabase';
import {
  getDayMoodSummary,
  getDayEmotionAverage,
  entriesForDay,
  parseEmotionPercentages,
} from '@/lib/entriesHelpers';
import {
  TREND_METRICS,
  TREND_METRIC_STORAGE_KEY,
  getTrendMetricById,
} from '@/lib/trendMetrics';
import TrendChart from '@/components/TrendChart';
import { ensurePastWeekSummary } from '@/lib/weeklySummary';
import { readGuestEntries } from '@/lib/guestCookies';
import MoodDot, { getMoodColor } from '@/components/MoodDot';
import { format, subDays, startOfDay, differenceInHours } from 'date-fns';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendMetricId, setTrendMetricId] = useState(() => {
    try {
      const s = localStorage.getItem(TREND_METRIC_STORAGE_KEY);
      if (s && TREND_METRICS.some((m) => m.id === s)) return s;
    } catch {
      /* ignore */
    }
    return 'sentiment';
  });

  useEffect(() => {
    try {
      localStorage.setItem(TREND_METRIC_STORAGE_KEY, trendMetricId);
    } catch {
      /* ignore */
    }
  }, [trendMetricId]);

  useEffect(() => {
    if (!user && !isGuest) return;
    async function load() {
      if (isGuest && !user) {
        setEntries(readGuestEntries());
        setInsights([]);
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!user) return;
      try {
        const [e, i, p] = await Promise.all([
          // Enough rows to cover 30 calendar days with multiple sessions per day (avoid "missing" older days).
          getEntries(user.id, { limit: 200 }),
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
  }, [user, isGuest]);

  const displayName =
    isGuest && !user ? 'Guest' : profile?.display_name || user?.email?.split('@')[0] || '';
  const greeting = getGreeting();
  const activeTrendMetric = getTrendMetricById(trendMetricId);

  const moodDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i);
      const summary = getDayMoodSummary(entries, date);
      return {
        date,
        score: summary?.avgSentiment ?? null,
        hasEntry: summary != null && summary.count > 0,
      };
    });
  }, [entries]);

  const trendSeries = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i);
      let value = null;
      if (activeTrendMetric.yKind === 'sentiment') {
        const s = getDayMoodSummary(entries, date);
        value = s?.avgSentiment ?? null;
      } else {
        value = getDayEmotionAverage(entries, date, activeTrendMetric.emotionKey);
      }
      return {
        date,
        value,
        hasEntry: entriesForDay(entries, date).length > 0,
      };
    });
  }, [entries, activeTrendMetric]);

  const entriesWithEmotionBreakdown = useMemo(
    () => entries.filter((e) => parseEmotionPercentages(e) != null).length,
    [entries]
  );

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

  const scoreDaysCount = moodDays.filter((d) => d.score !== null).length;
  const trendFilledDays = trendSeries.filter((d) => d.value !== null).length;
  const entriesWithMoodScore = entries.filter(
    (e) => typeof e.sentiment_score === 'number' && !Number.isNaN(e.sentiment_score)
  ).length;
  const recentEntries = entries.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-2 pb-6 md:pb-8 space-y-8 lg:space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl mx-auto space-y-2 px-1"
      >
        <h1 className="font-pageTitle font-semibold text-3xl md:text-4xl text-echo-text tracking-tight">
          {greeting} {displayName}!
        </h1>
        <p className="text-echo-text-dim text-sm leading-relaxed">
          Your overview — mood trend, the last 30 days at a glance, and your latest reflections in one place.
        </p>
      </motion.header>

      {/* Single centered column: no empty “middle” vs a tall sidebar */}
      <div className="max-w-3xl xl:max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="font-pageTitle font-semibold text-xl md:text-2xl text-echo-text text-center tracking-tight">
            Last 30 days
          </h2>
          <div className="w-full max-w-[280px] mx-auto px-1">
            <label htmlFor="home-trend-metric" className="sr-only">
              What to plot on the chart
            </label>
            <select
              id="home-trend-metric"
              value={trendMetricId}
              onChange={(e) => setTrendMetricId(e.target.value)}
              className="w-full text-sm bg-echo-card border border-echo-border rounded-xl px-3 py-2.5 text-echo-text focus:outline-none focus:ring-2 focus:ring-echo-accent/30"
            >
              {TREND_METRICS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-echo-text-dim text-[10px] mt-1.5 leading-snug text-center">
              {activeTrendMetric.description}
            </p>
          </div>
          <div className="bg-echo-surface border border-echo-border rounded-2xl p-3 md:p-4 shadow-sm overflow-x-auto min-h-[140px] md:min-h-[180px] flex flex-col justify-center">
            {trendFilledDays >= 3 ? (
              <TrendChart series={trendSeries} metric={activeTrendMetric} />
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-echo-text-muted text-xs font-medium italic max-w-md mx-auto">
                  {activeTrendMetric.yKind === 'sentiment'
                    ? entries.length > 0 && entriesWithMoodScore === 0
                      ? 'Your saved entries don’t have mood scores yet (often older data). New recordings get scored automatically—keep journaling.'
                      : trendFilledDays === 0 && entries.length >= 3
                        ? 'Spread a few recordings across different days so we can chart mood over time.'
                        : `Need mood scores on ${3 - trendFilledDays} more calendar day${3 - trendFilledDays === 1 ? '' : 's'} (last 30 days) to unlock the chart.`
                    : entriesWithEmotionBreakdown === 0
                      ? 'No emotion breakdown in your entries yet. New recordings include estimated percentages (fear, anger, happiness, …)—journal again to chart them.'
                      : `Need this measure on ${3 - trendFilledDays} more calendar day${3 - trendFilledDays === 1 ? '' : 's'} in the last 30 days.`}
                </p>
                <div className="max-w-[120px] mx-auto h-1 bg-echo-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-echo-accent transition-all duration-1000"
                    style={{ width: `${Math.min(100, (trendFilledDays / 3) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {entries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-[6px] p-4 md:p-5 bg-echo-surface border border-echo-border rounded-2xl shadow-sm">
              {moodDays.map((day, i) => (
                <MoodDot key={i} score={day.score} size={14} date={day.date} />
              ))}
            </div>
          )}
        </motion.div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-8"
          >
            <div className="p-6 md:p-8 bg-gradient-to-br from-echo-accent/[0.08] via-echo-surface to-echo-surface border border-echo-border rounded-2xl md:rounded-3xl text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 bg-echo-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mic size={32} className="text-echo-accent" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-display text-echo-text">Your emotional space</h2>
                <p className="text-echo-text-muted text-sm max-w-md mx-auto">
                  Lumos helps you track your journey through voice. Record how you feel, and we&apos;ll help you see the patterns.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
                <div className="p-3 bg-echo-card/40 rounded-xl border border-echo-border/60">
                  <p className="text-[10px] text-echo-accent font-bold uppercase tracking-wider mb-1">Step 1</p>
                  <p className="text-xs text-echo-text font-medium">Record a 30s check-in</p>
                </div>
                <div className="p-3 bg-echo-card/40 rounded-xl border border-echo-border/60">
                  <p className="text-[10px] text-echo-accent font-bold uppercase tracking-wider mb-1">Step 2</p>
                  <p className="text-xs text-echo-text font-medium">Get instant mood insights</p>
                </div>
              </div>

              <Link
                to="/record"
                className="block w-full max-w-sm mx-auto py-3.5 md:py-4 bg-echo-accent text-white rounded-2xl font-medium shadow-lg shadow-echo-accent/20 hover:opacity-95 transition-all active:scale-[0.98]"
              >
                Start Your First Entry
              </Link>
            </div>

            <div className="hidden lg:block p-6 rounded-2xl border border-echo-border bg-echo-surface shadow-sm space-y-3 text-left max-w-lg mx-auto">
              <h3 className="font-display text-lg text-echo-text text-center">Getting started</h3>
              <p className="text-sm text-echo-text-muted leading-relaxed text-center">
                Use <strong className="text-echo-text">Record</strong> in the sidebar when you&apos;re ready — same flow as on mobile.
              </p>
              <ul className="text-xs text-echo-text-dim space-y-2 list-disc pl-4 max-w-md mx-auto">
                <li>30-second voice check-ins</li>
                <li>Optional camera for richer mood context</li>
                <li>Entries stay private to your account</li>
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3 px-1 max-w-lg mx-auto">
              {[{ label: 'Calm' }, { label: 'Aware' }, { label: 'Grounded' }].map((feature, i) => (
                <div
                  key={i}
                  className="text-center py-2.5 bg-echo-surface/80 rounded-lg border border-echo-border/50"
                >
                  <p className="text-[10px] text-echo-text-dim font-medium uppercase tracking-[0.2em]">
                    {feature.label}
                  </p>
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
            {recentEntries.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-pageTitle font-semibold text-xl md:text-2xl text-echo-text text-center tracking-tight">
                  Recent entries
                </h2>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <Link
                    to="/sessions"
                    className="text-echo-accent text-sm font-medium flex items-center gap-0.5 hover:underline"
                  >
                    Sessions <ChevronRight size={16} strokeWidth={2} />
                  </Link>
                  <Link
                    to="/analytics?tab=calendar"
                    className="text-echo-accent text-sm font-medium flex items-center gap-0.5 hover:underline"
                  >
                    Calendar <ChevronRight size={16} strokeWidth={2} />
                  </Link>
                </div>

                <div className="space-y-2">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-echo-surface border border-echo-border rounded-xl shadow-sm"
                    >
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <MoodDot score={entry.sentiment_score} size={8} />
                        <span className="text-echo-text-dim text-xs">
                          {format(new Date(entry.created_at), 'MMM d, h:mm a')}
                        </span>
                        <span className="text-echo-text-dim text-xs">{entry.duration_seconds}s</span>
                      </div>
                      <p className="text-echo-text text-sm leading-relaxed line-clamp-2">
                        {entry.summary || entry.transcript}
                      </p>
                      {entry.speaking_tone && (
                        <p className="text-echo-text text-sm mt-1.5 line-clamp-2 leading-relaxed">
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
              </div>
            )}
          </motion.div>
        )}
      </div>

      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl xl:max-w-4xl mx-auto space-y-4"
        >
          <h2 className="font-pageTitle font-semibold text-xl md:text-2xl text-echo-text text-center tracking-tight flex items-center justify-center gap-2 flex-wrap">
            <Sparkles size={20} className="text-echo-accent shrink-0" aria-hidden />
            New Insights
          </h2>
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight) => (
              <button
                type="button"
                key={insight.id}
                onClick={() => handleInsightOpen(insight)}
                className="w-full text-left p-4 bg-echo-surface border border-echo-border rounded-xl hover:border-echo-accent/35 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-echo-text text-sm font-medium">{insight.title}</p>
                    <p className="text-echo-text-muted text-xs mt-1 line-clamp-2">{insight.body}</p>
                  </div>
                  {insight.entry_count && (
                    <span className="text-[10px] text-echo-text-dim bg-echo-card px-2 py-0.5 rounded-full shrink-0">
                      {insight.entry_count} entries
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {showWelcomeBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-2 md:py-4 px-4 rounded-xl bg-echo-card/50 border border-echo-border/60 max-w-xl mx-auto"
        >
          <p className="text-echo-text-muted text-sm">Welcome back — good to see you again.</p>
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
