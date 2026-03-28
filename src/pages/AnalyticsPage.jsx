import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Users,
  TrendingUp,
  MessageCircle,
  Clock,
  Repeat,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { readGuestEntries } from '@/lib/guestCookies';
import CalendarPanel from '@/components/CalendarPanel';
import {
  getEntries,
  getInsights,
  getWeeklySummaries,
  markInsightRead,
  dismissInsight,
} from '@/lib/supabase';
import { ensurePastWeekSummary } from '@/lib/weeklySummary';
import { runPostEntryHeuristics } from '@/lib/insights';
import MoodDot, { getMoodColor } from '@/components/MoodDot';
import { format } from 'date-fns';

const INSIGHT_ICONS = {
  emotional_pattern: TrendingUp,
  relationship_map: Users,
  energy_correlation: TrendingUp,
  unresolved_thread: MessageCircle,
  vocabulary_drift: MessageCircle,
  memory_anchor: Clock,
  this_time_last_month: Clock,
  recurring_trend: Repeat,
};

const ANALYTICS_TABS = ['overview', 'calendar', 'insights', 'weekly'];

const INSIGHT_TYPE_LABELS = {
  emotional_pattern: 'Mood pattern',
  relationship_map: 'Relationships',
  energy_correlation: 'Energy',
  unresolved_thread: 'Open thread',
  vocabulary_drift: 'Language shift',
  memory_anchor: 'Memory',
  this_time_last_month: 'This time last month',
  recurring_trend: 'Recurring theme',
};

function insightTypeLabel(type) {
  if (!type) return 'Insight';
  return INSIGHT_TYPE_LABELS[type] || type.replace(/_/g, ' ');
}

