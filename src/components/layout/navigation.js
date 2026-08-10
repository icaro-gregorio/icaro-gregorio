import {
  LayoutDashboard,
  ArrowLeftRight,
  LineChart,
  Home,
  UserCog,
} from 'lucide-react';

/** Primary navigation — the app's core modules. */
export const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    caption: 'Adviser view',
    icon: LayoutDashboard,
    section: 'Overview',
  },
  {
    to: '/cash-flow',
    label: 'Cash Flow',
    caption: 'Transactions & budget',
    icon: ArrowLeftRight,
    section: 'Modules',
  },
  {
    to: '/investments',
    label: 'Investments',
    caption: 'Portfolio & allocation',
    icon: LineChart,
    section: 'Modules',
  },
  {
    to: '/real-estate',
    label: 'Real Estate',
    caption: 'Property & mortgage',
    icon: Home,
    section: 'Modules',
  },
  {
    to: '/profile',
    label: 'Client Profile',
    caption: 'Goals & risk',
    icon: UserCog,
    section: 'Settings',
  },
];

/** Title/subtitle shown in the topbar per route. */
export const ROUTE_META = {
  '/': { title: 'Global Dashboard', sub: 'Executive summary of your financial position' },
  '/cash-flow': { title: 'Cash Flow & Transactions', sub: 'Income, expenses and categorization' },
  '/investments': { title: 'Investment Portfolio', sub: 'Asset allocation and returns' },
  '/real-estate': { title: 'Real Estate & Mortgage', sub: 'Property, offset and running costs' },
  '/profile': { title: 'Client Profile', sub: 'Goals, risk tolerance and targets' },
};
