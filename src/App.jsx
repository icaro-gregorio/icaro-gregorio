import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/layout/AppShell.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CashFlow from './pages/CashFlow.jsx';
import Investments from './pages/Investments.jsx';
import RealEstate from './pages/RealEstate.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  const { loading, isConfigured, user } = useAuth();

  // While Firebase resolves the current session, hold a lightweight splash.
  if (loading) {
    return (
      <div className="auth-screen">
        <div className="splash">Loading…</div>
      </div>
    );
  }

  // When Firebase is configured, gate the app behind sign-in. In demo mode
  // (no Firebase) we skip auth entirely and show the placeholder data.
  if (isConfigured && !user) {
    return <Login />;
  }

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
