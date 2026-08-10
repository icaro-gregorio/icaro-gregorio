import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip.jsx';
import { formatCompact } from '../../utils/format.js';

/**
 * Income vs expenses per month — two-series grouped bars (blue = income,
 * orange = expenses). A legend accompanies it in the parent, so identity is
 * never colour-alone.
 */
export default function CashFlowBars({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--grid)" />
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
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)', opacity: 0.5 }} />
        <Bar dataKey="income" name="Income" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expenses" name="Expenses" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
