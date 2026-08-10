/**
 * Data Schema & Models
 * ====================
 *
 * This file is the single source of truth for the application's data shapes.
 * It uses JSDoc typedefs (so editors give you autocomplete + type-checking
 * without a build step) plus factory functions that create well-formed,
 * defaulted documents.
 *
 * Firestore layout (all private, per authenticated user):
 *
 *   users/{uid}
 *     ├── (Adviser Profile fields live on the user doc)
 *     ├── transactions/{id}
 *     ├── investments/{asset_id}
 *     ├── properties/{property_id}
 *     └── propertyCosts/{id}      (each linked to a property via property_id)
 *
 * Monetary values are stored as numbers in the account's major currency unit
 * (AUD dollars). Amounts follow a signed convention: income/credits are
 * positive, expenses/debits are negative — this keeps cash-flow arithmetic and
 * P&L-style summaries straightforward (sum a period to get its net delta).
 */

import { COLLECTIONS } from './collections.js';

export { COLLECTIONS };

/* ------------------------------------------------------------------ */
/*  Enumerations                                                        */
/* ------------------------------------------------------------------ */

/** High-level buckets used for P&L-style cash-flow reporting. */
export const CATEGORY_KIND = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer', // internal movement between own accounts; net-zero to net worth
});

/**
 * Standard transaction categories with their reporting kind. A robust
 * categorization system maps every transaction onto exactly one of these.
 * Grouped so the cash-flow page can render P&L sections in a stable order.
 */
export const TRANSACTION_CATEGORIES = Object.freeze([
  // --- Income ---
  { id: 'salary', label: 'Salary & Wages', kind: CATEGORY_KIND.INCOME, group: 'Employment' },
  { id: 'investment_income', label: 'Dividends & Distributions', kind: CATEGORY_KIND.INCOME, group: 'Investments' },
  { id: 'rental_income', label: 'Rental Income', kind: CATEGORY_KIND.INCOME, group: 'Property' },
  { id: 'interest_income', label: 'Interest Income', kind: CATEGORY_KIND.INCOME, group: 'Banking' },
  { id: 'other_income', label: 'Other Income', kind: CATEGORY_KIND.INCOME, group: 'Other' },

  // --- Expenses ---
  { id: 'housing', label: 'Mortgage & Rent', kind: CATEGORY_KIND.EXPENSE, group: 'Housing' },
  { id: 'property_running', label: 'Property Running Costs', kind: CATEGORY_KIND.EXPENSE, group: 'Housing' },
  { id: 'utilities', label: 'Utilities', kind: CATEGORY_KIND.EXPENSE, group: 'Housing' },
  { id: 'groceries', label: 'Groceries', kind: CATEGORY_KIND.EXPENSE, group: 'Living' },
  { id: 'dining', label: 'Dining & Takeaway', kind: CATEGORY_KIND.EXPENSE, group: 'Living' },
  { id: 'transport', label: 'Transport & Fuel', kind: CATEGORY_KIND.EXPENSE, group: 'Living' },
  { id: 'health', label: 'Health & Medical', kind: CATEGORY_KIND.EXPENSE, group: 'Living' },
  { id: 'insurance', label: 'Insurance', kind: CATEGORY_KIND.EXPENSE, group: 'Living' },
  { id: 'subscriptions', label: 'Subscriptions', kind: CATEGORY_KIND.EXPENSE, group: 'Discretionary' },
  { id: 'entertainment', label: 'Entertainment', kind: CATEGORY_KIND.EXPENSE, group: 'Discretionary' },
  { id: 'shopping', label: 'Shopping', kind: CATEGORY_KIND.EXPENSE, group: 'Discretionary' },
  { id: 'travel', label: 'Travel & Holidays', kind: CATEGORY_KIND.EXPENSE, group: 'Discretionary' },
  { id: 'education', label: 'Education', kind: CATEGORY_KIND.EXPENSE, group: 'Discretionary' },
  { id: 'fees_interest', label: 'Fees & Interest', kind: CATEGORY_KIND.EXPENSE, group: 'Finance' },
  { id: 'tax', label: 'Tax', kind: CATEGORY_KIND.EXPENSE, group: 'Finance' },
  { id: 'other_expense', label: 'Other Expense', kind: CATEGORY_KIND.EXPENSE, group: 'Other' },

  // --- Transfers / Investing ---
  { id: 'savings_transfer', label: 'Savings & Offset', kind: CATEGORY_KIND.TRANSFER, group: 'Transfers' },
  { id: 'investment_buy', label: 'Investment Contribution', kind: CATEGORY_KIND.TRANSFER, group: 'Transfers' },
]);

