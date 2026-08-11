import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useData } from '../context/DataContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Field, TextInput, Select, Button } from '../components/ui/Field.jsx';
import { RISK_TOLERANCE } from '../models/schema.js';
import DemoNotice from '../components/ui/DemoNotice.jsx';

const NUMERIC = new Set([
  'current_age',
  'target_retirement_age',
  'target_net_worth',
  'monthly_savings_goal',
  'gross_annual_income',
]);

export default function Profile() {
  const { profile, isDemo, saveProfile } = useData();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Keep the form in sync when the underlying profile loads/changes.
  useEffect(() => setForm(profile), [profile]);

  const update = (key) => (e) => {
    const raw = e.target.value;
    setForm((f) => ({ ...f, [key]: NUMERIC.has(key) ? Number(raw) : raw }));
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await saveProfile(form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {isDemo && <DemoNotice />}
      <Card title="Client Profile" subtitle="Goals, risk tolerance and targets that drive the analytics">
        <form onSubmit={submit} className="form-grid">
          <Field label="Name">
            <TextInput type="text" value={form.display_name} onChange={update('display_name')} placeholder="Your name" />
          </Field>
          <Field label="Base currency">
            <TextInput type="text" value={form.base_currency} onChange={update('base_currency')} />
          </Field>

          <Field label="Current age">
            <TextInput type="number" min="16" max="100" value={form.current_age} onChange={update('current_age')} />
          </Field>
          <Field label="Target retirement age">
            <TextInput type="number" min="30" max="100" value={form.target_retirement_age} onChange={update('target_retirement_age')} />
          </Field>

          <Field label="Risk tolerance">
            <Select value={form.risk_tolerance} onChange={update('risk_tolerance')}>
              {Object.values(RISK_TOLERANCE).map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Gross annual income" hint="Used for the debt-to-income ratio">
            <TextInput type="number" min="0" step="1000" prefix="$" value={form.gross_annual_income} onChange={update('gross_annual_income')} />
          </Field>

          <Field label="Target net worth">
            <TextInput type="number" min="0" step="10000" prefix="$" value={form.target_net_worth} onChange={update('target_net_worth')} />
          </Field>
          <Field label="Monthly savings goal">
            <TextInput type="number" min="0" step="100" prefix="$" value={form.monthly_savings_goal} onChange={update('monthly_savings_goal')} />
          </Field>

          {error && <div className="auth-error" style={{ gridColumn: '1 / -1' }}>{error}</div>}

          <div className="form-actions">
            <Button type="submit" disabled={busy}>
              {saved ? (<><Check size={16} /> Saved</>) : busy ? 'Saving…' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
