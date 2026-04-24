import { useEffect, useState } from 'react';
import { AuthScreen } from './AuthScreen';
import { JobList } from './JobList';
import { ResumeList } from './ResumeList';
import { ResumeUploader } from './ResumeUploader';
import { useAuth } from '../hooks/useAuth';
import { useJobMatching } from '../hooks/useJobMatching';
import { useJobs } from '../hooks/useJobs';
import { useResumeTailoring } from '../hooks/useResumeTailoring';
import { useResumes } from '../hooks/useResumes';
import { isClaudeBridgeConfigured, parseResumeWithClaude } from '../lib/claude-bridge';
import { getThemeMode, saveThemeMode } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/types';
import type { Resume, ScrapedJob, ThemeMode, User } from '../lib/types';

type Tab = 'jobs' | 'resumes' | 'settings';

function WorkspaceApp() {
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
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    void getThemeMode().then((storedThemeMode) => {
      if (storedThemeMode) {
        setThemeMode(storedThemeMode);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  const isDark = themeMode === 'dark';

  const toggleTheme = async () => {
    const nextThemeMode: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextThemeMode);
    await saveThemeMode(nextThemeMode);
  };

  if (loading) {
    return (
      <div className="flex min-h-[720px] items-center justify-center bg-[var(--canvas)] px-6">
        <div
          className="rounded-[28px] px-8 py-10 text-center backdrop-blur"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
          <p className="text-sm font-medium text-[var(--text)]">Loading your workspace...</p>
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
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-[720px] bg-[var(--canvas)] text-[var(--text-strong)]">
      <div className="mx-auto flex min-h-[720px] max-w-[460px] flex-col px-4 pb-4 pt-4">
        <header
          className="rounded-[30px] p-4 backdrop-blur"
          style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--surface-strong), var(--surface))',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                HireExtension
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--text-strong)]">
                Job match workspace
              </h1>
              <p className="mt-1 text-sm text-[var(--text)]">
                Scan Jobright roles, compare resumes, and save tailoring notes in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || user.email}
                  className="h-11 w-11 rounded-2xl object-cover"
                  style={{ boxShadow: '0 0 0 2px var(--accent-soft)' }}
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #0f172a, #334155)'
                      : 'linear-gradient(135deg, #0f172a, #1e293b)',
                  }}
                >
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-2xl transition-transform hover:scale-[1.03]"
                style={{
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-soft)',
                  color: 'var(--text)',
                }}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? '☀' : '☾'}
              </button>
              <button
                onClick={signOut}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-soft)',
                  color: 'var(--text)',
                }}
              >
                Sign out
              </button>
            </div>
          </div>

          <div
            className="mt-4 flex items-center justify-between gap-3 rounded-[24px] px-4 py-3"
            style={{ background: 'var(--surface-soft)' }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-strong)]">
                {user?.displayName || 'User'}
              </p>
              <p className="truncate text-xs text-[var(--text-soft)]">{user?.email}</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              Claude bridge
            </span>
          </div>
        </header>

        <nav
          className="mt-4 grid grid-cols-3 gap-2 rounded-[24px] p-2 backdrop-blur"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {[
            { id: 'jobs' as Tab, label: 'Jobs' },
            { id: 'resumes' as Tab, label: 'Resumes' },
            { id: 'settings' as Tab, label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)]'
                  : 'hover:scale-[1.01]'
              }`}
              style={
                activeTab === tab.id
                  ? {
                      background: isDark
                        ? 'linear-gradient(135deg, #0f172a, #334155)'
                        : 'linear-gradient(135deg, #0f172a, #1e293b)',
                    }
                  : {
                      color: 'var(--text)',
                      background: 'transparent',
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main
          className="mt-4 flex-1 overflow-auto rounded-[30px] backdrop-blur"
          style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(180deg, var(--surface-strong), var(--surface))',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {activeTab === 'jobs' && <JobsTab userId={user?.uid} themeMode={themeMode} />}
          {activeTab === 'resumes' && <ResumesTab userId={user?.uid} themeMode={themeMode} />}
          {activeTab === 'settings' && (
            <SettingsTab user={user} themeMode={themeMode} onToggleTheme={toggleTheme} />
          )}
        </main>
      </div>
    </div>
  );
}

function JobsTab({ userId, themeMode }: { userId?: string; themeMode: ThemeMode }) {
  const isDark = themeMode === 'dark';
  const { jobs, loading, error, refreshJobs, clearJobs } = useJobs();
  const { resumes, defaultResumeId } = useResumes(userId);
  const { analyzing, activeJobId, progress, error: matchError, analyzeJob, analyzeJobs } =
    useJobMatching();
  const {
    tailoring,
    activeTailoringKey,
    error: tailoringError,
    getTailoredResume,
    generateTailoring,
    toggleAccepted,
  } = useResumeTailoring(userId);
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

  const findResumeForJob = (resumeId?: string | null): Resume | null => {
    if (resumeId) {
      const matchedResume = resumes.find((resume) => resume.id === resumeId);

      if (matchedResume) {
        return matchedResume;
      }
    }

    if (defaultResumeId) {
      const defaultResume = resumes.find((resume) => resume.id === defaultResumeId);

      if (defaultResume) {
        return defaultResume;
      }
    }

    return resumes[0] || null;
  };

  const handleTailorResume = async (job: ScrapedJob, resumeId?: string) => {
    const resume = findResumeForJob(resumeId);

    if (!resume) {
      alert('Please upload at least one resume in the Resumes tab first.');
      return;
    }

    await generateTailoring(job, resume);
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
    <div className="p-4">
      <div className="space-y-4">
        <section
          className="rounded-[26px] p-4"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(15,23,42,0.92))'
              : 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(248,250,252,0.98))',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-strong)]">Scanned jobs</h2>
              <p className="mt-1 text-sm text-[var(--text)]">
                {jobs.length > 0
                  ? `${jobs.length} jobs synced from Jobright recommended jobs`
                  : 'Open Jobright recommended jobs to begin scanning.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAnalyzeJobs}
                disabled={jobs.length === 0 || analyzing || loading}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                    : 'linear-gradient(135deg, #0f172a, #0369a1)',
                }}
              >
                {analyzing && !activeJobId
                  ? `Analyzing ${progress.current}/${progress.total}`
                  : hasUnanalyzedJobs
                    ? 'Analyze jobs'
                    : 'Re-check jobs'}
              </button>

              <button
                onClick={refreshJobs}
                disabled={loading}
                className="rounded-2xl px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface-strong)',
                  color: 'var(--text)',
                }}
              >
                Refresh
              </button>

              {jobs.length > 0 && (
                <button
                  onClick={clearJobs}
                  className="col-span-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors"
                  style={{
                    border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(254,202,202,0.9)'}`,
                    background: isDark ? 'rgba(127,29,29,0.18)' : '#fff',
                    color: isDark ? '#fca5a5' : '#b91c1c',
                  }}
                >
                  Clear scanned jobs
                </button>
              )}
            </div>
          </div>
        </section>

        {analyzing && !activeJobId && (
          <div
            className="rounded-[24px] p-4"
            style={{
              border: `1px solid ${isDark ? 'rgba(56,189,248,0.34)' : 'rgba(186,230,253,1)'}`,
              background: isDark ? 'rgba(8,47,73,0.45)' : '#f0f9ff',
            }}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-sky-600"></div>
              <span className="text-sm font-medium text-sky-200">
                Matching jobs ({progress.current}/{progress.total})
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-sky-900/20">
              <div
                className="h-2 rounded-full bg-sky-600 transition-all duration-300"
                style={{
                  width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-sky-300">
              Results stay saved in the popup workspace after the run finishes.
            </p>
          </div>
        )}

        {hasAnalyzedJobs && (
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Safe Apply" value={categoryCount.safe} tone="green" themeMode={themeMode} />
            <SummaryCard label="Moderate" value={categoryCount.moderate} tone="amber" themeMode={themeMode} />
            <SummaryCard label="Don't Apply" value={categoryCount.dontApply} tone="red" themeMode={themeMode} />
            <SummaryCard label="Unanalyzed" value={categoryCount.unanalyzed} tone="slate" themeMode={themeMode} />
          </div>
        )}

        {(error || matchError || tailoringError) && (
          <div
            className="rounded-[24px] p-4"
            style={{
              border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(254,202,202,1)'}`,
              background: isDark ? 'rgba(127,29,29,0.22)' : '#fef2f2',
              color: isDark ? '#fecaca' : '#b91c1c',
            }}
          >
            <p className="text-sm">{error || matchError || tailoringError}</p>
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
          onTailorResume={handleTailorResume}
          tailoring={tailoring}
          activeTailoringKey={activeTailoringKey}
          getTailoredResume={getTailoredResume}
          onToggleTailoredChange={toggleAccepted}
          themeMode={themeMode}
        />

        {hasAnalyzedJobs && (
          <div
            className="rounded-[24px] p-4 text-sm"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface-soft)',
              color: 'var(--text)',
            }}
          >
            <p className="font-medium text-[var(--text-strong)]">Tailoring notes are checklist items.</p>
            <p className="mt-1">
              Marking a change as accepted only saves that decision locally. It does not rewrite the PDF or update your stored resume yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumesTab({ userId, themeMode }: { userId?: string; themeMode: ThemeMode }) {
  const isDark = themeMode === 'dark';
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
    if (!isClaudeBridgeConfigured()) {
      setUploadError(
        'Claude bridge is not configured. Add the bridge settings in .env.local before uploading.',
      );
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const parsedProfile = await parseResumeWithClaude(file);
      await uploadResume(file, name, parsedProfile);
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setUploadError(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div
          className="rounded-[26px] p-4"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(15,23,42,0.92))'
              : 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(248,250,252,0.98))',
            border: '1px solid var(--border)',
          }}
        >
          <h2 className="text-xl font-semibold text-[var(--text-strong)]">Resumes</h2>
          <p className="mt-1 text-sm text-[var(--text)]">
            Upload, rename, delete, and choose the default resume used for matching.
          </p>
        </div>

        <div
          className="rounded-[24px] p-4"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <h3 className="mb-4 text-base font-semibold text-[var(--text-strong)]">Upload a new resume</h3>
          <ResumeUploader onUpload={handleUpload} loading={uploading} themeMode={themeMode} />

          {uploadError && (
            <div
              className="mt-4 rounded-2xl p-3 text-sm"
              style={{
                border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(254,202,202,1)'}`,
                background: isDark ? 'rgba(127,29,29,0.22)' : '#fef2f2',
                color: isDark ? '#fecaca' : '#b91c1c',
              }}
            >
              {uploadError}
            </div>
          )}
        </div>

        {resumes.length > 0 && (
          <div
            className="rounded-[24px] p-4"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface-strong)',
            }}
          >
            <ResumeList
              resumes={resumes}
              defaultResumeId={defaultResumeId}
              onSetDefault={setDefaultResume}
              onRename={updateResumeName}
              onDelete={deleteResume}
              loading={loading}
              themeMode={themeMode}
            />
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl p-3 text-sm"
            style={{
              border: `1px solid ${isDark ? 'rgba(248,113,113,0.35)' : 'rgba(254,202,202,1)'}`,
              background: isDark ? 'rgba(127,29,29,0.22)' : '#fef2f2',
              color: isDark ? '#fecaca' : '#b91c1c',
            }}
          >
            {error}
          </div>
        )}

        {!loading && resumes.length === 0 && !uploading && (
          <div
            className="rounded-[24px] px-6 py-10 text-center text-sm"
            style={{
              border: '1px dashed var(--border-strong)',
              background: 'var(--surface-soft)',
              color: 'var(--text-soft)',
            }}
          >
            <p>No resumes uploaded yet. Add your first PDF to unlock AI matching.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  user,
  themeMode,
  onToggleTheme,
}: {
  user: User | null;
  themeMode: ThemeMode;
  onToggleTheme: () => Promise<void>;
}) {
  const isDark = themeMode === 'dark';
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div
          className="rounded-[24px] p-4"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <h2 className="mb-4 text-base font-semibold text-[var(--text-strong)]">Account</h2>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || user.email}
                className="h-14 w-14 rounded-2xl object-cover"
                style={{ boxShadow: '0 0 0 2px var(--accent-soft)' }}
              />
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-semibold text-white"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, #0f172a, #334155)'
                    : 'linear-gradient(135deg, #0f172a, #1e293b)',
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--text-strong)]">{user?.displayName || 'User'}</p>
              <p className="truncate text-sm text-[var(--text)]">{user?.email}</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-[24px] p-4"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <h2 className="mb-3 text-base font-semibold text-[var(--text-strong)]">Appearance</h2>
          <div
            className="flex items-center justify-between rounded-[22px] px-4 py-3"
            style={{ background: 'var(--surface-soft)' }}
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-strong)]">Theme mode</p>
              <p className="text-xs text-[var(--text-soft)]">
                Switch between a bright workspace and a darker late-night mode.
              </p>
            </div>
            <button
              onClick={() => void onToggleTheme()}
              className="rounded-full px-4 py-2 text-sm font-medium"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              {isDark ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        <div
          className="rounded-[24px] p-4"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <h2 className="mb-3 text-base font-semibold text-[var(--text-strong)]">AI configuration</h2>
          <p className="text-sm text-[var(--text)]">
            Resume parsing, matching, and tailoring use your local Claude bridge from{' '}
            <code>.env.local</code>.
          </p>
          <div
            className="mt-3 rounded-2xl p-3 text-sm"
            style={{
              border: `1px solid ${isDark ? 'rgba(251,191,36,0.3)' : 'rgba(253,230,138,1)'}`,
              background: isDark ? 'rgba(120,53,15,0.25)' : '#fffbeb',
              color: isDark ? '#fde68a' : '#92400e',
            }}
          >
            Set the bridge URL, token, and model in <code>.env.local</code>. In-app API settings are still informational only.
          </div>
        </div>

        <div
          className="rounded-[24px] p-4"
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <h2 className="mb-3 text-base font-semibold text-[var(--text-strong)]">Current build</h2>
          <div className="space-y-2 text-sm text-[var(--text)]">
            <p>Auth, resume parsing, Firebase resume storage, Jobright scraping, and AI job matching are all available in this build.</p>
            <p>The current workspace also includes per-job resume tailoring suggestions and accepted-change tracking.</p>
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
  themeMode,
}: {
  label: string;
  value: number;
  tone: 'green' | 'amber' | 'red' | 'slate';
  themeMode: ThemeMode;
}) {
  const isDark = themeMode === 'dark';
  const tones = {
    green: {
      border: isDark ? 'rgba(74, 222, 128, 0.28)' : 'rgba(187, 247, 208, 1)',
      background: isDark ? 'rgba(20, 83, 45, 0.3)' : '#f0fdf4',
      color: isDark ? '#bbf7d0' : '#166534',
    },
    amber: {
      border: isDark ? 'rgba(251, 191, 36, 0.28)' : 'rgba(253, 230, 138, 1)',
      background: isDark ? 'rgba(120, 53, 15, 0.25)' : '#fffbeb',
      color: isDark ? '#fde68a' : '#92400e',
    },
    red: {
      border: isDark ? 'rgba(248, 113, 113, 0.28)' : 'rgba(254, 202, 202, 1)',
      background: isDark ? 'rgba(127, 29, 29, 0.24)' : '#fef2f2',
      color: isDark ? '#fecaca' : '#b91c1c',
    },
    slate: {
      border: 'var(--border)',
      background: 'var(--surface-soft)',
      color: 'var(--text-strong)',
    },
  } as const;

  return (
    <div
      className="rounded-[22px] border p-4"
      style={{
        borderColor: tones[tone].border,
        background: tones[tone].background,
        color: tones[tone].color,
      }}
    >
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default WorkspaceApp;
