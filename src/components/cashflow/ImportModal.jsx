import { useMemo, useRef, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Field, Select, Button } from '../ui/Field.jsx';
import { makeTransaction } from '../../models/schema.js';
import {
  parseCSV,
  parseAmount,
  parseDate,
  looksLikeHeader,
  guessColumns,
} from '../../utils/csv.js';

const NONE = '-1';

/**
 * CSV / paste importer for transactions. Parses a bank or credit-card export,
 * lets the user map columns and fix the date order, previews the result, then
 * bulk-creates transactions. Uncategorized rows land in Other income/expense so
 * they can be re-categorized in the ledger afterwards.
 */
export default function ImportModal({ open, onClose, onImport, accounts }) {
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [hasHeader, setHasHeader] = useState(true);
  const [dateOrder, setDateOrder] = useState('dmy');
  const [map, setMap] = useState({ date: NONE, description: NONE, amount: NONE, debit: NONE, credit: NONE });
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [flip, setFlip] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Parse whenever the text changes; auto-detect header + column mapping.
  const rows = useMemo(() => (text.trim() ? parseCSV(text) : []), [text]);

  const applyAutoMap = (parsed) => {
    if (!parsed.length) return;
    const header = looksLikeHeader(parsed[0]);
    setHasHeader(header);
    if (header) {
      const g = guessColumns(parsed[0]);
      setMap({
        date: String(g.date), description: String(g.description),
        amount: String(g.amount), debit: String(g.debit), credit: String(g.credit),
      });
    } else {
      setMap({ date: '0', description: '1', amount: '2', debit: NONE, credit: NONE });
    }
  };

  const onText = (value) => { setText(value); applyAutoMap(parseCSV(value)); setError(''); };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onText(String(reader.result));
    reader.readAsText(file);
  };

  const header = hasHeader && rows.length ? rows[0] : null;
  const bodyRows = hasHeader ? rows.slice(1) : rows;
  const colCount = rows[0]?.length ?? 0;
  const colLabel = (i) => (header ? header[i] : `Column ${i + 1}`);

  // Build transactions from the current mapping; collect skip count.
  const built = useMemo(() => {
    const out = [];
    let skipped = 0;
    const di = Number(map.date);
    const desci = Number(map.description);
    const ai = Number(map.amount);
    const debi = Number(map.debit);
    const credi = Number(map.credit);

    for (const r of bodyRows) {
      const date = parseDate(r[di], dateOrder);
      let amount = NaN;
      if (debi >= 0 || credi >= 0) {
        const debit = debi >= 0 ? parseAmount(r[debi]) : NaN;
        const credit = credi >= 0 ? parseAmount(r[credi]) : NaN;
        if (Number.isFinite(credit) && credit !== 0) amount = Math.abs(credit);
        else if (Number.isFinite(debit) && debit !== 0) amount = -Math.abs(debit);
      } else if (ai >= 0) {
        amount = parseAmount(r[ai]);
      }
      if (flip && Number.isFinite(amount)) amount = -amount;

      const description = desci >= 0 ? String(r[desci] ?? '').trim() : '';
      if (!date || !Number.isFinite(amount) || amount === 0) { skipped += 1; continue; }

      out.push(
        makeTransaction({
          date,
          description: description || 'Imported transaction',
          amount,
          category: amount >= 0 ? 'other_income' : 'other_expense',
          account_id: accountId,
        }),
      );
    }
    return { out, skipped };
  }, [bodyRows, map, dateOrder, flip, accountId]);

  const doImport = async () => {
    if (built.out.length === 0) { setError('Nothing to import — check your column mapping.'); return; }
    setBusy(true);
    setError('');
    try {
      await onImport(built.out);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="card-title">Import transactions</div>
            <div className="card-subtitle">Upload a CSV from your bank, or paste rows below</div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Source */}
          <div className="import-source">
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Choose CSV file
            </button>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv" onChange={onFile} style={{ display: 'none' }} />
            <span className="muted-note">or paste below</span>
          </div>
          <textarea
            className="input import-textarea"
            value={text}
            onChange={(e) => onText(e.target.value)}
            placeholder={'Date,Description,Amount\n03/08/2026,Woolworths,-186.40\n15/08/2026,Salary,6340.00'}
            rows={5}
          />

          {rows.length > 0 && (
            <>
              {/* Options */}
              <div className="import-options">
                <Field label="Date column">
                  <Select value={map.date} onChange={(e) => setMap((m) => ({ ...m, date: e.target.value }))}>
                    <option value={NONE}>—</option>
                    {Array.from({ length: colCount }, (_, i) => <option key={i} value={String(i)}>{colLabel(i)}</option>)}
                  </Select>
                </Field>
                <Field label="Description column">
                  <Select value={map.description} onChange={(e) => setMap((m) => ({ ...m, description: e.target.value }))}>
                    <option value={NONE}>—</option>
                    {Array.from({ length: colCount }, (_, i) => <option key={i} value={String(i)}>{colLabel(i)}</option>)}
                  </Select>
                </Field>
                <Field label="Amount column" hint="Single signed column">
                  <Select value={map.amount} onChange={(e) => setMap((m) => ({ ...m, amount: e.target.value }))}>
                    <option value={NONE}>—</option>
                    {Array.from({ length: colCount }, (_, i) => <option key={i} value={String(i)}>{colLabel(i)}</option>)}
                  </Select>
                </Field>
                <Field label="Debit column" hint="If separate from credit">
                  <Select value={map.debit} onChange={(e) => setMap((m) => ({ ...m, debit: e.target.value }))}>
                    <option value={NONE}>—</option>
                    {Array.from({ length: colCount }, (_, i) => <option key={i} value={String(i)}>{colLabel(i)}</option>)}
                  </Select>
                </Field>
                <Field label="Credit column" hint="If separate from debit">
                  <Select value={map.credit} onChange={(e) => setMap((m) => ({ ...m, credit: e.target.value }))}>
                    <option value={NONE}>—</option>
                    {Array.from({ length: colCount }, (_, i) => <option key={i} value={String(i)}>{colLabel(i)}</option>)}
                  </Select>
                </Field>
                <Field label="Date format">
                  <Select value={dateOrder} onChange={(e) => setDateOrder(e.target.value)}>
                    <option value="dmy">DD/MM/YYYY (AU/UK)</option>
                    <option value="mdy">MM/DD/YYYY (US)</option>
                    <option value="auto">Auto-detect</option>
                  </Select>
                </Field>
                <Field label="Assign to account">
                  <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    <option value="">— none —</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </Select>
                </Field>
                <label className="import-check">
                  <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
                  First row is a header
                </label>
                <label className="import-check">
                  <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
                  Flip signs (income ↔ expense)
                </label>
              </div>

              {/* Preview */}
              <div className="import-preview">
                <div className="muted-note" style={{ marginBottom: 8 }}>
                  Preview — <strong>{built.out.length}</strong> ready to import
                  {built.skipped > 0 && <>, {built.skipped} skipped (unrecognized date/amount)</>}
                </div>
                <div style={{ overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                  <table className="ledger">
                    <thead>
                      <tr><th>Date</th><th>Description</th><th className="num">Amount</th></tr>
                    </thead>
                    <tbody>
                      {built.out.slice(0, 12).map((t) => (
                        <tr key={t.id}>
                          <td className="tnum" style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{t.date}</td>
                          <td>{t.description}</td>
                          <td className="num tnum" style={{ color: t.amount >= 0 ? 'var(--good-ink)' : 'var(--text-primary)', fontWeight: 600 }}>
                            {t.amount >= 0 ? '+' : '−'}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}
        </div>

        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={doImport} disabled={busy || built.out.length === 0}>
            {busy ? 'Importing…' : `Import ${built.out.length || ''}`.trim()}
          </Button>
        </div>
      </div>
    </div>
  );
}
