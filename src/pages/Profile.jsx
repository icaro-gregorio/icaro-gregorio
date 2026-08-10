import { UserCog } from 'lucide-react';
import ModulePlaceholder from '../components/ui/ModulePlaceholder.jsx';

export default function Profile() {
  return (
    <ModulePlaceholder
      icon={UserCog}
      title="Client Profile"
      description="Your adviser master record — the goals, risk tolerance and targets that drive the analytics across every module."
      features={[
        'Target retirement age and current age',
        'Risk tolerance and target asset allocation',
        'Target net worth and monthly savings goal',
        'Gross annual income for debt-to-income and affordability',
      ]}
    />
  );
}
