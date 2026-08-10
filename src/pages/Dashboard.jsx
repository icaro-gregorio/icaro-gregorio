import { useMemo } from 'react';
import {
  Wallet,
  ArrowLeftRight,
  Scale,
  Target,
  PiggyBank,
  Building2,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import NetWorthArea from '../components/charts/NetWorthArea.jsx';
import CashFlowBars from '../components/charts/CashFlowBars.jsx';
import AllocationDonut from '../components/charts/AllocationDonut.jsx';
import {
  netWorthSummary,
  cashFlowSummary,
  debtToIncome,
  portfolioSummary,
  goalProgress,
} from '../utils/finance.js';
import {
  formatCurrency,
  formatCompact,
  formatSigned,
  formatPercent,
} from '../utils/format.js';

function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span className="legend-item" key={it.label}>
          <span className="legend-swatch" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const data = useData();
  const { profile, investments, properties, accounts, transactions, netWorthTrend, cashFlowTrend } = data;

  const nw = useMemo(
    () => netWorthSummary({ investments, properties, accounts }),
    [investments, properties, accounts],
  );
  const flow = useMemo(() => cashFlowSummary(transactions), [transactions]);
  const portfolio = useMemo(() => portfolioSummary(investments), [investments]);

  const dti = debtToIncome(nw.totalLiabilities, profile.gross_annual_income);

  const netWorthProgress = goalProgress(nw.netWorth, profile.target_net_worth);
  const savingsProgress = goalProgress(flow.net, profile.monthly_savings_goal);

  // Month-over-month net-worth delta for the headline tile.
  const nwSeries = netWorthTrend;
  const nwDelta = nwSeries.length >= 2
    ? nwSeries[nwSeries.length - 1].value - nwSeries[nwSeries.length - 2].value
    : 0;

  const allocation = [
    { name: 'Growth', value: Math.round(portfolio.growthWeight * 100), color: 'var(--series-1)' },
    { name: 'Defensive', value: Math.round(portfolio.defensiveWeight * 100), color: 'var(--series-3)' },
  ];

  const goals = [
    {
      name: 'Net worth target',
      progress: netWorthProgress,
      figure: `${formatCompact(nw.netWorth)} of ${formatCompact(profile.target_net_worth)}`,
    },
    {
      name: 'Monthly savings goal',
      progress: savingsProgress,
      figure: `${formatCurrency(Math.max(0, flow.net))} of ${formatCurrency(profile.monthly_savings_goal)}`,
    },
    {
      name: 'Retirement horizon',
      progress: goalProgress(
        profile.current_age - 22,
        profile.target_retirement_age - 22,
      ),
      figure: `Age ${profile.current_age} → ${profile.target_retirement_age}`,
    },
  ];

  return (
    <>
      {/* --- Executive stat row --- */}
      <div className="grid stat-grid">
        <StatCard
          label="Total Net Worth"
          value={formatCurrency(nw.netWorth)}
          icon={Wallet}
          delta={formatSigned(nwDelta)}
          deltaDirection={nwDelta >= 0 ? 'up' : 'down'}
          caption="vs last month"
          accent="var(--series-1)"
        />
        <StatCard
          label="Monthly Cash Flow"
          value={formatSigned(flow.net)}
          icon={ArrowLeftRight}
          delta={formatPercent(flow.savingsRate)}
          deltaDirection={flow.net >= 0 ? 'up' : 'down'}
          caption="savings rate"
          accent="var(--series-3)"
        />
        <StatCard
          label="Debt-to-Income"
          value={dti != null ? `${dti.toFixed(2)}×` : '—'}
          icon={Scale}
          caption={`${formatCompact(nw.totalLiabilities)} liabilities`}
          accent="var(--series-4)"
        />
        <StatCard
          label="Goal Progress"
          value={formatPercent(netWorthProgress, 0)}
          icon={Target}
          caption="toward net-worth target"
          accent="var(--series-7)"
        />
      </div>

      {/* --- Trend + goals row --- */}
      <div className="grid cols-2 mt-18">
        <Card
          title="Net Worth Trajectory"
          subtitle="Total assets less liabilities · trailing 12 months"
        >
          <NetWorthArea data={nwSeries} />
        </Card>

        <Card title="Life Goals" subtitle="Progress toward long-term targets">
          <div>
            {goals.map((g) => (
              <div className="goal-row" key={g.name}>
                <div className="goal-head">
                  <span className="goal-name">{g.name}</span>
                  <span className="goal-figure tnum">{g.figure}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${g.progress * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* --- Cash flow + allocation row --- */}
      <div className="grid cols-2 mt-18">
        <Card
          title="Cash Flow — Income vs Expenses"
          subtitle="P&L view · trailing 6 months"
          action={
            <Legend
              items={[
                { label: 'Income', color: 'var(--series-1)' },
                { label: 'Expenses', color: 'var(--series-2)' },
              ]}
            />
          }
        >
          <CashFlowBars data={cashFlowTrend} />
        </Card>

        <Card title="Asset Allocation" subtitle="Growth vs defensive">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AllocationDonut
              data={allocation}
              centerValue={formatCompact(portfolio.totalValue)}
              centerLabel="Portfolio"
            />
            <Legend
              items={[
                { label: `Growth · ${formatPercent(portfolio.growthWeight, 0)}`, color: 'var(--series-1)' },
                { label: `Defensive · ${formatPercent(portfolio.defensiveWeight, 0)}`, color: 'var(--series-3)' },
              ]}
            />
          </div>
        </Card>
      </div>

      {/* --- Balance-sheet snapshot --- */}
      <div className="grid cols-3 mt-18">
        <StatCard
          label="Investments"
          value={formatCurrency(nw.breakdown.investments)}
          icon={LineChartIcon}
          delta={formatPercent(portfolio.roi)}
          deltaDirection={portfolio.roi >= 0 ? 'up' : 'down'}
          caption="total return"
          accent="var(--series-1)"
        />
        <StatCard
          label="Property (equity)"
          value={formatCurrency(nw.breakdown.property - nw.breakdown.loans)}
          icon={Building2}
          caption={`${formatCompact(nw.breakdown.property)} value · ${formatCompact(nw.breakdown.loans)} owing`}
          accent="var(--series-3)"
        />
        <StatCard
          label="Cash & Offset"
          value={formatCurrency(nw.breakdown.cash)}
          icon={PiggyBank}
          caption="liquid + offset balances"
          accent="var(--series-4)"
        />
      </div>
    </>
  );
}
