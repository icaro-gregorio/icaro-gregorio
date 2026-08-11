import { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, Database, Home, PiggyBank, TrendingDown } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { Field, TextInput, Select, Button } from '../components/ui/Field.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import { makeProperty, makePropertyCost } from '../models/schema.js';
import { COLLECTIONS } from '../models/collections.js';
import {
  monthlyInterest,
  offsetBenefit,
  trueCostOfOwnership,
  effectiveLoanBalance,
  toMonthly,
} from '../utils/finance.js';
import {
  formatCurrency,
  formatCurrencyCents,
  formatCompact,
  formatMonths,
} from '../utils/format.js';

const COST_CATEGORIES = [
  { id: 'council_rates', label: 'Council rates' },
  { id: 'water', label: 'Water' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'gas', label: 'Gas' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'strata', label: 'Strata / body corporate' },
  { id: 'other', label: 'Other' },
];
const COST_LABEL = Object.fromEntries(COST_CATEGORIES.map((c) => [c.id, c.label]));

const FREQUENCIES = ['weekly', 'fortnightly', 'monthly', 'quarterly', 'annually'];

const emptyProperty = {
  property_id: null,
  label: '',
  address: '',
  current_market_value: '',
  loan_principal_balance: '',
  interest_rate_pct: '', // shown as a percent, stored as a decimal
  offset_account_balance: '',
  loan_term: '',
  monthly_repayment: '',
};

const emptyCost = { id: null, label: '', category: 'council_rates', amount: '', frequency: 'annually' };

