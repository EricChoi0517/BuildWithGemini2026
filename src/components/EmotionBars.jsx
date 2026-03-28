import { useMemo } from 'react';
import { motion } from 'framer-motion';

const EMOTION_COLORS = {
  Happiness: '#F59E0B',   // Warm amber/yellow
  Joy: '#F59E0B',
  Fear: '#8B5CF6',        // Muted purple
  Scared: '#8B5CF6',
  Anxious: '#8B5CF6',
  Anger: '#EF4444',       // Soft red
  Mad: '#EF4444',
  Frustration: '#EF4444',
  Sadness: '#3B82F6',     // Calm blue
  Sad: '#3B82F6',
  Neutral: '#9CA3AF',     // Gray
  Surprise: '#F97316',    // Orange
  Disgust: '#10B981',     // Green
};

const DEFAULT_COLOR = '#6B7280'; // Gray

export default function EmotionBars({ data }) {
  // If data is a string, try parsing it
  const parsed = useMemo(() => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      const parsedData = JSON.parse(data);
      if (typeof parsedData === 'object' && parsedData !== null) {
        return parsedData;
      }
    } catch {
      // Not JSON, just normal text
    }
    return data;
  }, [data]);

  if (!parsed) return null;

  if (typeof parsed === 'string') {
    return (
      <p className="text-echo-text-dim text-xs mt-3 leading-relaxed border-l-2 border-echo-accent/25 pl-3">
        <span className="text-echo-text-muted uppercase tracking-wider text-[10px] block mb-1">
          Context & Changes
        </span>
        {parsed}
      </p>
    );
  }

  // It's an object of probabilities
  const entries = Object.entries(parsed).sort((a, b) => b[1] - a[1]); // Sort high to low

  return (
    <div className="mt-4 pt-4 border-t border-echo-border/50 space-y-3">
      <p className="text-echo-text-muted uppercase tracking-wider text-[10px] mb-3">
        Emotion Breakdown
      </p>
      {entries.map(([emotion, percentage], idx) => {
        const pct = Math.max(0, Math.min(100, Math.round(Number(percentage))));
        if (pct < 1 && entries.length > 2) return null; // hide very small percentages to keep UI clean
        
        // Find best color match (case insensitive)
        const keyMatch = Object.keys(EMOTION_COLORS).find(
          k => k.toLowerCase() === emotion.toLowerCase()
        );
        const color = keyMatch ? EMOTION_COLORS[keyMatch] : DEFAULT_COLOR;

        return (
          <div key={emotion} className="flex items-center gap-3">
            <span className="w-16 text-xs text-echo-text-dim truncate text-right capitalize">
              {emotion}
            </span>
            <div className="flex-1 h-1.5 bg-echo-border/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="w-10 text-[11px] tabular-nums text-echo-text-muted text-left">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
