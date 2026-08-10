/**
 * Placeholder / demo dataset.
 *
 * Used to populate the UI before Firebase is connected, so the app shell and
 * dashboards are fully reviewable. Figures are illustrative and reflect a
 * typical Australian household (ASX tickers, superannuation, an offset mortgage).
 * Swap this out for live Firestore reads once credentials are configured.
 */

import {
  makeAdviserProfile,
  makeAccount,
  makeTransaction,
  makeInvestment,
  makeProperty,
  makePropertyCost,
  ACCOUNT_TYPE,
  ASSET_TYPE,
  ASSET_CLASS,
  RISK_TOLERANCE,
} from '../models/schema.js';

export const demoProfile = makeAdviserProfile({
  display_name: 'Demo Client',
  current_age: 36,
  target_retirement_age: 60,
  risk_tolerance: RISK_TOLERANCE.GROWTH,
  target_net_worth: 2_500_000,
  monthly_savings_goal: 4_500,
  gross_annual_income: 165_000,
});

export const demoAccounts = [
  makeAccount({ id: 'acct_everyday', name: 'Everyday Transaction', type: ACCOUNT_TYPE.TRANSACTION, institution: 'CBA', current_balance: 8_420 }),
  makeAccount({ id: 'acct_visa', name: 'Ultimate Awards Visa', type: ACCOUNT_TYPE.CREDIT_CARD, institution: 'CBA', current_balance: -2_180, credit_limit: 15_000 }),
  makeAccount({ id: 'acct_amex', name: 'Qantas Amex', type: ACCOUNT_TYPE.CREDIT_CARD, institution: 'Amex', current_balance: -940, credit_limit: 10_000 }),
  makeAccount({ id: 'acct_savings', name: 'GoalSaver', type: ACCOUNT_TYPE.SAVINGS, institution: 'CBA', current_balance: 22_600 }),
];

export const demoInvestments = [
  makeInvestment({ asset_id: 'inv_vas', ticker: 'VAS.AX', name: 'Vanguard Australian Shares', asset_type: ASSET_TYPE.ETF.id, asset_class: ASSET_CLASS.GROWTH, units_held: 620, average_purchase_price: 88.4, current_valuation: 101.7, brokerage_platform: 'Pearler', purchase_date: '2022-03-14' }),
  makeInvestment({ asset_id: 'inv_vgs', ticker: 'VGS.AX', name: 'Vanguard MSCI Intl', asset_type: ASSET_TYPE.ETF.id, asset_class: ASSET_CLASS.GROWTH, units_held: 410, average_purchase_price: 96.2, current_valuation: 128.9, brokerage_platform: 'Pearler', purchase_date: '2021-08-02' }),
  makeInvestment({ asset_id: 'inv_vgb', ticker: 'VGB.AX', name: 'Vanguard Aust Govt Bond', asset_type: ASSET_TYPE.FIXED_INCOME.id, asset_class: ASSET_CLASS.DEFENSIVE, units_held: 300, average_purchase_price: 47.1, current_valuation: 45.3, brokerage_platform: 'Pearler', purchase_date: '2022-11-20' }),
  makeInvestment({ asset_id: 'inv_cba', ticker: 'CBA.AX', name: 'Commonwealth Bank', asset_type: ASSET_TYPE.DIRECT_EQUITY.id, asset_class: ASSET_CLASS.GROWTH, units_held: 90, average_purchase_price: 98.5, current_valuation: 134.2, brokerage_platform: 'CommSec', purchase_date: '2020-06-10' }),
  makeInvestment({ asset_id: 'inv_csl', ticker: 'CSL.AX', name: 'CSL Limited', asset_type: ASSET_TYPE.DIRECT_EQUITY.id, asset_class: ASSET_CLASS.GROWTH, units_held: 45, average_purchase_price: 285.0, current_valuation: 268.4, brokerage_platform: 'CommSec', purchase_date: '2021-02-18' }),
  makeInvestment({ asset_id: 'inv_super', ticker: 'SUPER', name: 'AustralianSuper — High Growth', asset_type: ASSET_TYPE.SUPERANNUATION.id, asset_class: ASSET_CLASS.GROWTH, units_held: 1, average_purchase_price: 214_000, current_valuation: 268_500, brokerage_platform: 'AustralianSuper', purchase_date: '2014-01-01' }),
];

export const demoProperties = [
  makeProperty({
    property_id: 'prop_home',
    label: 'Primary Residence',
    address: '12 Banksia St, Northcote VIC',
    current_market_value: 1_180_000,
    loan_principal_balance: 642_000,
    interest_rate: 0.0589,
    offset_account_balance: 74_500,
    loan_term: 26,
    monthly_repayment: 4_120,
    repayment_frequency: 'monthly',
    is_primary_residence: true,
  }),
];

