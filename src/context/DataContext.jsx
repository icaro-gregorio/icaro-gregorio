/**
 * Central data provider.
 *
 * Today it serves the placeholder dataset so the whole UI is reviewable without
 * a backend. When Firebase is configured, this is the one place to swap in live
 * Firestore subscriptions (onSnapshot over users/{uid}/<collection>) — every
 * page reads through the `useData()` hook, so nothing downstream changes.
 */

import { createContext, useContext, useMemo } from 'react';
import { demoData } from '../data/placeholders.js';
import { isFirebaseConfigured } from '../firebase/config.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  // TODO(firebase): when isFirebaseConfigured, replace `demoData` with live
  // Firestore reads keyed by the authenticated user. The demo dataset keeps the
  // app fully functional in the meantime.
  const value = useMemo(
    () => ({
      ...demoData,
      isDemo: !isFirebaseConfigured,
    }),
    [],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
