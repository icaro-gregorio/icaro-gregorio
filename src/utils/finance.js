/**
 * Financial Logic & Advising Engine
 * =================================
 *
 * Pure functions (no I/O, no React) implementing the analytical calculations a
 * financial adviser uses across a client portfolio. Everything here is unit-
 * testable in isolation. Conventions:
 *   - Rates are annual nominal decimals (0.0589 = 5.89% p.a.).
 *   - Amounts are AUD in major units.
 *   - Transaction amounts are signed (income +, expense −).
 */

import { CATEGORY_BY_ID, CATEGORY_KIND, ASSET_CLASS, ASSET_TYPE } from '../models/schema.js';

const MONTHS_PER_YEAR = 12;

/* ------------------------------------------------------------------ */
/*  Frequency normalization                                            */
/* ------------------------------------------------------------------ */

/** Occurrences per year for a given recurrence frequency. */
export const FREQUENCY_PER_YEAR = Object.freeze({
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
});

/** Convert an amount at some frequency into an equivalent monthly amount. */
export function toMonthly(amount, frequency) {
  const perYear = FREQUENCY_PER_YEAR[frequency] ?? 1;
  return (amount * perYear) / MONTHS_PER_YEAR;
}

/* ------------------------------------------------------------------ */
/*  Mortgage & offset account                                          */
/* ------------------------------------------------------------------ */

/**
 * Net the offset balance against the loan principal BEFORE computing interest.
 * This is the core rule for offset accounts: you only pay interest on
 * (principal − offset). The effective balance never goes below zero.
 */
export function effectiveLoanBalance(loanPrincipalBalance, offsetAccountBalance) {
  return Math.max(0, loanPrincipalBalance - Math.max(0, offsetAccountBalance));
}

/**
 * Monthly interest charged on a loan, accounting for the offset account.
 * @returns {{ withOffset:number, withoutOffset:number, monthlySaving:number, annualSaving:number }}
 */
export function monthlyInterest(property) {
  const {
    loan_principal_balance: principal = 0,
    offset_account_balance: offset = 0,
    interest_rate: annualRate = 0,
  } = property;

  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  const withoutOffset = principal * monthlyRate;
  const withOffset = effectiveLoanBalance(principal, offset) * monthlyRate;
  const monthlySaving = withoutOffset - withOffset;

  return {
    withOffset,
    withoutOffset,
    monthlySaving,
    annualSaving: monthlySaving * MONTHS_PER_YEAR,
  };
}

/**
 * Number of months to repay a loan given a fixed monthly repayment and a fixed
 * balance the interest is charged on. Returns Infinity if the repayment does
 * not cover the monthly interest (loan never amortizes).
 */
export function monthsToRepay(balanceForInterest, monthlyRepayment, annualRate) {
  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  if (monthlyRate <= 0) {
    return monthlyRepayment > 0 ? Math.ceil(balanceForInterest / monthlyRepayment) : Infinity;
  }
  const interestOnly = balanceForInterest * monthlyRate;
  if (monthlyRepayment <= interestOnly) return Infinity;
  // n = -ln(1 - r·B/P) / ln(1 + r)
  const n = -Math.log(1 - (monthlyRate * balanceForInterest) / monthlyRepayment) / Math.log(1 + monthlyRate);
  return Math.ceil(n);
}

/**
 * Standard amortizing payment for a principal over a term (years) at an annual
 * rate. Useful to derive a repayment when the user hasn't entered one.
 */
