import { ArrowLeftRight } from 'lucide-react';
import ModulePlaceholder from '../components/ui/ModulePlaceholder.jsx';

export default function CashFlow() {
  return (
    <ModulePlaceholder
      icon={ArrowLeftRight}
      title="Cash Flow & Transactions"
      description="Record, categorize and analyze every credit-card and bank transaction, with a P&L-style view of money in versus out."
      features={[
        'Editable data-grid for daily transaction entry and re-categorization',
        'Bulk CSV upload and paste-in for bank/credit-card exports',
        'Sankey and bar charts of cash flow in vs. out by category',
        'Auto-categorization rules and a savings-rate summary',
      ]}
    />
  );
}