export const demoPropertyCosts = [
  makePropertyCost({ id: 'cost_rates', property_id: 'prop_home', label: 'Council Rates', category: 'council_rates', amount: 2_480, frequency: 'annually' }),
  makePropertyCost({ id: 'cost_water', property_id: 'prop_home', label: 'Water', category: 'water', amount: 265, frequency: 'quarterly' }),
  makePropertyCost({ id: 'cost_power', property_id: 'prop_home', label: 'Electricity & Gas', category: 'electricity', amount: 340, frequency: 'quarterly' }),
  makePropertyCost({ id: 'cost_ins', property_id: 'prop_home', label: 'Building & Contents Insurance', category: 'insurance', amount: 1_920, frequency: 'annually' }),
  makePropertyCost({ id: 'cost_maint', property_id: 'prop_home', label: 'Maintenance & Repairs', category: 'maintenance', amount: 3_000, frequency: 'annually' }),
];

/** ~30 transactions across the current month for the cash-flow demo. */
export const demoTransactions = [
  makeTransaction({ date: '2026-08-01', amount: 6_340, description: 'Salary — Acme Pty Ltd', category: 'salary', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-15', amount: 6_340, description: 'Salary — Acme Pty Ltd', category: 'salary', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-05', amount: 412, description: 'VAS distribution', category: 'investment_income', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-02', amount: -4_120, description: 'Home loan repayment', category: 'housing', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-03', amount: -186, description: 'Woolworths', category: 'groceries', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-06', amount: -142, description: 'Coles', category: 'groceries', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-11', amount: -168, description: 'Aldi', category: 'groceries', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-18', amount: -154, description: 'Woolworths', category: 'groceries', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-04', amount: -64, description: 'Dinner — Lygon St', category: 'dining', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-09', amount: -38, description: 'Brunch', category: 'dining', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-16', amount: -88, description: 'Takeaway', category: 'dining', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-07', amount: -92, description: 'Shell fuel', category: 'transport', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-20', amount: -71, description: 'Myki top-up', category: 'transport', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-08', amount: -49, description: 'Netflix + Spotify', category: 'subscriptions', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-08', amount: -22, description: 'iCloud + YouTube', category: 'subscriptions', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-12', amount: -240, description: 'Origin Energy', category: 'utilities', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-13', amount: -80, description: 'Telstra mobile', category: 'utilities', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-10', amount: -160, description: 'Private health insurance', category: 'insurance', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-14', amount: -210, description: 'Kmart + Uniqlo', category: 'shopping', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-19', amount: -320, description: 'Winter jacket', category: 'shopping', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-17', amount: -58, description: 'Cinema + drinks', category: 'entertainment', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-21', amount: -132, description: 'GP + pharmacy', category: 'health', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-06', amount: -620, description: 'Council rates instalment', category: 'property_running', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-09', amount: -18, description: 'Credit card interest', category: 'fees_interest', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-22', amount: -145, description: 'Weekend away — fuel & food', category: 'travel', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-03', amount: -2_500, description: 'Transfer to offset', category: 'savings_transfer', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-15', amount: -1_500, description: 'ETF purchase — VGS', category: 'investment_buy', account_id: 'acct_everyday' }),
  makeTransaction({ date: '2026-08-23', amount: -96, description: 'Restaurant', category: 'dining', account_id: 'acct_amex' }),
  makeTransaction({ date: '2026-08-24', amount: -74, description: 'Groceries top-up', category: 'groceries', account_id: 'acct_visa' }),
  makeTransaction({ date: '2026-08-25', amount: -45, description: 'Hardware store', category: 'shopping', account_id: 'acct_visa' }),
];

/** Illustrative 12-month net-worth trend for the dashboard sparkline/area. */
export const demoNetWorthTrend = [
  { month: 'Sep', value: 1_142_000 },
  { month: 'Oct', value: 1_158_000 },
  { month: 'Nov', value: 1_171_000 },
  { month: 'Dec', value: 1_165_000 },
  { month: 'Jan', value: 1_189_000 },
  { month: 'Feb', value: 1_204_000 },
  { month: 'Mar', value: 1_198_000 },
  { month: 'Apr', value: 1_223_000 },
  { month: 'May', value: 1_246_000 },
  { month: 'Jun', value: 1_261_000 },
  { month: 'Jul', value: 1_279_000 },
  { month: 'Aug', value: 1_298_000 },
];

/** Illustrative income-vs-expense history for the cash-flow bars. */
export const demoCashFlowTrend = [
  { month: 'Mar', income: 13_050, expenses: 8_900 },
  { month: 'Apr', income: 12_680, expenses: 9_240 },
  { month: 'May', income: 13_090, expenses: 8_150 },
  { month: 'Jun', income: 14_200, expenses: 9_980 },
  { month: 'Jul', income: 13_050, expenses: 8_470 },
  { month: 'Aug', income: 13_092, expenses: 8_680 },
];

export const demoData = {
  profile: demoProfile,
  accounts: demoAccounts,
  investments: demoInvestments,
  properties: demoProperties,
  propertyCosts: demoPropertyCosts,
  transactions: demoTransactions,
  netWorthTrend: demoNetWorthTrend,
  cashFlowTrend: demoCashFlowTrend,
};
