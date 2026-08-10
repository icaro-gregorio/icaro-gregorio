import { Home } from 'lucide-react';
import ModulePlaceholder from '../components/ui/ModulePlaceholder.jsx';

export default function RealEstate() {
  return (
    <ModulePlaceholder
      icon={Home}
      title="Real Estate & Mortgage"
      description="Manage your primary residence valuation, mortgage and offset account, and understand the true cost of homeownership."
      features={[
        'Offset calculator — interest saved and loan-term reduction from the offset balance',
        'Interest computed on (loan principal − offset) before charging',
        'Running-costs ledger: council rates, water, power, insurance, maintenance',
        'True cost of ownership: net interest plus recurring costs',
      ]}
    />
  );
}
