import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthScreen } from '../../components/AuthScreen';

type Tab = 'jobs' | 'resumes' | 'settings';

function App() {
  const { user, loading, error, signIn, signOut, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onSignIn={signIn} loading={loading} error={error} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">HireExtension</h1>
        </div>
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || ''}
            alt={user?.displayName || ''}
            className="w-8 h-8 rounded-full"
          />
          <button
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1">
          {[
            { id: 'jobs' as Tab, label: 'Jobs', icon: '💼' },
            { id: 'resumes' as Tab, label: 'Resumes', icon: '📄' },
            { id: 'settings' as Tab, label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'resumes' && <ResumesTab userId={user?.uid} />}
        {activeTab === 'settings' && <SettingsTab user={user} />}
      </main>
    </div>
  );
}

function JobsTab() {
  return (
    <div className="p-6 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Jobs Scanned Yet</h2>
        <p className="text-gray-600 mb-6">
          Navigate to a Jobright job search or recommended jobs page to start scanning.
        </p>
        <a
          href="https://jobright.ai/jobs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Jobright
        </a>
        <div className="mt-8 text-sm text-gray-500">
          <p>Jobs will be implemented in Phase 3-5:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Phase 3: Job scraping from Jobright pages</li>
            <li>• Phase 4: AI matching and categorization</li>
            <li>• Phase 5: Job list UI with filters</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ResumesTab({ userId }: { userId?: string }) {
  return (
    <div className="p-6 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">📄</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Resume</h2>
        <p className="text-gray-600 mb-6">
          Get started by uploading your first resume. We'll use AI to parse it and match you with jobs.
        </p>
        <button
          disabled
          className="bg-gray-300 text-gray-600 px-6 py-2 rounded-lg cursor-not-allowed"
        >
          Upload Resume (Coming in Phase 2)
        </button>
        <div className="mt-8 text-sm text-gray-500">
          <p>Resume features will be implemented in Phase 2:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Upload PDF resumes</li>
            <li>• AI parsing with Gemini</li>
            <li>• Multi-resume management</li>
            <li>• Set default resume</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: any }) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user?.photoURL || ''}
              alt={user?.displayName || ''}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">{user?.displayName}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gemini API Key</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your Google Gemini API key to enable AI features. Get one from{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Google AI Studio
            </a>
            .
          </p>
          <input
            type="password"
            placeholder="AIza..."
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
          />
          <button
            disabled
            className="mt-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed text-sm"
          >
            Save (Coming Soon)
          </button>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Version:</strong> 0.1.0 (Phase 1)</p>
            <p><strong>Phase 1 Complete:</strong></p>
            <ul className="ml-4 space-y-1 mt-2">
              <li>✓ Project setup with WXT + React + TypeScript</li>
              <li>✓ Firebase integration (Auth, Firestore, Storage)</li>
              <li>✓ Google Sign-In authentication</li>
              <li>✓ Session persistence</li>
              <li>✓ Basic UI structure</li>
            </ul>
            <p className="mt-4"><strong>Coming Next:</strong> Phase 2 - Resume Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
