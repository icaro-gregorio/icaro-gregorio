/**
 * Central data provider.
 *
 * Two modes, chosen automatically:
 *   • DEMO  — Firebase not configured, or no user signed in. Serves the
 *             read-only placeholder dataset so the UI is always browsable.
 *   • LIVE  — Firebase configured and a user signed in. Subscribes to that
 *             user's Firestore data in real time and exposes CRUD actions that
 *             persist to the database.
 *
 * Every page reads through `useData()`, so nothing downstream cares which mode
 * is active — the shape is identical.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { demoData } from '../data/placeholders.js';
import { useAuth } from './AuthContext.jsx';
import { COLLECTIONS } from '../models/collections.js';
import {
  subscribeCollection,
  subscribeProfile,
  saveProfile as fsSaveProfile,
  upsertEntity,
  deleteEntity,
  seedUserData,
} from '../firebase/firestore.js';
import { makeAdviserProfile } from '../models/schema.js';

const DataContext = createContext(null);

const EMPTY = {
  profile: makeAdviserProfile(),
  accounts: [],
  transactions: [],
  investments: [],
  properties: [],
  propertyCosts: [],
};

export function DataProvider({ children }) {
  const { user, isConfigured } = useAuth();
  const live = isConfigured && !!user;
  const uid = user?.uid;

  const [remote, setRemote] = useState(EMPTY);
  const [loading, setLoading] = useState(live);

  // Subscribe to the signed-in user's data in real time.
  useEffect(() => {
    if (!live) {
      setRemote(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);

    const set = (key) => (value) => setRemote((r) => ({ ...r, [key]: value }));
    const unsubs = [
      subscribeProfile(uid, (p) =>
        setRemote((r) => ({
          ...r,
          profile: p
            ? { ...makeAdviserProfile(), ...p }
            : makeAdviserProfile({ display_name: user.displayName || '' }),
        })),
      ),
      subscribeCollection(uid, COLLECTIONS.ACCOUNTS, set('accounts')),
      subscribeCollection(uid, COLLECTIONS.TRANSACTIONS, set('transactions')),
      subscribeCollection(uid, COLLECTIONS.INVESTMENTS, set('investments')),
      subscribeCollection(uid, COLLECTIONS.PROPERTIES, set('properties')),
      subscribeCollection(uid, COLLECTIONS.PROPERTY_COSTS, set('propertyCosts')),
    ];
    setLoading(false);
    return () => unsubs.forEach((u) => u && u());
  }, [live, uid, user?.displayName]);

  const value = useMemo(() => {
    if (!live) {
      // Demo mode: read-only placeholders. Writes are inert but don't throw, so
      // the UI can render its forms; they simply prompt the user to sign in.
      const denied = async () => {
        throw new Error('Sign in with Firebase configured to save changes.');
      };
      return {
        ...demoData,
        isDemo: true,
        loading: false,
        saveProfile: denied,
        upsert: denied,
        remove: denied,
        seedSampleData: denied,
      };
    }

    return {
      ...remote,
      isDemo: false,
      loading,
      // Persist the profile (merged).
      saveProfile: (profile) => fsSaveProfile(uid, profile),
      // Create/update an entity in a collection. `idField` names its id key.
      upsert: (collectionName, entity, idField = 'id') =>
        upsertEntity(uid, collectionName, entity[idField], entity),
      // Delete by id.
      remove: (collectionName, id) => deleteEntity(uid, collectionName, id),
      // Populate an empty account with the sample dataset.
      seedSampleData: () => seedUserData(uid, demoData),
    };
  }, [live, remote, loading, uid]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
