import { formatCurrency } from '../../utils/format.js';

/**
 * Shared Recharts tooltip styled with theme tokens. `valueFormatter` defaults to
 * whole-dollar currency. Each row shows the series colour swatch, name and value.
 */
export default function ChartTooltip({ active, payload, label, valueFormatter = formatCurrency }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        boxShadow: 'var(--shadow)',
        padding: '10px 12px',
        fontSize: 12.5,
        minWidth: 140,
      }}
    >
      {label != null && (
        <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 550 }}>{label}</div>
      )}
      {payload.map((entry) => (
        <div
          key={entry.dataKey ?? entry.name}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: entry.color || entry.fill,
              flexShrink: 0,
            }}
          />
          <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{entry.name}</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {valueFormatter(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