export default function RealEstate() {
  const { properties, propertyCosts, isDemo, upsert, remove, seedSampleData } = useData();
  const [selectedId, setSelectedId] = useState(null);
  const [pForm, setPForm] = useState(emptyProperty);
  const [cForm, setCForm] = useState(emptyCost);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Keep a valid selection as properties load/change.
  useEffect(() => {
    if (properties.length === 0) { setSelectedId(null); return; }
    if (!properties.some((p) => p.property_id === selectedId)) {
      setSelectedId(properties[0].property_id);
    }
  }, [properties, selectedId]);

  const selected = properties.find((p) => p.property_id === selectedId) ?? null;
  const costs = useMemo(
    () => propertyCosts.filter((c) => c.property_id === selectedId),
    [propertyCosts, selectedId],
  );

  const interest = selected ? monthlyInterest(selected) : null;
  const benefit = selected ? offsetBenefit(selected) : null;
  const trueCost = selected ? trueCostOfOwnership(selected, costs) : null;
  const equity = selected ? selected.current_market_value - selected.loan_principal_balance : 0;

  const setP = (key) => (e) => setPForm((f) => ({ ...f, [key]: e.target.value }));
  const setC = (key) => (e) => setCForm((f) => ({ ...f, [key]: e.target.value }));

  const editProperty = (p) => {
    setPForm({
      property_id: p.property_id,
      label: p.label,
      address: p.address || '',
      current_market_value: String(p.current_market_value),
      loan_principal_balance: String(p.loan_principal_balance),
      interest_rate_pct: String((p.interest_rate * 100).toFixed(4).replace(/\.?0+$/, '')),
      offset_account_balance: String(p.offset_account_balance),
      loan_term: String(p.loan_term),
      monthly_repayment: p.monthly_repayment ? String(p.monthly_repayment) : '',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProperty = () => { setPForm(emptyProperty); setError(''); };

  const submitProperty = async (e) => {
    e.preventDefault();
    setError('');
    if (!pForm.label.trim()) return setError('Give the property a label (e.g. "Primary residence").');
    const prop = makeProperty({
      property_id: pForm.property_id ?? undefined,
      label: pForm.label.trim(),
      address: pForm.address.trim(),
      current_market_value: Number(pForm.current_market_value) || 0,
      loan_principal_balance: Number(pForm.loan_principal_balance) || 0,
      interest_rate: (Number(pForm.interest_rate_pct) || 0) / 100,
      offset_account_balance: Number(pForm.offset_account_balance) || 0,
      loan_term: Number(pForm.loan_term) || 30,
      monthly_repayment: pForm.monthly_repayment ? Number(pForm.monthly_repayment) : null,
    });
    setBusy(true);
    try {
      await upsert(COLLECTIONS.PROPERTIES, prop, 'property_id');
      setSelectedId(prop.property_id);
      resetProperty();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCost = async (e) => {
    e.preventDefault();
    if (!selected) return setError('Add a property first.');
    if (!cForm.label.trim()) return setError('Name the cost.');
    const amount = Number(cForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) return setError('Enter a cost amount greater than zero.');
    const cost = makePropertyCost({
      id: cForm.id ?? undefined,
      property_id: selectedId,
      label: cForm.label.trim(),
      category: cForm.category,
      amount,
      frequency: cForm.frequency,
    });
    try {
      await upsert(COLLECTIONS.PROPERTY_COSTS, cost, 'id');
      setCForm(emptyCost);
      setError('');
    } catch (err) { setError(err.message); }
  };

  const seed = async () => {
    setBusy(true);
    try { await seedSampleData(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      {isDemo && <DemoNotice />}

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 18, alignItems: 'center' }}>
          {properties.map((p) => (
            <button
              key={p.property_id}
              className={`chip${p.property_id === selectedId ? ' chip-active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedId(p.property_id)}
            >
              <Home size={13} /> {p.label}
            </button>
          ))}
          {selected && (
            <button className="btn btn-ghost" style={{ padding: '5px 12px', fontSize: 12.5 }} onClick={() => editProperty(selected)}>
              <Pencil size={14} /> Edit details
            </button>
          )}
        </div>
      )}

      {/* Summary for selected property */}
      {selected && (
        <div className="grid stat-grid">
          <StatCard label="Equity" value={formatCurrency(equity)} icon={Home} accent="var(--series-1)" caption={`${formatCompact(selected.current_market_value)} value`} />
          <StatCard label="Loan Balance" value={formatCurrency(selected.loan_principal_balance)} accent="var(--series-2)" caption={`${(selected.interest_rate * 100).toFixed(2)}% p.a.`} />
          <StatCard label="Offset Balance" value={formatCurrency(selected.offset_account_balance)} icon={PiggyBank} accent="var(--series-3)" caption="reduces interest" />
          <StatCard label="Monthly Interest" value={formatCurrency(interest.withOffset)} icon={TrendingDown} accent="var(--series-4)" caption={`on ${formatCompact(effectiveLoanBalance(selected.loan_principal_balance, selected.offset_account_balance))} effective`} />
        </div>
      )}

      {/* Property form + offset calculator */}
      <div className="grid cols-2 mt-18" style={{ alignItems: 'start' }}>
        <Card title={pForm.property_id ? 'Edit property' : 'Add property'} subtitle="Valuation and mortgage details">
          <form onSubmit={submitProperty} className="form-grid">
            <Field label="Label">
              <TextInput type="text" value={pForm.label} onChange={setP('label')} placeholder="Primary residence" />
            </Field>
            <Field label="Address">
              <TextInput type="text" value={pForm.address} onChange={setP('address')} placeholder="12 Banksia St, VIC" />
            </Field>
            <Field label="Market value">
              <TextInput type="number" min="0" step="1000" prefix="$" value={pForm.current_market_value} onChange={setP('current_market_value')} placeholder="0" />
            </Field>
            <Field label="Loan principal">
              <TextInput type="number" min="0" step="1000" prefix="$" value={pForm.loan_principal_balance} onChange={setP('loan_principal_balance')} placeholder="0" />
            </Field>
            <Field label="Interest rate" hint="Annual %, e.g. 5.89">
              <TextInput type="number" min="0" step="0.01" value={pForm.interest_rate_pct} onChange={setP('interest_rate_pct')} placeholder="5.89" />
            </Field>
            <Field label="Offset balance">
              <TextInput type="number" min="0" step="1000" prefix="$" value={pForm.offset_account_balance} onChange={setP('offset_account_balance')} placeholder="0" />
            </Field>
            <Field label="Remaining term" hint="Years">
              <TextInput type="number" min="0" step="1" value={pForm.loan_term} onChange={setP('loan_term')} placeholder="30" />
            </Field>
            <Field label="Monthly repayment" hint="Optional — derived if blank">
              <TextInput type="number" min="0" step="10" prefix="$" value={pForm.monthly_repayment} onChange={setP('monthly_repayment')} placeholder="auto" />
            </Field>

            {error && <div className="auth-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              {pForm.property_id && <Button variant="ghost" type="button" onClick={resetProperty}><X size={16} /> Cancel</Button>}
              {selected && pForm.property_id === selected.property_id && !isDemo && (
                <Button variant="ghost" type="button" onClick={() => remove(COLLECTIONS.PROPERTIES, selected.property_id)}><Trash2 size={16} /> Delete</Button>
              )}
              <Button type="submit" disabled={busy}><Plus size={16} /> {pForm.property_id ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </Card>

        {selected ? (
          <Card title="Offset Calculator" subtitle="Benefit of your offset balance">
            <div className="calc-grid">
              <div className="calc-row">
                <span>Interest without offset</span>
                <span className="tnum">{formatCurrencyCents(interest.withoutOffset)}/mo</span>
              </div>
              <div className="calc-row">
                <span>Interest with offset</span>
                <span className="tnum">{formatCurrencyCents(interest.withOffset)}/mo</span>
              </div>
              <div className="calc-row calc-highlight">
                <span>Interest saved</span>
                <span className="tnum">{formatCurrencyCents(benefit.monthlyInterestSaving)}/mo · {formatCurrency(benefit.annualInterestSaving)}/yr</span>
              </div>
              <div className="calc-divider" />
              <div className="calc-row">
                <span>Payoff without offset</span>
                <span className="tnum">{formatMonths(benefit.monthsWithoutOffset)}</span>
              </div>
              <div className="calc-row">
                <span>Payoff with offset</span>
                <span className="tnum">{formatMonths(benefit.monthsWithOffset)}</span>
              </div>
              <div className="calc-row calc-highlight">
                <span>Loan term reduction</span>
                <span className="tnum">{formatMonths(benefit.monthsReduction)} sooner</span>
              </div>
              <div className="calc-note">
                Based on a {formatCurrencyCents(benefit.monthlyRepayment)} monthly repayment. Interest is charged on
                {' '}(loan − offset) = {formatCompact(effectiveLoanBalance(selected.loan_principal_balance, selected.offset_account_balance))}.
              </div>
            </div>
          </Card>
        ) : (
          <Card title="Offset Calculator" subtitle="Benefit of your offset balance">
            <p className="muted-note">Add a property with a mortgage to see interest savings and loan-term reduction.</p>
          </Card>
        )}
      </div>

      {/* Running costs + true cost of ownership */}
      <div className="grid cols-2 mt-18" style={{ alignItems: 'start' }}>
        <Card title="Running Costs" subtitle="Recurring costs of owning this property" bodyClass="">
          <div className="card-pad">
            <form onSubmit={submitCost} className="form-grid">
              <Field label="Cost">
                <TextInput type="text" value={cForm.label} onChange={setC('label')} placeholder="Council rates" />
              </Field>
              <Field label="Category">
                <Select value={cForm.category} onChange={setC('category')}>
                  {COST_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label="Amount">
                <TextInput type="number" min="0" step="0.01" prefix="$" value={cForm.amount} onChange={setC('amount')} placeholder="0.00" />
              </Field>
              <Field label="Frequency">
                <Select value={cForm.frequency} onChange={setC('frequency')}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                </Select>
              </Field>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                {cForm.id && <Button variant="ghost" type="button" onClick={() => setCForm(emptyCost)}><X size={16} /> Cancel</Button>}
                <Button type="submit" disabled={!selected}><Plus size={16} /> {cForm.id ? 'Update' : 'Add cost'}</Button>
              </div>
            </form>
          </div>

          {costs.length > 0 && (
            <table className="ledger">
              <thead>
                <tr><th>Cost</th><th className="num">Amount</th><th>Frequency</th><th className="num">Monthly</th><th style={{ width: 88 }}></th></tr>
              </thead>
              <tbody>
                {costs.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 520 }}>{c.label}<div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{COST_LABEL[c.category] ?? c.category}</div></td>
                    <td className="num tnum">{formatCurrencyCents(c.amount)}</td>
                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.frequency}</td>
                    <td className="num tnum">{formatCurrencyCents(toMonthly(c.amount, c.frequency))}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => { setCForm({ id: c.id, label: c.label, category: c.category, amount: String(c.amount), frequency: c.frequency }); }} aria-label="Edit" title="Edit"><Pencil size={15} /></button>
                        {!isDemo && <button onClick={() => remove(COLLECTIONS.PROPERTY_COSTS, c.id)} aria-label="Delete" title="Delete"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="True Cost of Ownership" subtitle="Net interest plus running costs">
          {selected ? (
            <div className="calc-grid">
              <div className="calc-row"><span>Net mortgage interest</span><span className="tnum">{formatCurrencyCents(trueCost.monthlyInterest)}/mo</span></div>
              <div className="calc-row"><span>Running costs</span><span className="tnum">{formatCurrencyCents(trueCost.monthlyRunningCosts)}/mo</span></div>
              <div className="calc-divider" />
              <div className="calc-row calc-highlight"><span>Total monthly</span><span className="tnum">{formatCurrencyCents(trueCost.monthlyTotal)}/mo</span></div>
              <div className="calc-row calc-highlight"><span>Total annual</span><span className="tnum">{formatCurrency(trueCost.annualTotal)}/yr</span></div>
              <div className="calc-note">
                This is the ongoing cost of holding the home — interest actually paid (after offset) plus every recurring
                bill. It excludes principal repayments, which build your equity rather than being a cost.
              </div>
            </div>
          ) : (
            <p className="muted-note">
              Add a property to see its true cost.
              {!isDemo && properties.length === 0 && (
                <> {' '}<button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={seed} disabled={busy}><Database size={16} /> Load sample data</button></>
              )}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
