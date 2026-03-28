import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, TrendingUp, MessageCircle, Clock, Repeat } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import CalendarPanel from '@/components/CalendarPanel';
import { getEntries, getInsights, getWeeklySummaries } from '@/lib/supabase';
import { ensurePastWeekSummary } from '@/lib/weeklySummary';
import MoodDot, { getMoodColor } from '@/components/MoodDot';
import { format, subDays } from 'date-fns';

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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
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
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

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
    entityCounts[entity] = (entityCounts[entity] || 0) + 1;
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

  // Sentiment over time (last 14 days)
  const last14 = entries
    .filter((e) => new Date(e.created_at) > subDays(new Date(), 14))
    .reverse();

  return (
    <div className="pt-8 pb-4 space-y-6">
      <h1 className="font-display text-2xl text-echo-text text-center">Analytics</h1>

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
            className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id
                ? 'bg-echo-accent text-white'
                : 'text-echo-text-muted hover:text-echo-text'
              }`}
          >
            {t.label}
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
                Mood · Last 14 Days
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
          className="space-y-3"
        >
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles size={24} className="text-echo-text-dim mx-auto mb-2" />
              <p className="text-echo-text-muted text-sm">
                No insights yet. Keep recording.
              </p>
            </div>
          ) : (
            insights.map((insight) => {
              const Icon = INSIGHT_ICONS[insight.type] || Sparkles;
              return (
                <div
                  key={insight.id}
                  className={`p-4 bg-echo-surface border rounded-xl transition-all ${insight.is_read ? 'border-echo-border' : 'border-echo-accent/30'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-echo-accent/10">
                      <Icon size={14} className="text-echo-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-echo-text text-sm font-medium">{insight.title}</p>
                      <p className="text-echo-text-muted text-xs mt-1 leading-relaxed">
                        {insight.body}
                      </p>
                      {insight.entry_count && (
                        <p className="text-echo-text-dim text-[10px] mt-2">
                          Noticed across {insight.entry_count} entries
                          {insight.confidence_score
                            ? ` · ${(insight.confidence_score * 100).toFixed(0)}% confidence`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