export function amortizingPayment(principal, annualRate, termYears) {
  const monthlyRate = annualRate / MONTHS_PER_YEAR;
  const n = termYears * MONTHS_PER_YEAR;
  if (n <= 0) return 0;
  if (monthlyRate <= 0) return principal / n;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

/**
 * The headline offset benefit: how much interest the offset saves and how much
 * sooner the loan is repaid because those savings accelerate principal paydown.
 *
 * We hold the repayment constant. Without the offset the whole principal earns
 * interest; with it, interest is charged only on (principal − offset), so more
 * of each repayment goes to principal and the term shortens.
 *
 * @returns {{
 *   monthlyRepayment:number,
 *   monthlyInterestSaving:number,
 *   annualInterestSaving:number,
 *   monthsWithoutOffset:number,
 *   monthsWithOffset:number,
 *   monthsReduction:number
 * }}
 */
export function offsetBenefit(property) {
  const {
    loan_principal_balance: principal = 0,
    offset_account_balance: offset = 0,
    interest_rate: annualRate = 0,
    loan_term: termYears = 30,
  } = property;

  const monthlyRepayment =
    property.monthly_repayment && property.monthly_repayment > 0
      ? property.monthly_repayment
      : amortizingPayment(principal, annualRate, termYears);

  const interest = monthlyInterest(property);
  const effective = effectiveLoanBalance(principal, offset);

  const monthsWithoutOffset = monthsToRepay(principal, monthlyRepayment, annualRate);
  const monthsWithOffset = monthsToRepay(effective, monthlyRepayment, annualRate);

  const reduction =
    Number.isFinite(monthsWithoutOffset) && Number.isFinite(monthsWithOffset)
      ? Math.max(0, monthsWithoutOffset - monthsWithOffset)
      : 0;

  return {
    monthlyRepayment,
    monthlyInterestSaving: interest.monthlySaving,
    annualInterestSaving: interest.annualSaving,
    monthsWithoutOffset,
    monthsWithOffset,
    monthsReduction: reduction,
  };
}

/** True (monthly) cost of homeownership: net interest + running costs. */
export function trueCostOfOwnership(property, propertyCosts = []) {
  const interest = monthlyInterest(property).withOffset;
  const runningMonthly = propertyCosts.reduce(
    (sum, c) => sum + toMonthly(c.amount, c.frequency),
    0,
  );
  return {
    monthlyInterest: interest,
    monthlyRunningCosts: runningMonthly,
    monthlyTotal: interest + runningMonthly,
    annualTotal: (interest + runningMonthly) * MONTHS_PER_YEAR,
  };
}

/* ------------------------------------------------------------------ */
/*  Investments                                                        */
/* ------------------------------------------------------------------ */

/** Per-holding derived figures. */
export function investmentMetrics(inv) {
  const cost = inv.units_held * inv.average_purchase_price;
  const value = inv.units_held * inv.current_valuation;
  const gain = value - cost;
  const roi = cost > 0 ? gain / cost : 0;
  return { cost, value, gain, roi };
}

/** Resolve a holding's asset class, falling back to its type default. */
export function assetClassOf(inv) {
  if (inv.asset_class) return inv.asset_class;
  const type = Object.values(ASSET_TYPE).find((t) => t.id === inv.asset_type);
  return type?.defaultClass ?? ASSET_CLASS.GROWTH;
}

/**
 * Portfolio-level roll-up: total value/cost/gain, ROI, per-holding weights,
 * defensive/growth split, and a breakdown by asset type.
 */
export function portfolioSummary(investments = []) {
  let totalValue = 0;
  let totalCost = 0;
  const byClass = { [ASSET_CLASS.GROWTH]: 0, [ASSET_CLASS.DEFENSIVE]: 0 };
  const byTypeMap = new Map();

  const holdings = investments.map((inv) => {
    const m = investmentMetrics(inv);
    totalValue += m.value;
    totalCost += m.cost;
    byClass[assetClassOf(inv)] += m.value;

    const typeId = inv.asset_type;
    byTypeMap.set(typeId, (byTypeMap.get(typeId) ?? 0) + m.value);
    return { ...inv, ...m };
  });

  // Assign weights once totals are known.
  holdings.forEach((h) => {
    h.weight = totalValue > 0 ? h.value / totalValue : 0;
  });
  holdings.sort((a, b) => b.value - a.value);

  const totalGain = totalValue - totalCost;
  const byType = [...byTypeMap.entries()].map(([id, value]) => {
    const type = Object.values(ASSET_TYPE).find((t) => t.id === id);
    return {
      id,
      label: type?.label ?? id,
      value,
      weight: totalValue > 0 ? value / totalValue : 0,
    };
  });

  return {
    holdings,
    totalValue,
    totalCost,
    totalGain,
    roi: totalCost > 0 ? totalGain / totalCost : 0,
    defensiveValue: byClass[ASSET_CLASS.DEFENSIVE],
    growthValue: byClass[ASSET_CLASS.GROWTH],
    defensiveWeight: totalValue > 0 ? byClass[ASSET_CLASS.DEFENSIVE] / totalValue : 0,
    growthWeight: totalValue > 0 ? byClass[ASSET_CLASS.GROWTH] / totalValue : 0,
    byType,
  };
}

/**
 * Annualized return (CAGR) from a simple total ROI over a holding period.
 * @param {number} roi total return as a decimal (0.25 = +25%)
 * @param {number} years holding period in years
 */
export function annualizedReturn(roi, years) {
  if (years <= 0) return roi;
  return Math.pow(1 + roi, 1 / years) - 1;
}

/* ------------------------------------------------------------------ */
/*  Cash flow                                                          */
/* ------------------------------------------------------------------ */

/**
 * Summarize a set of transactions into a P&L-style view: total income, total
 * expenses, net delta, and per-category expense breakdown. Transfers are
 * excluded from income/expense totals (they don't change net worth) but
 * returned separately.
 */
export function cashFlowSummary(transactions = []) {
  let income = 0;
  let expenses = 0; // stored as a positive magnitude
  let transfers = 0;
  const byCategory = new Map();

  for (const txn of transactions) {
    const cat = CATEGORY_BY_ID[txn.category];
    const kind = cat?.kind ?? CATEGORY_KIND.EXPENSE;

    if (kind === CATEGORY_KIND.INCOME) {
      income += Math.abs(txn.amount);
    } else if (kind === CATEGORY_KIND.EXPENSE) {
      const mag = Math.abs(txn.amount);
      expenses += mag;
      byCategory.set(txn.category, (byCategory.get(txn.category) ?? 0) + mag);
    } else {
      transfers += Math.abs(txn.amount);
    }
  }

  const categoryBreakdown = [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_BY_ID[category]?.label ?? category,
      amount,
      share: expenses > 0 ? amount / expenses : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    income,
    expenses,
    transfers,
    net: income - expenses,
    savingsRate: income > 0 ? (income - expenses) / income : 0,
    categoryBreakdown,
  };
}

/* ------------------------------------------------------------------ */
/*  Net worth & ratios                                                 */
/* ------------------------------------------------------------------ */

/**
 * Consolidated balance sheet across all modules.
 *
 * Assets      = investments (incl. super) + property market values + offset &
 *               cash balances + positive account balances.
 * Liabilities = loan principal balances + drawn credit-card balances (negative
 *               account balances).
 *
 * Note: the offset balance is counted as a cash asset AND left in the loan's
 * principal — that's correct double-entry, because the loan you still owe is the
 * full principal; the offset just reduces the interest, not the debt itself.
 */
export function netWorthSummary({ investments = [], properties = [], accounts = [] } = {}) {
  const investmentValue = portfolioSummary(investments).totalValue;

  let propertyValue = 0;
  let loanLiabilities = 0;
  let offsetCash = 0;
  for (const p of properties) {
    propertyValue += p.current_market_value ?? 0;
    loanLiabilities += p.loan_principal_balance ?? 0;
    offsetCash += p.offset_account_balance ?? 0;
  }

  let cashAssets = 0;
  let creditLiabilities = 0;
  for (const a of accounts) {
    const bal = a.current_balance ?? 0;
    if (bal >= 0) cashAssets += bal;
    else creditLiabilities += Math.abs(bal);
  }

  const totalAssets = investmentValue + propertyValue + offsetCash + cashAssets;
  const totalLiabilities = loanLiabilities + creditLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    breakdown: {
      investments: investmentValue,
      property: propertyValue,
      cash: offsetCash + cashAssets,
      loans: loanLiabilities,
      creditCards: creditLiabilities,
    },
  };
}