export default function AnalyticsPage() {
  const { user, isGuest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsBusy, setInsightsBusy] = useState(false);

  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(() => {
    const p = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    return ANALYTICS_TABS.includes(p) ? p : 'overview';
  });

  useEffect(() => {
    if (ANALYTICS_TABS.includes(tabParam)) {
      setTab(tabParam);
    } else {
      setTab('overview');
    }
  }, [tabParam]);

  const setTabAndUrl = useCallback(
    (next) => {
      setTab(next);
      if (next === 'overview') {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ tab: next }, { replace: true });
      }
    },
    [setSearchParams]
  );

  const loadData = useCallback(
    async ({ silent } = {}) => {
      if (!user && !isGuest) return;
      if (!silent) setLoading(true);
      try {
        if (isGuest && !user) {
          setEntries(readGuestEntries());
          setInsights([]);
          setSummaries([]);
        } else if (user) {
          const [e, i] = await Promise.all([
            getEntries(user.id, { limit: 60 }),
            getInsights(user.id),
          ]);
          await ensurePastWeekSummary(user.id).catch((err) =>
            console.warn('Weekly summary sync skipped:', err)
          );
          const s = await getWeeklySummaries(user.id);
          setEntries(e || []);
          setInsights(i || []);
          setSummaries(s || []);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user, isGuest]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unreadInsightCount = useMemo(
    () => insights.filter((i) => !i.is_read).length,
    [insights]
  );

  const insightsSorted = useMemo(() => {
    return [...insights].sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [insights]);

  async function handleMarkInsightRead(id) {
    if (!user) return;
    try {
      await markInsightRead(id);
      setInsights((prev) => prev.map((x) => (x.id === id ? { ...x, is_read: true } : x)));
    } catch (err) {
      console.error('Failed to mark insight read:', err);
    }
  }

  async function handleDismissInsight(id) {
    if (!user) return;
    try {
      await dismissInsight(id);
      setInsights((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  }

  async function handleRefreshInsights() {
    if (!user || insightsBusy) return;
    setInsightsBusy(true);
    try {
      await runPostEntryHeuristics(user.id);
      await loadData({ silent: true });
    } catch (err) {
      console.error('Insight refresh failed:', err);
    } finally {
      setInsightsBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-echo-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalEntries = entries.length;
  const avgSentiment = totalEntries > 0
    ? entries.reduce((sum, e) => sum + (e.sentiment_score || 0), 0) / totalEntries
    : 0;
  const avgEnergy = totalEntries > 0
    ? entries.reduce((sum, e) => sum + (e.energy_level || 0), 0) / totalEntries
    : 0;

  // Extract all mentioned people
  const allEntities = entries.flatMap((e) => e.entities || []);
  const entityCounts = {};
  for (const entity of allEntities) {
    // entities may be strings or objects like {name, type}
    const name = typeof entity === 'string' ? entity : entity?.name;
    if (!name || typeof name !== 'string' || name === '[object Object]') continue;
    entityCounts[name] = (entityCounts[name] || 0) + 1;
  }
  const topEntities = Object.entries(entityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Topic frequency
  const allTopics = entries.flatMap((e) => e.topics || []);
  const topicCounts = {};
  for (const topic of allTopics) {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const allKeywords = entries.flatMap((e) => e.keywords || []);
  const keywordCounts = {};
  for (const k of allKeywords) {
    const key = String(k).trim().toLowerCase();
    if (key.length < 2) continue;
    keywordCounts[key] = (keywordCounts[key] || 0) + 1;
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // Sentiment over time (last 14 entries)
  const last14 = [...entries].reverse().slice(0, 14);

  return (
    <div className="pt-8 pb-4 space-y-6">
      <h1 className="font-pageTitle font-semibold text-3xl md:text-4xl text-echo-text text-center tracking-tight">
        Analytics
      </h1>

      {/* Tab switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-echo-surface rounded-xl p-1 border border-echo-border">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'insights', label: 'Insights' },
          { id: 'weekly', label: 'Weekly' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabAndUrl(t.id)}
            className={`relative py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id
                ? 'bg-echo-accent text-white'
                : 'text-echo-text-muted hover:text-echo-text'
              }`}
          >
            <span className="inline-flex items-center justify-center gap-1">
              {t.label}
              {t.id === 'insights' && unreadInsightCount > 0 && (
                <span
                  className={`min-w-[1.125rem] h-5 px-1 rounded-full text-[10px] font-semibold leading-none flex items-center justify-center ${
                    tab === 'insights' ? 'bg-white/25 text-white' : 'bg-echo-accent text-white'
                  }`}
                  aria-label={`${unreadInsightCount} unread insights`}
                >
                  {unreadInsightCount > 9 ? '9+' : unreadInsightCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* No data state — overview only; calendar/weekly still useful with fewer entries */}
      {totalEntries < 3 && tab === 'overview' && (
        <div className="text-center py-8">
          <p className="text-echo-text-muted text-sm">
            Record at least 3 entries to unlock insights.
          </p>
          <p className="text-echo-text-dim text-xs mt-1">
            {totalEntries}/3 entries recorded
          </p>
        </div>
      )}

      {/* Calendar Tab */}
      {tab === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 md:p-5 bg-echo-surface border border-echo-border rounded-2xl shadow-sm"
        >
          <CalendarPanel />
        </motion.div>
      )}

      {/* Overview Tab */}
      {tab === 'overview' && totalEntries >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Entries" value={totalEntries} />
            <StatCard
              label="Avg Mood"
              value={
                <MoodDot score={avgSentiment} size={16} />
              }
            />
            <StatCard
              label="Avg Energy"
              value={`${(avgEnergy * 100).toFixed(0)}%`}
            />
          </div>

          {/* Sentiment timeline */}
          {last14.length > 0 && (
            <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
              <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-4">
                Mood · Last 14 Entries
              </p>
              <div className="flex items-end gap-1 h-20">
                {last14.map((entry, i) => {
                  const height = ((entry.sentiment_score + 1) / 2) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(4, height)}%`,
                        backgroundColor: getMoodColor(entry.sentiment_score),
                        opacity: 0.8,
                      }}
                      title={`${format(new Date(entry.created_at), 'MMM d')}: ${entry.sentiment_label}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Top topics */}
          {topTopics.length > 0 && (
            <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
              <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-3">
                Recurring Topics
              </p>
              <div className="flex flex-wrap gap-2">
                {topTopics.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="text-xs px-3 py-1.5 rounded-full bg-echo-card text-echo-text-muted border border-echo-border"
                  >
                    {topic}
                    <span className="text-echo-text-dim ml-1.5">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {topKeywords.length > 0 && (
            <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
              <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Repeat size={12} className="opacity-70" />
                Keywords (trending)
              </p>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(([word, count]) => (
                  <span
                    key={word}
                    className="text-xs px-3 py-1.5 rounded-full bg-echo-accent/10 text-echo-text border border-echo-accent/25"
                  >
                    {word}
                    <span className="text-echo-text-dim ml-1.5">{count}×</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* People mentioned */}
          {topEntities.length > 0 && (
            <div className="p-4 bg-echo-surface border border-echo-border rounded-xl">
              <p className="text-echo-text-dim text-xs uppercase tracking-wider mb-3">
                <Users size={10} className="inline mr-1" />
                People & Places
              </p>
              <div className="space-y-2">
                {topEntities.map(([entity, count]) => (
                  <div key={entity} className="flex items-center justify-between">
                    <span className="text-echo-text text-sm">{entity}</span>
                    <span className="text-echo-text-dim text-xs">{count} mentions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Insights Tab */}
      {tab === 'insights' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-echo-text">Your insights</h2>
              <p className="text-echo-text-muted text-xs mt-0.5 max-w-md">
                Patterns we notice across your entries. Mark as read when you&apos;ve seen them, or dismiss if
                they don&apos;t fit.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshInsights}
              disabled={insightsBusy || !user}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-echo-border bg-echo-surface text-echo-text hover:bg-echo-card/80 transition-colors disabled:opacity-50 disabled:pointer-events-none shrink-0"
            >
              <RefreshCw size={16} className={insightsBusy ? 'animate-spin' : ''} />
              {insightsBusy ? 'Checking…' : 'Check for new patterns'}
            </button>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-echo-border bg-echo-surface/50 space-y-3">
              <Sparkles size={28} className="text-echo-accent/70 mx-auto" />
              <p className="text-echo-text text-sm font-medium">No insights yet</p>
              <p className="text-echo-text-muted text-sm max-w-sm mx-auto">
                After several entries, we look for mood trends and recurring themes. Record a few more
                check-ins, then tap <strong className="text-echo-text">Check for new patterns</strong> above.
              </p>
              <p className="text-echo-text-dim text-xs">
                {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'} on file
              </p>
              <Link
                to="/record"
                className="inline-block mt-2 text-echo-accent text-sm font-medium hover:underline"
              >
                Record now
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {insightsSorted.map((insight) => {
                const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
                const unread = !insight.is_read;
                return (
                  <li key={insight.id}>
                    <div
                      className={`rounded-xl border bg-echo-surface shadow-sm overflow-hidden transition-colors ${
                        unread ? 'border-echo-accent/35 ring-1 ring-echo-accent/10' : 'border-echo-border'
                      }`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${unread ? 'bg-echo-accent/15' : 'bg-echo-card'}`}
                          >
                            <Icon size={18} className="text-echo-accent" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2 gap-y-1">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-echo-accent bg-echo-accent/10 px-2 py-0.5 rounded-md">
                                {insightTypeLabel(insight.type)}
                              </span>
                              {unread && (
                                <span className="text-[10px] font-medium text-echo-accent">New</span>
                              )}
                              <span className="text-[10px] text-echo-text-dim ml-auto sm:ml-0">
                                {format(new Date(insight.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <h3 className="text-echo-text text-sm sm:text-base font-semibold leading-snug">
                              {insight.title}
                            </h3>
                            <p className="text-echo-text-muted text-sm leading-relaxed whitespace-pre-wrap">
                              {insight.body}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-echo-text-dim pt-1">
                              {insight.entry_count != null && (
                                <span>Based on {insight.entry_count} entries</span>
                              )}
                              {insight.confidence_score != null && (
                                <span>
                                  Confidence ~{(insight.confidence_score * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-echo-border/80">
                          {unread ? (
                            <button
                              type="button"
                              onClick={() => handleMarkInsightRead(insight.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-echo-accent text-white hover:bg-echo-accent/90 transition-colors"
                            >
                              <Check size={14} />
                              Mark as read
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-echo-text-dim border border-echo-border/60">
                              <Check size={14} className="opacity-50" />
                              Read
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismissInsight(insight.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-echo-text-muted border border-echo-border hover:bg-echo-red/5 hover:text-echo-red hover:border-echo-red/25 transition-colors"
                          >
                            <X size={14} />
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>
      )}

      {/* Weekly Tab */}
      {tab === 'weekly' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {summaries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-echo-text-muted text-sm">
                Weekly summaries appear after your first full week.
              </p>
            </div>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.id}
                className="p-5 bg-echo-surface border border-echo-border rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-echo-text font-medium text-sm">
                    {format(new Date(summary.week_start), 'MMM d')} – {format(new Date(summary.week_end), 'MMM d')}
                  </p>
                  <div className="flex items-center gap-2">
                    <MoodDot score={summary.avg_sentiment} size={10} />
                    <span className="text-echo-text-dim text-xs">
                      {summary.entry_count} entries
                    </span>
                  </div>
                </div>
                <p className="text-echo-text-muted text-sm leading-relaxed">
                  {summary.summary}
                </p>
                {summary.emotional_arc && (
                  <p className="text-echo-text-dim text-xs italic">
                    {summary.emotional_arc}
                  </p>
                )}
                {summary.top_topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {summary.top_topics.map((topic, i) => (
                      <span key={i} className="text-[10px] text-echo-text-dim bg-echo-card px-2 py-0.5 rounded-full">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-3 bg-echo-surface border border-echo-border rounded-xl text-center">
      <p className="text-echo-text-dim text-[10px] uppercase tracking-wider">{label}</p>
      <div className="mt-1.5 flex items-center justify-center text-echo-text text-lg font-medium">
        {value}
      </div>
    </div>
  );
}