/** Map for O(1) lookup of a category by id. */
export const CATEGORY_BY_ID = Object.freeze(
  Object.fromEntries(TRANSACTION_CATEGORIES.map((c) => [c.id, c])),
);

/** Account types a transaction can belong to. */
export const ACCOUNT_TYPE = Object.freeze({
  CREDIT_CARD: 'credit_card',
  TRANSACTION: 'transaction', // everyday bank account
  SAVINGS: 'savings',
  OFFSET: 'offset',
});

/** Investment asset types, tagged as defensive or growth for allocation views. */
export const ASSET_TYPE = Object.freeze({
  ETF: { id: 'etf', label: 'ETF', defaultClass: 'growth' },
  DIRECT_EQUITY: { id: 'direct_equity', label: 'Direct Equities', defaultClass: 'growth' },
  SUPERANNUATION: { id: 'superannuation', label: 'Superannuation', defaultClass: 'growth' },
  CASH: { id: 'cash', label: 'Cash & Term Deposits', defaultClass: 'defensive' },
  FIXED_INCOME: { id: 'fixed_income', label: 'Bonds & Fixed Income', defaultClass: 'defensive' },
  PROPERTY: { id: 'property', label: 'Property', defaultClass: 'growth' },
});

/** Growth vs defensive — the two asset classes for allocation analysis. */
export const ASSET_CLASS = Object.freeze({
  GROWTH: 'growth',
  DEFENSIVE: 'defensive',
});

export const RISK_TOLERANCE = Object.freeze({
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  BALANCED: 'balanced',
  GROWTH: 'growth',
  AGGRESSIVE: 'aggressive',
});

/* ------------------------------------------------------------------ */
/*  Typedefs                                                            */
/* ------------------------------------------------------------------ */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} date            ISO date string (YYYY-MM-DD)
 * @property {number} amount          Signed AUD. Positive = credit/income, negative = debit/expense.
 * @property {string} description
 * @property {string} category        One of TRANSACTION_CATEGORIES[].id
 * @property {string} account_id      References an Account (e.g. a specific credit card)
 * @property {boolean} [cleared]      Whether the transaction has settled
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name            e.g. "CBA Ultimate Awards Visa"
 * @property {string} type            One of ACCOUNT_TYPE
 * @property {string} [institution]
 * @property {number} [current_balance]
 * @property {number} [credit_limit]  For credit cards
 */

/**
 * @typedef {Object} Investment
 * @property {string} asset_id
 * @property {string} ticker                 e.g. "VAS.AX", "VGS.AX" (ASX codes)
 * @property {string} name
 * @property {string} asset_type             One of ASSET_TYPE[].id (ETF, Direct Equities, Superannuation, ...)
 * @property {string} asset_class            growth | defensive (overrides the asset_type default when set)
 * @property {number} units_held
 * @property {number} average_purchase_price Per-unit cost base in AUD
 * @property {number} current_valuation      Current per-unit market price in AUD
 * @property {string} brokerage_platform     e.g. "CommSec", "Pearler", "AustralianSuper"
 * @property {string} [purchase_date]
 */

/**
 * @typedef {Object} Property
 * @property {string} property_id
 * @property {string} label
 * @property {string} [address]
 * @property {number} current_market_value
 * @property {number} loan_principal_balance
 * @property {number} interest_rate           Annual nominal rate as a decimal (e.g. 0.0589)
 * @property {number} offset_account_balance  Balance in the linked offset account
 * @property {number} loan_term               Remaining loan term in years
 * @property {number} [monthly_repayment]     Scheduled principal+interest repayment
 * @property {string} [repayment_frequency]   'monthly' | 'fortnightly' | 'weekly'
 * @property {boolean} [is_primary_residence]
 */

/**
 * @typedef {Object} PropertyCost
 * @property {string} id
 * @property {string} property_id     References a Property
 * @property {string} label           e.g. "Council rates", "Water", "Building insurance"
 * @property {string} category        council_rates | water | electricity | gas | insurance | maintenance | strata | other
 * @property {number} amount          AUD amount for one occurrence (positive)
 * @property {string} frequency       'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually'
 * @property {string} [date]          Most recent charge date
 */

