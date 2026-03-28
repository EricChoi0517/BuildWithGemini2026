import { useId } from 'react';
import { getMoodColor } from '@/components/MoodDot';

/**
 * @param {{ date: Date, value: number | null }[]} series
 * @param {import('@/lib/trendMetrics').TrendMetric} metric
 */
export default function TrendChart({ series, metric }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `trend-line-${uid}`;
  const areaGradId = `trend-area-${uid}`;
  const clipId = `trend-clip-${uid}`;

  const margin = { left: 62, right: 14, top: 14, bottom: 34 };
  const width = 408;
  const height = 172;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const rPlot = 10;
  const axisY = margin.top + innerH;
  const axisFs = 7.25;
  const noteFs = 6.5;
  const titleFs = 6.75;

  const points = series
    .map((d, index) => ({ ...d, index }))
    .filter((d) => d.value !== null && typeof d.value === 'number' && !Number.isNaN(d.value));

  if (points.length < 2) {
    return (
      <div className="h-full flex items-center justify-center text-echo-text-dim text-xs py-4 italic">
        Not enough days with data for this measure yet.
      </div>
    );
  }

  const getX = (i) => margin.left + (i / 29) * innerW;
  const getYSentiment = (v) => margin.top + innerH - ((v + 1) / 2) * innerH;
  const getYPercent = (v) => margin.top + innerH - (Math.max(0, Math.min(100, v)) / 100) * innerH;
  const getY = metric.yKind === 'sentiment' ? getYSentiment : getYPercent;

  const linePath = points.reduce((acc, p, i) => {
    const x = getX(p.index);
    const y = getY(p.value);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${getX(last.index)} ${axisY} L ${getX(first.index)} ${axisY} Z`;

  const yTicks =
    metric.yKind === 'sentiment'
      ? [
          { v: 1, label: '+1' },
          { v: 0, label: '0' },
          { v: -1, label: '−1' },
        ]
      : [
          { v: 100, label: '100%' },
          { v: 50, label: '50%' },
          { v: 0, label: '0%' },
        ];

  const yMid = margin.top + innerH / 2;
  const lineColor = metric.lineColor || '#6B5B9E';
  const useGradientLine = metric.yKind === 'sentiment';

  const aria =
    metric.yKind === 'sentiment'
      ? 'Trend of daily average mood from negative one to positive one over the past thirty days'
      : `Trend of daily average ${metric.label} intensity from zero to one hundred percent over the past thirty days`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full min-w-[300px] max-w-full overflow-visible text-echo-text-muted"
      aria-label={aria}
      role="img"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={margin.left} y={margin.top} width={innerW} height={innerH} rx={rPlot} ry={rPlot} />
        </clipPath>
        {useGradientLine && (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {points.map((p) => (
              <stop
                key={p.index}
                offset={`${(p.index / 29) * 100}%`}
                stopColor={getMoodColor(p.value)}
              />
            ))}
          </linearGradient>
        )}
        <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.16" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis title (vertical) */}
      <text
        x={12}
        y={yMid}
        transform={`rotate(-90, 12, ${yMid})`}
        textAnchor="middle"
        fill="currentColor"
        className="text-echo-text-dim"
        style={{ fontSize: titleFs }}
      >
        {metric.yKind === 'percent' ? `${metric.label} (%)` : metric.label}
      </text>

      <rect
        x={margin.left}
        y={margin.top}
        width={innerW}
        height={innerH}
        rx={rPlot}
        ry={rPlot}
        fill="currentColor"
        className="text-echo-accent"
        opacity={0.04}
      />
      <rect
        x={margin.left}
        y={margin.top}
        width={innerW}
        height={innerH}
        rx={rPlot}
        ry={rPlot}
        fill="none"
        stroke="currentColor"
        className="text-echo-border"
        strokeWidth={1}
        opacity={0.55}
      />

      <g clipPath={`url(#${clipId})`}>
        {yTicks.map(({ v }) => {
          const mid =
            metric.yKind === 'sentiment' ? v === 0 : v === 50;
          return (
            <line
              key={v}
              x1={margin.left}
              y1={getY(v)}
              x2={margin.left + innerW}
              y2={getY(v)}
              stroke="currentColor"
              className="text-echo-border"
              strokeWidth={mid ? 1 : 0.5}
              strokeDasharray={mid ? '3 4' : '2 6'}
              opacity={mid ? 0.4 : 0.22}
            />
          );
        })}
        <path d={areaPath} fill={`url(#${areaGradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={useGradientLine ? `url(#${gradId})` : lineColor}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.slice(-8).map((p, i) => (
          <circle
            key={i}
            cx={getX(p.index)}
            cy={getY(p.value)}
            r={2.25}
            fill="rgb(255 252 247)"
            stroke={useGradientLine ? getMoodColor(p.value) : lineColor}
            strokeWidth={1.35}
          />
        ))}
      </g>

      <g fill="currentColor" className="text-echo-text-dim">
        {yTicks.map(({ v, label }) => (
          <text
            key={v}
            x={margin.left - 6}
            y={getY(v)}
            textAnchor="end"
            dominantBaseline="middle"
            style={{ fontSize: axisFs, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
          >
            {label}
          </text>
        ))}
      </g>

      <g fill="currentColor" className="text-echo-text-dim">
        <text
          x={margin.left + innerW / 2}
          y={axisY + 16}
          textAnchor="middle"
          style={{ fontSize: axisFs + 0.75 }}
          className="font-medium"
        >
          Past 30 days
        </text>
        <text
          x={margin.left + innerW / 2}
          y={axisY + 28}
          textAnchor="middle"
          style={{ fontSize: noteFs }}
          opacity={0.68}
        >
          {metric.yKind === 'sentiment'
            ? 'Daily average · −1 to +1 mood scale'
            : `Daily average · model-estimated share of ${metric.label.toLowerCase()}`}
        </text>
      </g>
    </svg>
  );
}
