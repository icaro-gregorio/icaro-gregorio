# Adviser — Personal Financial Adviser

A single-client personal finance web app that tracks **cash flow**, **investments**,
**real estate & mortgage**, and **long-term life goals** — with the analytical depth
a professional financial adviser would use for a full portfolio.

- **Frontend:** React 18 + Vite, React Router, Recharts, lucide-react icons
- **Backend/DB:** Firebase (Firestore + Auth), Node.js tooling
- **Design:** theme-aware (light/dark), built on a validated, colour-blind-safe data-viz palette

> The app runs out of the box in **demo mode** with a realistic placeholder dataset
> (Australian context: AUD, ASX tickers, superannuation, an offset mortgage). Add
> Firebase credentials to switch on persistence — no other code changes required.

---

## Getting started

```bash
npm install
cp .env.example .env    # optional — fill in Firebase creds to enable persistence
npm run dev             # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`,
`npm run emulators` (Firebase local emulators).

---

## Project structure

```
src/
├─ main.jsx                 App entry (Router + DataProvider)
├─ App.jsx                  Route table
├─ index.css                Design tokens (light/dark) + layout
├─ firebase/config.js       Firebase init (falls back to demo mode)
├─ models/
│  ├─ schema.js             Typedefs, enums, category system, factory fns
│  └─ collections.js        Firestore collection names
├─ data/placeholders.js     Demo dataset
├─ utils/
│  ├─ finance.js            The advising engine (offset, ROI, net worth, DTI…)
│  └─ format.js             AUD currency / percentage / duration formatters
├─ context/DataContext.jsx  Single data source (demo now, Firestore later)
├─ hooks/useTheme.js        Light/dark theme
├─ components/
│  ├─ layout/               AppShell, Sidebar, Topbar, navigation config
│  ├─ ui/                   Card, StatCard, ModulePlaceholder
│  └─ charts/               NetWorthArea, CashFlowBars, AllocationDonut, tooltip
└─ pages/                   Dashboard (built), CashFlow, Investments,
                            RealEstate, Profile (scaffolded)
```

---

## Data schema

All financial data is **private and per-user**, stored under `users/{uid}` in
Firestore (see `firestore.rules`). Amounts are AUD; transaction amounts are
**signed** (income `+`, expense `−`). Full typedefs and defaulted factory
functions live in [`src/models/schema.js`](src/models/schema.js).

| Collection | Key fields |
|---|---|
| **transactions** | `id`, `date`, `amount`, `description`, `category`, `account_id`, `cleared`, `notes` |
| **accounts** | `id`, `name`, `type` (credit_card / transaction / savings / offset), `institution`, `current_balance`, `credit_limit` |
| **investments** | `asset_id`, `ticker`, `name`, `asset_type` (ETF / direct_equity / superannuation / fixed_income / cash), `asset_class` (growth / defensive), `units_held`, `average_purchase_price`, `current_valuation`, `brokerage_platform` |
| **properties** | `property_id`, `label`, `current_market_value`, `loan_principal_balance`, `interest_rate`, `offset_account_balance`, `loan_term`, `monthly_repayment` |
| **propertyCosts** | `id`, `property_id`, `label`, `category`, `amount`, `frequency` (weekly … annually) |
| **Adviser Profile** (on the user doc) | `display_name`, `current_age`, `target_retirement_age`, `risk_tolerance`, `target_net_worth`, `monthly_savings_goal`, `gross_annual_income` |

The transaction **categorization system** (`TRANSACTION_CATEGORIES`) tags every
category with a reporting *kind* — income / expense / transfer — and a group, so
cash-flow summaries render in stable P&L order and transfers stay out of the
income/expense totals.

---

## Financial engine

Pure, unit-testable functions in [`src/utils/finance.js`](src/utils/finance.js):

- **Offset & mortgage** — `effectiveLoanBalance` nets the offset against the
  principal *before* interest is charged; `monthlyInterest`, `offsetBenefit`
  (interest saved + loan-term reduction), and `trueCostOfOwnership`.
- **Investments** — `investmentMetrics`, `portfolioSummary` (value, ROI, weights,
  growth/defensive split, by-type breakdown), `annualizedReturn` (CAGR).
- **Cash flow** — `cashFlowSummary` (P&L-style income / expenses / net / savings
  rate / category breakdown).
- **Balance sheet** — `netWorthSummary` (consolidated assets & liabilities),
  `debtToIncome`, `goalProgress`.

---

## Firebase setup (to leave demo mode)

1. Create a Firebase project and a Web App; enable **Firestore** and **Auth**.
2. Copy the SDK config into `.env` (see `.env.example`).
3. Deploy rules/indexes: `firebase deploy --only firestore`.
4. Wire live reads in `src/context/DataContext.jsx` (marked with a `TODO(firebase)`).

Local development against emulators: set `VITE_USE_FIREBASE_EMULATORS=true` and
run `npm run emulators`.

---

## Roadmap

Dashboard is fully built. Next: the Cash Flow data-grid + CSV import, the
Investments holdings/allocation views, and the Real Estate offset calculator &
running-costs ledger — all reading through the same schema and engine.
