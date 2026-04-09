import { useState } from 'react';

interface AuthScreenProps {
  onSignIn: () => Promise<void>;
  onEmailSignIn?: (email: string, password: string) => Promise<void>;
  onEmailSignUp?: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function AuthScreen({ onSignIn, onEmailSignIn, onEmailSignUp, loading, error }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">HireExtension</h1>
          <p className="text-gray-600">AI-powered job matching for Jobright</p>
        </div>

        <div className="space-y-4">
          {/* Email/Password Form - Primary authentication method */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={emailLoading || !email || !password}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {emailLoading ? 'Please wait...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <button
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            className="w-full text-sm text-blue-600 hover:text-blue-700"
          >
            {authMode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>

          {/* Divider - Hidden for now since Google auth has issues
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Google Sign-In currently has compatibility issues in Chrome extensions"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          */}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <p className="font-medium mb-1">Authentication Failed</p>
              <p>{error}</p>
              {error.includes('internal-error') && (
                <p className="mt-2 text-xs">
                  Try using email/password authentication instead of Google Sign-In.
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By signing in, you agree to our terms and privacy policy. Your data is stored securely with Firebase.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>AI-powered job matching and categorization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Multi-resume management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Resume tailoring with Gemini AI</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>LinkedIn hiring manager finder</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
