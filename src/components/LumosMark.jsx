import { useId } from 'react';

/**
 * Lumos mark: two long parallel bars, each with a perpendicular leg on the outer side (away
 * from the gap between bars). No center spine. Rotated ~45°.
 */
export default function LumosMark({
  className = '',
  size = 32,
  decorative = false,
  /** Squircle + faint diagonal grid (login / app-icon style) */
  iconTexture = false,
}) {
  const uid = useId().replace(/:/g, '');
  const gridId = `lumos-grid-${uid}`;

  const blue = '#55BBEB';
  const w = 3.25;

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
        <pattern id={gridId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M 0 5 L 0 0 5 0" fill="none" stroke="#D6D3D1" strokeWidth="0.28" opacity="0.65" />
        </pattern>
      </defs>

      {iconTexture && (
        <>
          <rect x="1" y="1" width="30" height="30" rx="8" fill="#FFFFFF" />
          <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#${gridId})`} />
        </>
      )}

      {/* Parallel bars extended; stubs on far side of each bar (outward), longer; rotate 45° */}
      <g transform="rotate(45 16 16)" stroke={blue} strokeWidth={w} strokeLinecap="butt" strokeLinejoin="miter">
        <line x1="5.25" y1="12.25" x2="26.75" y2="12.25" />
        <line x1="16" y1="12.25" x2="16" y2="4.85" />
        <line x1="5.25" y1="19.75" x2="26.75" y2="19.75" />
        <line x1="16" y1="19.75" x2="16" y2="27.15" />
      </g>
    </svg>
  );
}
