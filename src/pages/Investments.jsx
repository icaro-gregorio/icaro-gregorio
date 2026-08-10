import { LineChart } from 'lucide-react';
import ModulePlaceholder from '../components/ui/ModulePlaceholder.jsx';

export default function Investments() {
  return (
    <ModulePlaceholder
      icon={LineChart}
      title="Investment Portfolio"
      description="Track ETFs, direct equities and superannuation in one portfolio, with allocation and return analytics."
      features={[
        'Asset allocation dashboard — growth vs. defensive split',
        'Total ROI, annualized returns and per-holding portfolio weight',
        'Holdings table by ticker, platform and cost base',
        'Contribution tracking against your target allocation',
      ]}
    />
  );
}
