import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Executive stat tile: label, hero value, an icon, and an optional trend
 * delta + caption in the footer. `deltaDirection` is 'up' | 'down' | 'neutral'
 * — a semantic direction the caller sets (a falling expense can still be "good",
 * so this isn't derived from sign).
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaDirection = 'neutral',
  caption,
  accent = 'var(--accent)',
}) {
  const showDelta = delta != null && deltaDirection !== 'neutral';
  return (
    <div className="card stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span
            className="stat-icon"
            style={{
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              color: accent,
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="stat-value tnum">{value}</div>
      <div className="stat-foot">
        {showDelta && (
          <span className={`delta ${deltaDirection}`}>
            {deltaDirection === 'up' ? (
              <ArrowUpRight size={14} strokeWidth={2.4} />
            ) : (
              <ArrowDownRight size={14} strokeWidth={2.4} />
            )}
            {delta}
          </span>
        )}
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}
