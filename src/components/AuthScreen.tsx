import { useState, type FormEvent } from 'react';

interface AuthScreenProps {
  onSignIn: () => Promise<void>;
  onEmailSignIn?: (email: string, password: string) => Promise<void>;
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => Promise<void>;
}

export function AuthScreen({
  onSignIn: _onSignIn,
  onEmailSignIn,
  onEmailSignUp,
  loading: _loading,
  error,
  themeMode,
  onToggleTheme,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }

    setEmailLoading(true);
    try {
      if (authMode === 'signup' && onEmailSignUp) {
        await onEmailSignUp(email, password);
      } else if (authMode === 'signin' && onEmailSignIn) {
        await onEmailSignIn(email, password);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const isDark = themeMode === 'dark';

  return (
    <div className="flex min-h-[720px] items-center justify-center bg-[var(--canvas)] p-4">
      <div
        className="w-full max-w-md rounded-[32px] p-8 backdrop-blur"
        style={{
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, var(--surface-strong), var(--surface))',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
              HireExtension
            </p>
            <button
              onClick={() => void onToggleTheme()}
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text)',
              }}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀' : '☾'}
            </button>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--text-strong)]">Clean job search workspace</h1>
          <p className="mt-2 text-sm text-[var(--text)]">
            Match resumes, review fit, and save tailoring notes without leaving the popup.
          </p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl px-4 py-3 placeholder:text-[var(--text-soft)] focus:border-transparent focus:ring-2 focus:ring-sky-500"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text-strong)',
              }}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl px-4 py-3 placeholder:text-[var(--text-soft)] focus:border-transparent focus:ring-2 focus:ring-sky-500"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text-strong)',
              }}
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={emailLoading || !email || !password}
              className="w-full rounded-2xl py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                  : 'linear-gradient(135deg, #0f172a, #0369a1)',
              }}
            >
              {emailLoading ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="w-full text-sm font-medium text-[var(--accent)]"
          >
            {authMode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>

          {error && (
            <div
              className="rounded-2xl p-3 text-sm"
              style={{
                border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(254,202,202,1)'}`,
                background: isDark ? 'rgba(127,29,29,0.22)' : '#fef2f2',
                color: isDark ? '#fecaca' : '#b91c1c',
              }}
            >
              <p className="mb-1 font-medium">Authentication failed</p>
              <p>{error}</p>
              {error.includes('internal-error') && (
                <p className="mt-2 text-xs">
                  Try using email and password authentication instead of Google sign-in.
                </p>
              )}
            </div>
          )}

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-center text-xs text-[var(--text-soft)]">
              Your account and resume metadata are stored in Firebase. Resume analysis runs through
              your local Claude bridge.
            </p>
          </div>
        </div>

        <div
          className="mt-8 rounded-[24px] p-4"
          style={{ background: 'var(--surface-soft)' }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-strong)]">Included right now</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>AI-powered job matching and categorization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Multi-resume management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Resume and job analysis with your local Claude bridge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Per-job resume tailoring suggestions and accepted-change tracking</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