/**
 * @typedef {Object} AdviserProfile   The "Client Master" record.
 * @property {string} display_name
 * @property {number} target_retirement_age
 * @property {number} current_age
 * @property {string} risk_tolerance          One of RISK_TOLERANCE
 * @property {number} target_net_worth        AUD
 * @property {number} monthly_savings_goal    AUD
 * @property {number} [gross_annual_income]   Used for Debt-to-Income
 * @property {string} [base_currency]         Defaults to 'AUD'
 */

/* ------------------------------------------------------------------ */
/*  Factory functions — create defaulted, well-formed documents        */
/* ------------------------------------------------------------------ */

const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** @returns {Transaction} */
export function makeTransaction(partial = {}) {
  return {
    id: partial.id ?? uid('txn'),
    date: partial.date ?? new Date().toISOString().slice(0, 10),
    amount: Number(partial.amount ?? 0),
    description: partial.description ?? '',
    category: partial.category ?? 'other_expense',
    account_id: partial.account_id ?? '',
    cleared: partial.cleared ?? true,
    notes: partial.notes ?? '',
  };
}

/** @returns {Account} */
export function makeAccount(partial = {}) {
  return {
    id: partial.id ?? uid('acct'),
    name: partial.name ?? '',
    type: partial.type ?? ACCOUNT_TYPE.TRANSACTION,
    institution: partial.institution ?? '',
    current_balance: Number(partial.current_balance ?? 0),
    credit_limit: partial.credit_limit != null ? Number(partial.credit_limit) : null,
  };
}

/** @returns {Investment} */
export function makeInvestment(partial = {}) {
  const typeId = partial.asset_type ?? ASSET_TYPE.ETF.id;
  const defaultClass =
    Object.values(ASSET_TYPE).find((t) => t.id === typeId)?.defaultClass ??
    ASSET_CLASS.GROWTH;
  return {
    asset_id: partial.asset_id ?? uid('inv'),
    ticker: partial.ticker ?? '',
    name: partial.name ?? '',
    asset_type: typeId,
    asset_class: partial.asset_class ?? defaultClass,
    units_held: Number(partial.units_held ?? 0),
    average_purchase_price: Number(partial.average_purchase_price ?? 0),
    current_valuation: Number(partial.current_valuation ?? 0),
    brokerage_platform: partial.brokerage_platform ?? '',
    purchase_date: partial.purchase_date ?? '',
  };
}

/** @returns {Property} */
export function makeProperty(partial = {}) {
  return {
    property_id: partial.property_id ?? uid('prop'),
    label: partial.label ?? '',
    address: partial.address ?? '',
    current_market_value: Number(partial.current_market_value ?? 0),
    loan_principal_balance: Number(partial.loan_principal_balance ?? 0),
    interest_rate: Number(partial.interest_rate ?? 0),
    offset_account_balance: Number(partial.offset_account_balance ?? 0),
    loan_term: Number(partial.loan_term ?? 30),
    monthly_repayment: partial.monthly_repayment != null ? Number(partial.monthly_repayment) : null,
    repayment_frequency: partial.repayment_frequency ?? 'monthly',
    is_primary_residence: partial.is_primary_residence ?? true,
  };
}

/** @returns {PropertyCost} */
export function makePropertyCost(partial = {}) {
  return {
    id: partial.id ?? uid('cost'),
    property_id: partial.property_id ?? '',
    label: partial.label ?? '',
    category: partial.category ?? 'other',
    amount: Number(partial.amount ?? 0),
    frequency: partial.frequency ?? 'annually',
    date: partial.date ?? new Date().toISOString().slice(0, 10),
  };
}

/** @returns {AdviserProfile} */
export function makeAdviserProfile(partial = {}) {
  return {
    display_name: partial.display_name ?? '',
    current_age: Number(partial.current_age ?? 35),
    target_retirement_age: Number(partial.target_retirement_age ?? 60),
    risk_tolerance: partial.risk_tolerance ?? RISK_TOLERANCE.BALANCED,
    target_net_worth: Number(partial.target_net_worth ?? 0),
    monthly_savings_goal: Number(partial.monthly_savings_goal ?? 0),
    gross_annual_income: Number(partial.gross_annual_income ?? 0),
    base_currency: partial.base_currency ?? 'AUD',
  };
}
