import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Field, TextInput, Button } from '../components/ui/Field.jsx';

/** Friendly Firebase auth error messages. */
function messageFor(err) {
  const code = err?.code || '';
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Incorrect email or password.';
  if (code.includes('user-not-found')) return 'No account with that email — try creating one.';
  if (code.includes('email-already-in-use')) return 'That email already has an account — sign in instead.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('invalid-email')) return 'That doesn’t look like a valid email address.';
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.';
  if (code.includes('operation-not-allowed')) return 'This sign-in method isn’t enabled in Firebase yet.';
  return err?.message || 'Something went wrong. Please try again.';
}

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(email, password, name);
      else await signIn(email, password);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card card">
        <div className="auth-brand">
          <div className="sidebar-brand-mark">
            <TrendingUp size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Adviser</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Personal Finance HQ</div>
          </div>
        </div>

        <h1 className="auth-title">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-sub">
          {mode === 'signup'
            ? 'Set up your private financial workspace.'
            : 'Sign in to your financial workspace.'}
        </p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <Field label="Name">
              <TextInput
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </Field>
          )}
          <Field label="Email">
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </Field>

          {error && <div className="auth-error">{error}</div>}

          <Button type="submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <Button variant="ghost" onClick={google} disabled={busy}>
          Continue with Google
        </Button>

        <div className="auth-switch">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button type="button" onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
            </>
          ) : (
            <>New here?{' '}
              <button type="button" onClick={() => { setMode('signup'); setError(''); }}>Create an account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
