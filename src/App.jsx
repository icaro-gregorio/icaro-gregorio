import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CashFlow from './pages/CashFlow.jsx';
import Investments from './pages/Investments.jsx';
import RealEstate from './pages/RealEstate.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="cash-flow" element={<CashFlow />} />
        <Route path="investments" element={<Investments />} />
        <Route path="real-estate" element={<RealEstate />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
