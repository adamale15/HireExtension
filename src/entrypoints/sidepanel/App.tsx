import { useEffect, useState } from 'react';
import { AuthScreen } from '../../components/AuthScreen';
import { JobList } from '../../components/JobList';
import { ResumeList } from '../../components/ResumeList';
import { ResumeUploader } from '../../components/ResumeUploader';
import { useAuth } from '../../hooks/useAuth';
import { useJobMatching } from '../../hooks/useJobMatching';
import { useJobs } from '../../hooks/useJobs';
import { useResumes } from '../../hooks/useResumes';
import { isGeminiInitialized, parseResumePDF } from '../../lib/gemini';
import { STORAGE_KEYS } from '../../lib/types';
import type { ScrapedJob, User } from '../../lib/types';

type Tab = 'jobs' | 'resumes' | 'settings';

function App() {
  const {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-600">Loading HireExtension...</p>
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
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">HireExtension</h1>
          <p className="text-xs text-gray-500">AI resume matching for Jobright recommended jobs</p>
        </div>

        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || user.email}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900">
            Sign out
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-200 bg-white px-4">
        <div className="flex gap-1">
          {[
            { id: 'jobs' as Tab, label: 'Jobs', icon: 'Jobs' },
            { id: 'resumes' as Tab, label: 'Resumes', icon: 'Resumes' },
            { id: 'settings' as Tab, label: 'Settings', icon: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </nav>

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
  const { user } = useAuth();
  const { resumes, defaultResumeId } = useResumes(user?.uid);
  const { analyzing, activeJobId, progress, error: matchError, analyzeJob, analyzeJobs } =
    useJobMatching();
  const [analyzedJobs, setAnalyzedJobs] = useState<ScrapedJob[]>([]);

  useEffect(() => {
    setAnalyzedJobs(jobs);
  }, [jobs]);

  const persistJobs = async (nextJobs: ScrapedJob[]) => {
    setAnalyzedJobs(nextJobs);
    await browser.storage.local.set({
      [STORAGE_KEYS.SCRAPED_JOBS]: nextJobs,
    });
  };

  const handleAnalyzeJobs = async () => {
    if (resumes.length === 0) {
      alert('Please upload at least one resume in the Resumes tab first.');
      return;
    }

    const results = await analyzeJobs(analyzedJobs, resumes);
    await persistJobs(results);
  };

  const handleAnalyzeSingleJob = async (job: ScrapedJob, resumeId?: string) => {
    const updatedJob = await analyzeJob(job, resumes, resumeId);
    const nextJobs = analyzedJobs.map((currentJob) =>
      currentJob.id === updatedJob.id ? updatedJob : currentJob,
    );
    await persistJobs(nextJobs);
  };

  const handleJobClick = (job: ScrapedJob) => {
    window.open(job.applyUrl || job.url, '_blank');
  };

  const getResumeName = (resumeId: string | null) => {
    if (!resumeId) {
      return null;
    }

    return resumes.find((resume) => resume.id === resumeId)?.name || 'Unknown resume';
  };

  const categoryCount = {
    safe: analyzedJobs.filter((job) => job.aiMatch?.category === 'safe').length,
    moderate: analyzedJobs.filter((job) => job.aiMatch?.category === 'moderate').length,
    dontApply: analyzedJobs.filter((job) => job.aiMatch?.category === 'dont-apply').length,
    unanalyzed: analyzedJobs.filter((job) => !job.aiMatch).length,
  };

  const hasAnalyzedJobs = analyzedJobs.some((job) => job.aiMatch);
  const hasUnanalyzedJobs = analyzedJobs.some((job) => !job.aiMatch);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Scanned jobs</h2>
            <p className="mt-1 text-gray-600">
              {jobs.length > 0
                ? `${jobs.length} jobs synced from Jobright recommended jobs`
                : 'Open Jobright recommended jobs to begin scraping.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {jobs.length > 0 && (
              <button
                onClick={handleAnalyzeJobs}
                disabled={analyzing || loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                {analyzing && !activeJobId
                  ? `Analyzing ${progress.current}/${progress.total}`
                  : hasUnanalyzedJobs
                    ? 'Analyze remaining jobs'
                    : 'Re-check all analyzed jobs'}
              </button>
            )}

            <button
              onClick={refreshJobs}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>

            {jobs.length > 0 && (
              <button
                onClick={clearJobs}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {analyzing && !activeJobId && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-900">
                Analyzing jobs with AI ({progress.current}/{progress.total})
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-blue-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{
                  width:
                    progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Each listing is being compared against your saved resumes. Results will persist in the side panel when finished.
            </p>
          </div>
        )}

        {hasAnalyzedJobs && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryCard label="Safe Apply" value={categoryCount.safe} tone="green" />
            <SummaryCard label="Moderate" value={categoryCount.moderate} tone="amber" />
            <SummaryCard label="Don't Apply" value={categoryCount.dontApply} tone="red" />
            <SummaryCard label="Unanalyzed" value={categoryCount.unanalyzed} tone="slate" />
          </div>
        )}

        {(error || matchError) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error || matchError}</p>
          </div>
        )}

        <JobList
          jobs={analyzedJobs}
          resumes={resumes}
          defaultResumeId={defaultResumeId}
          onJobClick={handleJobClick}
          onAnalyzeJob={handleAnalyzeSingleJob}
          loading={loading}
          analyzing={analyzing}
          activeJobId={activeJobId}
          getResumeName={getResumeName}
        />

        {hasAnalyzedJobs && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Phase 5 jobs workspace is active.</p>
            <p className="mt-1">
              Use the category tabs, sort by match score, inspect full AI reasoning, and rerun a single job against a specific resume without reprocessing the whole list.
            </p>
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
      setUploadError('Gemini API is not configured. Add it in .env.local before uploading.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const parsedProfile = await parseResumePDF(file);
      await uploadResume(file, name, parsedProfile);
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setUploadError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume management</h2>
          <p className="text-gray-600">
            Upload, rename, delete, and choose the default resume used for matching.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Upload a new resume</h3>
          <ResumeUploader onUpload={handleUpload} loading={uploading} />

          {uploadError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {uploadError}
            </div>
          )}
        </div>

        {resumes.length > 0 && (
          <div className="rounded-lg bg-white p-6 shadow">
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && resumes.length === 0 && !uploading && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
            <p>No resumes uploaded yet. Add your first PDF to unlock AI matching.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ user }: { user: User | null }) {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Account</h2>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-medium text-white">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{user?.displayName || 'User'}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">AI configuration</h2>
          <p className="mb-3 text-sm text-gray-600">
            Resume parsing currently reads the Gemini key from <code>.env.local</code>. Job matching uses the configured Groq key for analysis.
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            In-panel API key storage is not wired yet, so this screen is informational for now.
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Current build</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Auth, resume parsing, Firebase resume storage, Jobright scraping, and AI job matching are all available in this build.</p>
            <p>The latest jobs phase adds category filters, score sorting, single-job reanalysis, and a detailed match view.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'red' | 'slate';
}) {
  const tones = {
    green: 'border-green-200 bg-green-50 text-green-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
  } as const;

  return (
    <div className={`rounded-lg border p-3 ${tones[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

export default App;
