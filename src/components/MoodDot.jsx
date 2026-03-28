/**
 * MoodDot — a single colored circle representing one day's sentiment
 * Green (positive) → Amber (neutral) → Red (negative)
 * No numbers, no labels, no percentages
 */
export default function MoodDot({ score, size = 12, onClick, date }) {
  const color = getMoodColor(score);

  return (
    <button
      onClick={onClick}
      title={date ? new Date(date).toLocaleDateString() : undefined}
      className="mood-dot rounded-full transition-all duration-200 hover:scale-150 focus:outline-none focus:ring-2 focus:ring-echo-accent/50"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity: score != null ? 1 : 0.15,
      }}
    />
  );
}

/**
 * Map sentiment score (-1 to 1) to color
 * Smooth gradient: red → amber → green
 */
function getMoodColor(score) {
  if (score == null) return '#DDD8F0';

  // Clamp to -1 to 1
  const s = Math.max(-1, Math.min(1, score));

  // Map to 0-1 range
  const t = (s + 1) / 2;

  if (t < 0.4) {
    // Red to Amber
    const p = t / 0.4;
    return lerpColor('#EF4444', '#F59E0B', p);
  } else if (t > 0.6) {
    // Amber to Green
    const p = (t - 0.6) / 0.4;
    return lerpColor('#F59E0B', '#22C55E', p);
  }
  return '#F59E0B'; // Amber zone
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;
}

export { getMoodColor };
