import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, Database, LineChart as LineChartIcon } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { Field, TextInput, Select, Button } from '../components/ui/Field.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import AllocationDonut from '../components/charts/AllocationDonut.jsx';
import { ASSET_TYPE, ASSET_CLASS, makeInvestment } from '../models/schema.js';
import { COLLECTIONS } from '../models/collections.js';
import {
  portfolioSummary,
  investmentMetrics,
  assetClassOf,
  annualizedReturn,
} from '../utils/finance.js';
import {
  formatCurrency,
  formatCompact,
  formatSigned,
  formatSignedPercent,
  formatPercent,
} from '../utils/format.js';

const ASSET_TYPES = Object.values(ASSET_TYPE);

const emptyForm = {
  asset_id: null,
  ticker: '',
  name: '',
  asset_type: ASSET_TYPE.ETF.id,
  asset_class: ASSET_CLASS.GROWTH,
  units_held: '',
  average_purchase_price: '',
  current_valuation: '',
  brokerage_platform: '',
  purchase_date: '',
};

function yearsSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const years = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return years > 0.05 ? years : null;
}

export default function Investments() {
  const { investments, isDemo, upsert, remove, seedSampleData } = useData();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const portfolio = useMemo(() => portfolioSummary(investments), [investments]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => { setForm(emptyForm); setError(''); };

  const edit = (inv) => {
    setForm({
      asset_id: inv.asset_id,
      ticker: inv.ticker,
      name: inv.name,
      asset_type: inv.asset_type,
      asset_class: assetClassOf(inv),
      units_held: String(inv.units_held),
      average_purchase_price: String(inv.average_purchase_price),
      current_valuation: String(inv.current_valuation),
      brokerage_platform: inv.brokerage_platform,
      purchase_date: inv.purchase_date || '',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() && !form.ticker.trim()) return setError('Add a ticker or a name.');
    const units = Number(form.units_held);
    const buy = Number(form.average_purchase_price);
    const now = Number(form.current_valuation);
    if (!Number.isFinite(units) || units <= 0) return setError('Units held must be greater than zero.');
    if (!Number.isFinite(buy) || buy < 0) return setError('Enter a valid average purchase price.');
    if (!Number.isFinite(now) || now < 0) return setError('Enter a valid current price/valuation.');

    const inv = makeInvestment({
      asset_id: form.asset_id ?? undefined,
      ticker: form.ticker.trim().toUpperCase(),
      name: form.name.trim(),
      asset_type: form.asset_type,
      asset_class: form.asset_class,
      units_held: units,
      average_purchase_price: buy,
      current_valuation: now,
      brokerage_platform: form.brokerage_platform.trim(),
      purchase_date: form.purchase_date,
    });

    setBusy(true);
    try {
      await upsert(COLLECTIONS.INVESTMENTS, inv, 'asset_id');
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const seed = async () => {
    setBusy(true);
    try { await seedSampleData(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const allocation = [
    { name: 'Growth', value: Math.round(portfolio.growthWeight * 100), color: 'var(--series-1)' },
    { name: 'Defensive', value: Math.round(portfolio.defensiveWeight * 100), color: 'var(--series-3)' },
  ];

  const typeLabel = (id) => ASSET_TYPES.find((t) => t.id === id)?.label ?? id;

  return (
    <>
      {isDemo && <DemoNotice />}

      {/* Summary */}
      <div className="grid stat-grid">
        <StatCard label="Portfolio Value" value={formatCurrency(portfolio.totalValue)} accent="var(--series-1)" caption={`${investments.length} holding${investments.length === 1 ? '' : 's'}`} />
        <StatCard
          label="Total Return"
          value={formatSigned(portfolio.totalGain)}
          delta={formatSignedPercent(portfolio.roi)}
          deltaDirection={portfolio.totalGain >= 0 ? 'up' : 'down'}
          caption="since purchase"
          accent="var(--series-3)"
        />
        <StatCard label="Invested (cost base)" value={formatCurrency(portfolio.totalCost)} accent="var(--series-4)" caption="total paid" />
        <StatCard label="Growth / Defensive" value={`${formatPercent(portfolio.growthWeight, 0)} / ${formatPercent(portfolio.defensiveWeight, 0)}`} accent="var(--series-7)" caption="asset mix" />
      </div>

      {/* Add / edit + allocation */}
      <div className="grid cols-2 mt-18" style={{ alignItems: 'start' }}>
        <Card title={form.asset_id ? 'Edit holding' : 'Add holding'} subtitle="Shares, ETFs, superannuation and more">
          <form onSubmit={submit} className="form-grid">
            <Field label="Ticker" hint="e.g. VAS.AX (leave blank for super)">
              <TextInput type="text" value={form.ticker} onChange={set('ticker')} placeholder="VAS.AX" />
            </Field>
            <Field label="Name">
              <TextInput type="text" value={form.name} onChange={set('name')} placeholder="Vanguard Australian Shares" />
            </Field>
            <Field label="Asset type">
              <Select
                value={form.asset_type}
                onChange={(e) => {
                  const id = e.target.value;
                  const t = ASSET_TYPES.find((x) => x.id === id);
                  setForm((f) => ({ ...f, asset_type: id, asset_class: t?.defaultClass ?? f.asset_class }));
                }}
              >
                {ASSET_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Class">
              <Select value={form.asset_class} onChange={set('asset_class')}>
                <option value={ASSET_CLASS.GROWTH}>Growth</option>
                <option value={ASSET_CLASS.DEFENSIVE}>Defensive</option>
              </Select>
            </Field>
            <Field label="Units held" hint="For super, enter 1 and use the balance as price">
              <TextInput type="number" min="0" step="any" value={form.units_held} onChange={set('units_held')} placeholder="0" />
            </Field>
            <Field label="Brokerage / platform">
              <TextInput type="text" value={form.brokerage_platform} onChange={set('brokerage_platform')} placeholder="CommSec, Pearler, AustralianSuper" />
            </Field>
            <Field label="Avg purchase price">
              <TextInput type="number" min="0" step="any" prefix="$" value={form.average_purchase_price} onChange={set('average_purchase_price')} placeholder="0.00" />
            </Field>
            <Field label="Current price / valuation">
              <TextInput type="number" min="0" step="any" prefix="$" value={form.current_valuation} onChange={set('current_valuation')} placeholder="0.00" />
            </Field>
            <Field label="Purchase date" hint="Enables annualized return">
              <TextInput type="date" value={form.purchase_date} onChange={set('purchase_date')} />
            </Field>

            {error && <div className="auth-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              {form.asset_id && <Button variant="ghost" type="button" onClick={resetForm}><X size={16} /> Cancel</Button>}
              <Button type="submit" disabled={busy}><Plus size={16} /> {form.asset_id ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card title="Asset Allocation" subtitle="Growth vs defensive">
            {portfolio.totalValue > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AllocationDonut data={allocation} centerValue={formatCompact(portfolio.totalValue)} centerLabel="Portfolio" height={180} />
                <div className="legend">
                  <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--series-1)' }} />Growth · {formatPercent(portfolio.growthWeight, 0)}</span>
                  <span className="legend-item"><span className="legend-swatch" style={{ background: 'var(--series-3)' }} />Defensive · {formatPercent(portfolio.defensiveWeight, 0)}</span>
                </div>
              </div>
            ) : (
              <p className="muted-note">Add a holding to see your allocation.</p>
            )}
          </Card>

          {portfolio.byType.length > 0 && (
            <Card title="By Asset Type" subtitle="Share of portfolio">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {portfolio.byType.map((t) => (
                  <div key={t.id}>
                    <div className="goal-head" style={{ marginBottom: 6 }}>
                      <span className="goal-name">{typeLabel(t.id)}</span>
                      <span className="goal-figure tnum">{formatCompact(t.value)} · {formatPercent(t.weight, 0)}</span>
                    </div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${t.weight * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Holdings table */}
      <Card
        className="mt-18"
        title="Holdings"
        subtitle={`${investments.length} position${investments.length === 1 ? '' : 's'}`}
        bodyClass=""
        action={!isDemo && investments.length === 0 ? <Button variant="ghost" onClick={seed} disabled={busy}><Database size={16} /> Load sample data</Button> : null}
      >
        {portfolio.holdings.length === 0 ? (
          <div className="placeholder-page" style={{ padding: '48px 24px' }}>
            <div className="placeholder-icon"><LineChartIcon size={24} /></div>
            <div className="placeholder-title">No holdings yet</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Add a share, ETF or super balance above{!isDemo ? ', or load the sample dataset.' : '.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ledger">
              <thead>
                <tr>
                  <th>Holding</th>
                  <th>Type</th>
                  <th className="num">Units</th>
                  <th className="num">Value</th>
                  <th className="num">Weight</th>
                  <th className="num">Return</th>
                  <th className="num">Ann.</th>
                  <th style={{ width: 88 }}></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdings.map((h) => {
                  const m = investmentMetrics(h);
                  const yrs = yearsSince(h.purchase_date);
                  const ann = yrs ? annualizedReturn(m.roi, yrs) : null;
                  const up = m.gain >= 0;
                  return (
                    <tr key={h.asset_id}>
                      <td>
                        <div style={{ fontWeight: 560 }}>{h.ticker || h.name}</div>
                        {h.ticker && h.name && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.name}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{typeLabel(h.asset_type)}</td>
                      <td className="num tnum">{h.units_held.toLocaleString()}</td>
                      <td className="num tnum" style={{ fontWeight: 600 }}>{formatCurrency(m.value)}</td>
                      <td className="num tnum" style={{ color: 'var(--text-secondary)' }}>{formatPercent(h.weight, 0)}</td>
                      <td className="num tnum" style={{ color: up ? 'var(--good-ink)' : 'var(--critical)', fontWeight: 600 }}>{formatSignedPercent(m.roi)}</td>
                      <td className="num tnum" style={{ color: 'var(--text-secondary)' }}>{ann != null ? formatSignedPercent(ann) : '—'}</td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => edit(h)} aria-label="Edit" title="Edit"><Pencil size={15} /></button>
                          {!isDemo && <button onClick={() => remove(COLLECTIONS.INVESTMENTS, h.asset_id)} aria-label="Delete" title="Delete"><Trash2 size={15} /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
