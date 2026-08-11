import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, Database, ArrowLeftRight } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { Field, TextInput, Select, Button } from '../components/ui/Field.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import CashFlowBars from '../components/charts/CashFlowBars.jsx';
import {
  TRANSACTION_CATEGORIES,
  CATEGORY_BY_ID,
  CATEGORY_KIND,
  ACCOUNT_TYPE,
  makeTransaction,
  makeAccount,
} from '../models/schema.js';
import { COLLECTIONS } from '../models/collections.js';
import { cashFlowSummary, monthlyCashFlowTrend } from '../utils/finance.js';
import {
  formatCurrency,
  formatCurrencyCents,
  formatSigned,
  formatPercent,
} from '../utils/format.js';

const INCOME_CATS = TRANSACTION_CATEGORIES.filter((c) => c.kind === CATEGORY_KIND.INCOME);
const SPEND_CATS = TRANSACTION_CATEGORIES.filter((c) => c.kind !== CATEGORY_KIND.INCOME);

const emptyForm = {
  id: null,
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  type: 'expense', // 'income' | 'expense'
  category: 'groceries',
  account_id: '',
};

export default function CashFlow() {
  const { transactions, accounts, isDemo, upsert, remove, seedSampleData } = useData();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState(ACCOUNT_TYPE.CREDIT_CARD);

  const accountName = useMemo(() => {
    const m = new Map(accounts.map((a) => [a.id, a.name]));
    return (id) => m.get(id) ?? '—';
  }, [accounts]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [transactions],
  );
  const summary = useMemo(() => cashFlowSummary(transactions), [transactions]);
  const trend = useMemo(() => monthlyCashFlowTrend(transactions, 6), [transactions]);

  const catOptions = form.type === 'income' ? INCOME_CATS : SPEND_CATS;

  const resetForm = () => { setForm(emptyForm); setError(''); };

  const edit = (txn) => {
    const kind = CATEGORY_BY_ID[txn.category]?.kind;
    setForm({
      id: txn.id,
      date: txn.date,
      description: txn.description,
      amount: String(Math.abs(txn.amount)),
      type: kind === CATEGORY_KIND.INCOME ? 'income' : 'expense',
      category: txn.category,
      account_id: txn.account_id,
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const amt = Number(form.amount);
    if (!form.description.trim()) return setError('Add a description.');
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter an amount greater than zero.');

    // Income is stored positive, expenses negative.
    const signed = form.type === 'income' ? Math.abs(amt) : -Math.abs(amt);
    const txn = makeTransaction({
      id: form.id ?? undefined,
      date: form.date,
      description: form.description.trim(),
      amount: signed,
      category: form.category,
      account_id: form.account_id,
    });

    setBusy(true);
    try {
      await upsert(COLLECTIONS.TRANSACTIONS, txn, 'id');
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    try { await remove(COLLECTIONS.TRANSACTIONS, id); } catch (err) { setError(err.message); }
  };

  const addAccount = async (e) => {
    e.preventDefault();
    if (!acctName.trim()) return;
    const acct = makeAccount({ name: acctName.trim(), type: acctType });
    try {
      await upsert(COLLECTIONS.ACCOUNTS, acct, 'id');
      setAcctName('');
      if (!form.account_id) setForm((f) => ({ ...f, account_id: acct.id }));
    } catch (err) { setError(err.message); }
  };

  const seed = async () => {
    setBusy(true);
    try { await seedSampleData(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      {isDemo && <DemoNotice />}

      {/* Summary */}
      <div className="grid stat-grid">
        <StatCard label="Income" value={formatCurrency(summary.income)} accent="var(--series-1)" caption="this dataset" />
        <StatCard label="Expenses" value={formatCurrency(summary.expenses)} accent="var(--series-2)" caption="this dataset" />
        <StatCard label="Net" value={formatSigned(summary.net)} accent="var(--series-3)" caption="income − expenses" />
        <StatCard label="Savings rate" value={formatPercent(summary.savingsRate)} accent="var(--series-7)" caption="of income saved" />
      </div>

      {/* Add / edit transaction */}
      <div className="grid cols-2 mt-18" style={{ alignItems: 'start' }}>
        <Card title={form.id ? 'Edit transaction' : 'Add transaction'} subtitle="Record income or an expense">
          <form onSubmit={submit} className="form-grid">
            <Field label="Date">
              <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value;
                  const cats = type === 'income' ? INCOME_CATS : SPEND_CATS;
                  setForm((f) => ({ ...f, type, category: cats[0].id }));
                }}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </Field>
            <Field label="Description">
              <TextInput type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Woolworths" />
            </Field>
            <Field label="Amount">
              <TextInput type="number" min="0" step="0.01" prefix="$" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {catOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Account">
              <Select value={form.account_id} onChange={(e) => setForm((f) => ({ ...f, account_id: e.target.value }))}>
                <option value="">— select —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>

            {error && <div className="auth-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}

            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              {form.id && <Button variant="ghost" type="button" onClick={resetForm}><X size={16} /> Cancel</Button>}
              <Button type="submit" disabled={busy}><Plus size={16} /> {form.id ? 'Update' : 'Add'}</Button>
            </div>
          </form>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card title="Cash Flow — trailing 6 months" subtitle="Income vs expenses, derived from your transactions">
            <CashFlowBars data={trend} />
          </Card>

          <Card title="Accounts" subtitle="Cards and bank accounts transactions belong to">
            <form onSubmit={addAccount} className="inline-form">
              <TextInput type="text" value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="Account name" />
              <Select value={acctType} onChange={(e) => setAcctType(e.target.value)}>
                <option value={ACCOUNT_TYPE.CREDIT_CARD}>Credit card</option>
                <option value={ACCOUNT_TYPE.TRANSACTION}>Transaction</option>
                <option value={ACCOUNT_TYPE.SAVINGS}>Savings</option>
                <option value={ACCOUNT_TYPE.OFFSET}>Offset</option>
              </Select>
              <Button type="submit" variant="ghost"><Plus size={16} /></Button>
            </form>
            <div className="chip-row">
              {accounts.length === 0 && <span className="muted-note">No accounts yet — add one to tag transactions.</span>}
              {accounts.map((a) => (
                <span className="chip" key={a.id}>
                  {a.name}
                  <button type="button" onClick={() => remove(COLLECTIONS.ACCOUNTS, a.id)} aria-label={`Delete ${a.name}`}><X size={13} /></button>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Ledger */}
      <Card
        className="mt-18"
        title="Transactions"
        subtitle={`${transactions.length} record${transactions.length === 1 ? '' : 's'}`}
        bodyClass=""
        action={
          !isDemo && transactions.length === 0 ? (
            <Button variant="ghost" onClick={seed} disabled={busy}><Database size={16} /> Load sample data</Button>
          ) : null
        }
      >
        {sorted.length === 0 ? (
          <div className="placeholder-page" style={{ padding: '48px 24px' }}>
            <div className="placeholder-icon"><ArrowLeftRight size={24} /></div>
            <div className="placeholder-title">No transactions yet</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Add your first transaction above{!isDemo ? ', or load the sample dataset to explore.' : '.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="ledger">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th className="num">Amount</th>
                  <th style={{ width: 88 }}></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t) => {
                  const positive = t.amount >= 0;
                  return (
                    <tr key={t.id}>
                      <td className="tnum" style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{t.date}</td>
                      <td style={{ fontWeight: 520 }}>{t.description}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{CATEGORY_BY_ID[t.category]?.label ?? t.category}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{accountName(t.account_id)}</td>
                      <td className="num" style={{ color: positive ? 'var(--good-ink)' : 'var(--text-primary)', fontWeight: 600 }}>
                        {positive ? formatSigned(t.amount) : formatCurrencyCents(t.amount)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => edit(t)} aria-label="Edit" title="Edit"><Pencil size={15} /></button>
                          {!isDemo && <button onClick={() => del(t.id)} aria-label="Delete" title="Delete"><Trash2 size={15} /></button>}
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
