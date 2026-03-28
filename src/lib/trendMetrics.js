/**
 * Options for the home “trend” chart. Sentiment uses entry.sentiment_score;
 * others use averaged percentages from emotion_context_notes (Gemini emotion_percentages).
 */
export const TREND_METRIC_STORAGE_KEY = 'echo-home-trend-metric';

/** @typedef {{ id: string, label: string, description: string, yKind: 'sentiment' | 'percent', emotionKey?: string, lineColor?: string }} TrendMetric */

/** @type {TrendMetric[]} */
export const TREND_METRICS = [
  {
    id: 'sentiment',
    label: 'Overall mood',
    description: 'Average sentiment score per day (−1 to +1).',
    yKind: 'sentiment',
  },
  {
    id: 'fear',
    label: 'Anxiety / fear',
    description: 'Average estimated fear / anxiety intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Fear',
    lineColor: '#8B5CF6',
  },
  {
    id: 'anger',
    label: 'Anger',
    description: 'Average estimated anger intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Anger',
    lineColor: '#EF4444',
  },
  {
    id: 'sadness',
    label: 'Sadness',
    description: 'Average estimated sadness intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Sadness',
    lineColor: '#3B82F6',
  },
  {
    id: 'happiness',
    label: 'Happiness',
    description: 'Average estimated happiness intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Happiness',
    lineColor: '#F59E0B',
  },
  {
    id: 'surprise',
    label: 'Surprise',
    description: 'Average estimated surprise intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Surprise',
    lineColor: '#F97316',
  },
  {
    id: 'disgust',
    label: 'Disgust',
    description: 'Average estimated disgust intensity (0–100%).',
    yKind: 'percent',
    emotionKey: 'Disgust',
    lineColor: '#10B981',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    description: 'Average estimated neutral tone (0–100%).',
    yKind: 'percent',
    emotionKey: 'Neutral',
    lineColor: '#9CA3AF',
  },
];

export function getTrendMetricById(id) {
  return TREND_METRICS.find((m) => m.id === id) || TREND_METRICS[0];
}
