import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';
import { formatCompact } from '../../utils/format.js';

/** 12-month net-worth trend as a single-series area (blue, series-1). */
export default function NetWorthArea({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="0" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={{ stroke: 'var(--baseline)' }}
          tick={{ fill: 'var(--text-muted)', fontSize: 11.5 }}
          dy={6}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tick={{ fill: 'var(--text-muted)', fontSize: 11.5 }}
          tickFormatter={(v) => formatCompact(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--baseline)', strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="value"
          name="Net worth"
          stroke="var(--series-1)"
          strokeWidth={2}
          fill="url(#nwFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface-1)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
