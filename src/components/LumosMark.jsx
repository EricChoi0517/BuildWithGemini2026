import { useId } from 'react';

/**
 * Lumos mark: two mirrored thick hooks (diagonal bar + short leg toward center),
 * matching the reference — negative space reads as a diagonal band between them.
 */
export default function LumosMark({
  className = '',
  size = 32,
  decorative = false,
  /** Squircle-style faint diagonal grid (reference app icon) */
  iconTexture = false,
}) {
  const uid = useId().replace(/:/g, '');
  const gradId = `lumos-grad-${uid}`;
  const filtId = `lumos-shade-${uid}`;
  const gridId = `lumos-grid-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative}
      aria-label={decorative ? undefined : 'Lumos'}
    >
      <defs>
        <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#55BBEB" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
        <pattern id={gridId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M 0 5 L 0 0 5 0" fill="none" stroke="#D6D3D1" strokeWidth="0.28" opacity="0.65" />
        </pattern>
        <filter id={filtId} x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.6" floodColor="#38BDF8" floodOpacity="0.4" />
        </filter>
      </defs>

      {iconTexture && (
        <>
          <rect x="1" y="1" width="30" height="30" rx="8" fill="#FFFFFF" />
          <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gridId})`} />
        </>
      )}

      <g filter={`url(#${filtId})`}>
        <path
          d="
            M 6.2 7.8 L 12.4 19.2
            M 9.3 13.5 L 14.8 7.2
            M 25.8 24.2 L 19.6 12.8
            M 22.7 18.5 L 17.2 24.8
          "
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
