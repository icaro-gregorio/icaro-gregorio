import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';

/**
 * Donut for a small categorical split (≤ 3 slices — within the palette's
 * all-pairs cap). `data` = [{ name, value, color }]. A centre label shows the
 * headline figure. Always paired with a legend by the caller.
 */
export default function AllocationDonut({ data, centerLabel, centerValue, height = 200 }) {
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Tooltip
            content={<ChartTooltip valueFormatter={(v) => v} />}
            cursor={false}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="var(--surface-1)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {centerValue && (
            <div style={{ fontSize: 21, fontWeight: 680, letterSpacing: '-0.02em' }} className="tnum">
              {centerValue}
            </div>
          )}
          {centerLabel && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{centerLabel}</div>
          )}
        </div>
      )}
    </div>
  );
}
