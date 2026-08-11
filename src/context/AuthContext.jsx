/**
 * Authentication context.
 *
 * Wraps Firebase Auth and exposes the current user plus sign-in/out actions.
 * When Firebase isn't configured (no .env credentials) the app runs in DEMO
 * mode: there's no real user, auth is bypassed, and the UI shows read-only
 * placeholder data. This keeps the project runnable out of the box.
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return; // demo mode — nothing to subscribe to
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,

      async signIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
      },

      async signUp(email, password, displayName) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(cred.user, { displayName });
        return cred;
      },

      async signInWithGoogle() {
        return signInWithPopup(auth, new GoogleAuthProvider());
      },

      async logout() {
        return fbSignOut(auth);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