/**
 * Debt-to-Income ratio = total liabilities / gross annual income.
 * Returned as a decimal (2.5 = debts are 2.5× annual income).
 */
export function debtToIncome(totalLiabilities, grossAnnualIncome) {
  if (!grossAnnualIncome || grossAnnualIncome <= 0) return null;
  return totalLiabilities / grossAnnualIncome;
}

/** Progress toward a target as a clamped 0..1 fraction. */
export function goalProgress(current, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(1, current / target));
}

/* ------------------------------------------------------------------ */
/*  Time series                                                        */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Build a trailing income-vs-expenses series from raw transactions, one point
 * per calendar month, ending at the most recent month present (or the current
 * month if `endDate` is given). Transfers are excluded, matching cashFlowSummary.
 */
export function monthlyCashFlowTrend(transactions = [], months = 6, endDate = new Date()) {
  const buckets = new Map(); // 'YYYY-M' -> { income, expenses }
  for (const txn of transactions) {
    const cat = CATEGORY_BY_ID[txn.category];
    const kind = cat?.kind ?? CATEGORY_KIND.EXPENSE;
    if (kind === CATEGORY_KIND.TRANSFER) continue;
    const d = new Date(txn.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.get(key) ?? { income: 0, expenses: 0 };
    if (kind === CATEGORY_KIND.INCOME) b.income += Math.abs(txn.amount);
    else b.expenses += Math.abs(txn.amount);
    buckets.set(key, b);
  }

  const out = [];
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const b = buckets.get(`${d.getFullYear()}-${d.getMonth()}`) ?? { income: 0, expenses: 0 };
    out.push({ month: MONTH_LABELS[d.getMonth()], income: b.income, expenses: b.expenses });
  }
  return out;
}
