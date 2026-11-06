// Circular score meter. The arc length matches the real score (0–100).

export default function ScoreRing({ score, size = 108, stroke = 9, numSize = 38, showOf = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const dash = (value / 100) * c;

  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`Score ${value} out of 100`}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--lime)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="ring-label" aria-hidden="true">
        <span className="ring-num" style={{ fontSize: numSize }}>{value}</span>
        {showOf && <span className="ring-of">/100</span>}
      </div>
    </div>
  );
}
