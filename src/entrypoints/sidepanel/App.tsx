import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useResumes } from '../../hooks/useResumes';
import { useJobs } from '../../hooks/useJobs';
import { AuthScreen } from '../../components/AuthScreen';
import { ResumeUploader } from '../../components/ResumeUploader';
import { ResumeList } from '../../components/ResumeList';
import { JobList } from '../../components/JobList';
import { parseResumePDF, isGeminiInitialized } from '../../lib/gemini';
import type { ScrapedJob } from '../../lib/types';

type Tab = 'jobs' | 'resumes' | 'settings';

function App() {
  const { user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, isAuthenticated } = useAuth();
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
    return (
      <AuthScreen 
        onSignIn={signInWithGoogle}
        onEmailSignIn={signInWithEmail}
        onEmailSignUp={signUpWithEmail}
        loading={loading} 
        error={error} 
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">HireExtension</h1>
        </div>
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-sm text-gray-700">{user?.email}</span>
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
  const { jobs, loading, error, refreshJobs, clearJobs } = useJobs();

  const handleJobClick = (job: ScrapedJob) => {
    // Open job in new tab
    window.open(job.url, '_blank');
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scanned Jobs</h2>
            <p className="text-gray-600 mt-1">
              {jobs.length > 0
                ? `${jobs.length} jobs found from Jobright`
                : 'No jobs scanned yet'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={refreshJobs}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            {jobs.length > 0 && (
              <button
                onClick={clearJobs}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Job List */}
        <JobList jobs={jobs} onJobClick={handleJobClick} loading={loading} />
        
        {/* Phase 4-5 Notice */}
        {jobs.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Coming in Phase 4-5:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>AI-powered job matching with your resumes</li>
              <li>Smart categorization (Safe Apply / Moderate / Don't Apply)</li>
              <li>Resume recommendations for each job</li>
              <li>Match score and detailed analysis</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumesTab({ userId }: { userId?: string }) {
  const {
    resumes,
    defaultResumeId,
    loading,
    error,
    uploadResume,
    updateResumeName,
    deleteResume,
    setDefaultResume,
  } = useResumes(userId);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (file: File, name: string) => {
    if (!isGeminiInitialized()) {
      setUploadError('Gemini API not configured. Please check your API key.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      console.log('Parsing resume with Gemini AI...');
      const parsedProfile = await parseResumePDF(file);
      console.log('Resume parsed successfully:', parsedProfile);

      console.log('Uploading to Firebase Storage...');
      await uploadResume(file, name, parsedProfile);
      console.log('Resume uploaded successfully');
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setUploadError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resume Management</h2>
          <p className="text-gray-600">
            Upload and manage your resumes. AI will parse them automatically.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Resume</h3>
          <ResumeUploader onUpload={handleUpload} loading={uploading} />
          
          {uploadError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}
        </div>

        {/* Resume List */}
        {resumes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <ResumeList
              resumes={resumes}
              defaultResumeId={defaultResumeId}
              onSetDefault={setDefaultResume}
              onRename={updateResumeName}
              onDelete={deleteResume}
              loading={loading}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && resumes.length === 0 && !uploading && (
          <div className="text-center py-8 text-gray-500">
            <p>No resumes uploaded yet. Upload your first resume to get started!</p>
          </div>
        )}
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
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user?.displayName || 'User'}</p>
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
