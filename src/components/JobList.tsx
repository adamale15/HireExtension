import { useMemo, useState } from 'react';
import type {
  MatchCategory,
  Resume,
  ScrapedJob,
  TailoredResume,
  ThemeMode,
  WorkModel,
} from '../lib/types';

type CategoryFilter = MatchCategory | 'all' | 'unanalyzed';
type SortOption = 'recent' | 'match-desc' | 'match-asc' | 'company';

interface JobListProps {
  jobs: ScrapedJob[];
  resumes: Resume[];
  defaultResumeId: string | null;
  onJobClick?: (job: ScrapedJob) => void;
  onAnalyzeJob?: (job: ScrapedJob, resumeId?: string) => Promise<void>;
  onTailorResume?: (job: ScrapedJob, resumeId?: string) => Promise<void>;
  loading?: boolean;
  analyzing?: boolean;
  activeJobId?: string | null;
  tailoring?: boolean;
  activeTailoringKey?: string | null;
  getResumeName?: (resumeId: string | null) => string | null;
  getTailoredResume?: (jobId: string, resumeId: string) => TailoredResume | null;
  onToggleTailoredChange?: (tailoredResumeId: string, changeId: string) => Promise<void>;
  themeMode: ThemeMode;
}

function getTailoringStateKey(jobId: string, resumeId: string) {
  return `${jobId}:${resumeId}`;
}

export function JobList({
  jobs,
  resumes,
  defaultResumeId,
  onJobClick,
  onAnalyzeJob,
  onTailorResume,
  loading,
  analyzing,
  activeJobId,
  tailoring,
  activeTailoringKey,
  getResumeName,
  getTailoredResume,
  onToggleTailoredChange,
  themeMode,
}: JobListProps) {
  const isDark = themeMode === 'dark';
  const [workModelFilter, setWorkModelFilter] = useState<'all' | WorkModel>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [selectedJob, setSelectedJob] = useState<ScrapedJob | null>(null);
  const [selectedTailoringJob, setSelectedTailoringJob] = useState<ScrapedJob | null>(null);
  const [selectedResumeByJob, setSelectedResumeByJob] = useState<Record<string, string>>({});

  const categoryCount = useMemo(
    () => ({
      all: jobs.length,
      safe: jobs.filter((job) => job.aiMatch?.category === 'safe').length,
      moderate: jobs.filter((job) => job.aiMatch?.category === 'moderate').length,
      'dont-apply': jobs.filter((job) => job.aiMatch?.category === 'dont-apply').length,
      unanalyzed: jobs.filter((job) => !job.aiMatch).length,
    }),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const visibleJobs = jobs.filter((job) => {
      if (workModelFilter !== 'all' && job.workModel !== workModelFilter) {
        return false;
      }

      if (categoryFilter === 'unanalyzed' && job.aiMatch) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        categoryFilter !== 'unanalyzed' &&
        job.aiMatch?.category !== categoryFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [job.title, job.company, job.location, job.jobSummary || '']
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return visibleJobs.sort((left, right) => {
      switch (sortOption) {
        case 'match-desc':
          return (right.aiMatch?.score ?? -1) - (left.aiMatch?.score ?? -1);
        case 'match-asc':
          return (left.aiMatch?.score ?? 101) - (right.aiMatch?.score ?? 101);
        case 'company':
          return left.company.localeCompare(right.company);
        case 'recent':
        default:
          return new Date(right.scrapedAt).getTime() - new Date(left.scrapedAt).getTime();
      }
    });
  }, [categoryFilter, jobs, searchQuery, sortOption, workModelFilter]);

  const getSelectedResumeId = (job: ScrapedJob) =>
    selectedResumeByJob[job.id] ||
    job.aiMatch?.recommendedResumeId ||
    defaultResumeId ||
    resumes[0]?.id ||
    '';

  const getSelectedResume = (job: ScrapedJob) =>
    resumes.find((resume) => resume.id === getSelectedResumeId(job)) || null;

  const handleResumeChange = (jobId: string, resumeId: string) => {
    setSelectedResumeByJob((current) => ({
      ...current,
      [jobId]: resumeId,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="mb-4 text-[var(--text-soft)]">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-[var(--text-strong)]">No jobs found yet</h3>
        <p className="mb-4 text-[var(--text)]">
          Sign in to Jobright and open the recommended jobs page to start scanning.
        </p>
        <a
          href="https://jobright.ai/jobs/recommend"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-2xl px-4 py-2 text-white transition-colors"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
              : 'linear-gradient(135deg, #0f172a, #0369a1)',
          }}
        >
          Open Recommended Jobs
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <input
            type="text"
            placeholder="Search jobs, companies, locations, or summary..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-2xl px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-sky-500"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-soft)',
              color: 'var(--text-strong)',
            }}
          />

          <select
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as SortOption)}
            className="rounded-2xl px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-sky-500"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-soft)',
              color: 'var(--text-strong)',
            }}
          >
            <option value="recent">Newest first</option>
            <option value="match-desc">Highest match score</option>
            <option value="match-asc">Lowest match score</option>
            <option value="company">Company A-Z</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', `All (${categoryCount.all})`],
              ['safe', `Safe (${categoryCount.safe})`],
              ['moderate', `Moderate (${categoryCount.moderate})`],
              ['dont-apply', `Don't Apply (${categoryCount['dont-apply']})`],
              ['unanalyzed', `Unanalyzed (${categoryCount.unanalyzed})`],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value as CategoryFilter)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  categoryFilter === value
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(['all', 'remote', 'onsite', 'hybrid'] as const).map((workModel) => (
              <button
                key={workModel}
                onClick={() => setWorkModelFilter(workModel)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  workModelFilter === workModel
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {workModel}
              </button>
            ))}
          </div>

          <div className="text-sm text-[var(--text)]">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div
            className="rounded-[24px] px-4 py-10 text-center"
            style={{
              border: '1px dashed var(--border-strong)',
              background: 'var(--surface-soft)',
            }}
          >
            <p className="font-medium text-[var(--text-strong)]">No jobs match the current filters.</p>
            <p className="mt-1 text-sm text-[var(--text)]">
              Try clearing a filter, changing the search, or re-running analysis on more jobs.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const selectedResumeId = getSelectedResumeId(job);

              return (
                <JobCard
                  key={job.id}
                  job={job}
                  resumes={resumes}
                  selectedResumeId={selectedResumeId}
                  onResumeChange={handleResumeChange}
                onAnalyzeJob={onAnalyzeJob}
                onClick={() => onJobClick?.(job)}
                onViewDetails={() => setSelectedJob(job)}
                onViewTailoring={() => setSelectedTailoringJob(job)}
                getResumeName={getResumeName}
                themeMode={themeMode}
                isAnalyzing={analyzing && activeJobId === job.id}
                  isTailoring={
                    tailoring &&
                    activeTailoringKey === getTailoringStateKey(job.id, selectedResumeId)
                  }
                  hasTailoring={Boolean(getTailoredResume?.(job.id, selectedResumeId))}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedJob && (
        <MatchDetailsModal
          job={selectedJob}
          resumeName={getResumeName?.(selectedJob.aiMatch?.recommendedResumeId || null) || null}
          onClose={() => setSelectedJob(null)}
          onOpenJob={() => onJobClick?.(selectedJob)}
          themeMode={themeMode}
        />
      )}

      {selectedTailoringJob && (
        <ResumeTailoringModal
          job={selectedTailoringJob}
          resumes={resumes}
          selectedResumeId={getSelectedResumeId(selectedTailoringJob)}
          tailoredResume={
            getTailoredResume?.(
              selectedTailoringJob.id,
              getSelectedResumeId(selectedTailoringJob),
            ) || null
          }
          onResumeChange={(resumeId) => handleResumeChange(selectedTailoringJob.id, resumeId)}
          onGenerate={async () => {
            const resume = getSelectedResume(selectedTailoringJob);

            if (!resume) {
              return;
            }

            await onTailorResume?.(selectedTailoringJob, resume.id);
          }}
          onToggleAccepted={onToggleTailoredChange}
          onOpenJob={() => onJobClick?.(selectedTailoringJob)}
          onClose={() => setSelectedTailoringJob(null)}
          themeMode={themeMode}
          isTailoring={
            tailoring &&
            activeTailoringKey ===
              getTailoringStateKey(
                selectedTailoringJob.id,
                getSelectedResumeId(selectedTailoringJob),
              )
          }
        />
      )}
    </>
  );
}

interface JobCardProps {
  job: ScrapedJob;
  resumes: Resume[];
  selectedResumeId: string;
  onResumeChange: (jobId: string, resumeId: string) => void;
  onAnalyzeJob?: (job: ScrapedJob, resumeId?: string) => Promise<void>;
  onClick?: () => void;
  onViewDetails: () => void;
  onViewTailoring: () => void;
  getResumeName?: (resumeId: string | null) => string | null;
  themeMode: ThemeMode;
  isAnalyzing?: boolean;
  isTailoring?: boolean;
  hasTailoring?: boolean;
}

function JobCard({
  job,
  resumes,
  selectedResumeId,
  onResumeChange,
  onAnalyzeJob,
  onClick,
  onViewDetails,
  onViewTailoring,
  getResumeName,
  themeMode,
  isAnalyzing,
  isTailoring,
  hasTailoring,
}: JobCardProps) {
  const isDark = themeMode === 'dark';
  const hasAIMatch = Boolean(job.aiMatch);
  const recommendedResumeName = getResumeName?.(job.aiMatch?.recommendedResumeId || null);

  const categoryStyles: Record<MatchCategory, string> = {
    safe: 'border-green-300 bg-green-50 text-green-800',
    moderate: 'border-amber-300 bg-amber-50 text-amber-800',
    'dont-apply': 'border-red-300 bg-red-50 text-red-800',
  };

  const handleAnalyzeClick = async () => {
    if (!selectedResumeId) {
      await onAnalyzeJob?.(job);
      return;
    }

    await onAnalyzeJob?.(job, selectedResumeId);
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-[24px] border-2 p-4 shadow-sm transition-shadow hover:shadow-md ${
        hasAIMatch ? categoryStyles[job.aiMatch!.category] : ''
      }`}
      style={
        hasAIMatch
          ? undefined
          : {
              borderColor: 'var(--border-strong)',
              background: 'var(--surface-strong)',
            }
      }
    >
      {hasAIMatch && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                categoryStyles[job.aiMatch!.category]
              }`}
            >
              {job.aiMatch!.category === 'safe' && 'SAFE APPLY'}
              {job.aiMatch!.category === 'moderate' && 'MODERATE'}
              {job.aiMatch!.category === 'dont-apply' && "DON'T APPLY"}
            </span>
            <span className="text-sm font-bold text-[var(--text-strong)]">{job.aiMatch!.score}% match</span>
          </div>

          {recommendedResumeName && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              Best resume: {recommendedResumeName}
            </span>
          )}
        </div>
      )}

      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-[var(--text-strong)]">{job.title}</h3>
          <p className="text-sm text-[var(--text)]">{job.company}</p>
        </div>

        {job.workModel && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
              job.workModel === 'remote'
                ? 'bg-green-100 text-green-800'
                : job.workModel === 'hybrid'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
            }`}
          >
            {job.workModel}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-[var(--text)]">
        <div className="flex items-center">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {job.location}
        </div>

        {job.salary && (
          <div className="flex items-center">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ${(job.salary.min / 1000).toFixed(0)}K - ${(job.salary.max / 1000).toFixed(0)}K
          </div>
        )}

        <div className="flex items-center">
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {job.postedAt}
        </div>
      </div>

      {hasAIMatch && job.aiMatch!.insights.length > 0 && (
        <div
          className="mb-3 rounded-[18px] p-3 text-sm"
          style={{ background: 'var(--surface-soft)', color: 'var(--text)' }}
        >
          <p className="mb-1 font-medium text-[var(--text-strong)]">AI insight</p>
          <p>{job.aiMatch!.insights[0]}</p>
        </div>
      )}

      {hasAIMatch && job.aiMatch!.matchingSkills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {job.aiMatch!.matchingSkills.slice(0, 5).map((skill) => (
            <span
              key={`${job.id}-${skill}`}
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
            >
              {skill}
            </span>
          ))}
          {job.aiMatch!.matchingSkills.length > 5 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ background: 'var(--surface-soft)', color: 'var(--text)' }}
            >
              +{job.aiMatch!.matchingSkills.length - 5} more
            </span>
          )}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {job.h1bSponsorship === true && (
          <span className="rounded-full bg-green-100 px-2 py-1 text-green-800">
            H1B sponsor likely
          </span>
        )}
        {job.h1bSponsorship === false && (
          <span
            className="rounded-full px-2 py-1"
            style={{ background: 'var(--surface-soft)', color: 'var(--text-strong)' }}
          >
            No H1B
          </span>
        )}
        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">
          {job.applicantCount} applicants
        </span>
      </div>

      <div className="flex flex-col gap-3 border-t pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        {resumes.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-soft)]">
              Resume for this job
            </label>
            <select
              value={selectedResumeId}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onResumeChange(job.id, event.target.value)}
              className="min-w-0 flex-1 rounded-2xl px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-sky-500"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text-strong)',
              }}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleAnalyzeClick();
              }}
              disabled={isAnalyzing}
              className="rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isDark
                  ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                  : 'linear-gradient(135deg, #0f172a, #0369a1)',
              }}
            >
              {isAnalyzing ? 'Analyzing...' : hasAIMatch ? 'Re-run with resume' : 'Analyze this job'}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewTailoring();
              }}
              className="rounded-2xl px-4 py-2 text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--border-strong)',
                background: 'var(--surface-soft)',
                color: 'var(--text-strong)',
              }}
            >
              {isTailoring ? 'Tailoring...' : hasTailoring ? 'Open tailoring' : 'Tailor resume'}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onViewDetails();
              }}
              className="text-sm font-medium text-[var(--text)]"
            >
              {hasAIMatch ? 'View match details' : 'View job details'}
            </button>

            {hasTailoring && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewTailoring();
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View tailoring
              </button>
            )}
          </div>

          <a
            href={job.applyUrl || job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="flex items-center text-sm font-medium text-[var(--accent)]"
          >
            {job.applyUrl ? 'Apply now' : 'View job'}
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

interface MatchDetailsModalProps {
  job: ScrapedJob;
  resumeName: string | null;
  onClose: () => void;
  onOpenJob?: () => void;
  themeMode: ThemeMode;
}

function MatchDetailsModal({
  job,
  resumeName,
  onClose,
  onOpenJob,
  themeMode,
}: MatchDetailsModalProps) {
  const isDark = themeMode === 'dark';
  const match = job.aiMatch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] shadow-2xl"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-4 px-6 py-5"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">{job.company}</p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-strong)]">{job.title}</h2>
            <p className="mt-1 text-sm text-[var(--text)]">
              {[job.location, job.workModel].filter(Boolean).join(' | ')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-soft)',
              color: 'var(--text)',
            }}
          >
            <span className="sr-only">Close details</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {match ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <StatCard label="Match score" value={`${match.score}%`} tone="blue" />
                <StatCard
                  label="Category"
                  value={
                    match.category === 'safe'
                      ? 'Safe Apply'
                      : match.category === 'moderate'
                        ? 'Moderate'
                        : "Don't Apply"
                  }
                  tone={
                    match.category === 'safe'
                      ? 'green'
                      : match.category === 'moderate'
                        ? 'amber'
                        : 'red'
                  }
                />
                <StatCard
                  label="Recommended resume"
                  value={resumeName || 'Selected resume'}
                  tone="slate"
                />
              </div>

              <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  Experience alignment
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <DetailPill label="Role level" value={match.experienceMatch.required} />
                  <DetailPill label="Your level" value={match.experienceMatch.yourLevel} />
                  <DetailPill
                    label="Overall fit"
                    value={match.experienceMatch.isMatch ? 'Aligned' : 'Needs review'}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailSection
                  title="Matching skills"
                  items={match.matchingSkills}
                  emptyText="No skill matches were returned for this job."
                  tone="green"
                />
                <DetailSection
                  title="Missing skills"
                  items={match.missingSkills}
                  emptyText="No major gaps were identified."
                  tone="red"
                />
              </div>

              <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  Full AI insights
                </h3>
                <div className="mt-3 space-y-2">
                  {match.insights.length > 0 ? (
                    match.insights.map((insight, index) => (
                      <div
                        key={`${job.id}-insight-${index}`}
                        className="rounded-lg p-3 text-sm"
                        style={{ background: 'var(--surface-soft)', color: 'var(--text)' }}
                      >
                        {insight}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text)]">No detailed insights were returned yet.</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              className="rounded-xl p-5 text-sm"
              style={{
                border: '1px dashed var(--border-strong)',
                color: 'var(--text)',
              }}
            >
              This job has not been analyzed yet. Pick a resume from the card and run AI analysis
              to see detailed fit information here.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Job snapshot
              </h3>
              <div className="mt-3 space-y-2 text-sm text-[var(--text)]">
                <p>
                  <span className="font-medium text-[var(--text-strong)]">Posted:</span> {job.postedAt}
                </p>
                <p>
                  <span className="font-medium text-[var(--text-strong)]">Applicants:</span>{' '}
                  {job.applicantCount}
                </p>
                <p>
                  <span className="font-medium text-[var(--text-strong)]">Work model:</span>{' '}
                  {job.workModel || 'Unknown'}
                </p>
                <p>
                  <span className="font-medium text-[var(--text-strong)]">Salary:</span>{' '}
                  {job.salary
                    ? `$${(job.salary.min / 1000).toFixed(0)}K - $${(job.salary.max / 1000).toFixed(0)}K`
                    : 'Not listed'}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                Next action
              </h3>
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[var(--text)]">
                  Open the listing to review the full description, requirements, and direct
                  application path.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenJob?.()}
                  className="rounded-2xl px-4 py-2 text-sm font-medium text-white"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                      : 'linear-gradient(135deg, #0f172a, #0369a1)',
                  }}
                >
                  Open job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResumeTailoringModalProps {
  job: ScrapedJob;
  resumes: Resume[];
  selectedResumeId: string;
  tailoredResume: TailoredResume | null;
  onResumeChange: (resumeId: string) => void;
  onGenerate: () => Promise<void>;
  onToggleAccepted?: (tailoredResumeId: string, changeId: string) => Promise<void>;
  onOpenJob?: () => void;
  onClose: () => void;
  themeMode: ThemeMode;
  isTailoring?: boolean;
}

function ResumeTailoringModal({
  job,
  resumes,
  selectedResumeId,
  tailoredResume,
  onResumeChange,
  onGenerate,
  onToggleAccepted,
  onOpenJob,
  onClose,
  themeMode,
  isTailoring,
}: ResumeTailoringModalProps) {
  const isDark = themeMode === 'dark';
  const selectedResume = resumes.find((resume) => resume.id === selectedResumeId) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] shadow-2xl"
        style={{
          background: 'var(--surface-strong)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      >
        <div
          className="sticky top-0 flex items-start justify-between gap-4 px-6 py-5"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent)]">
              Resume tailoring
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-strong)]">{job.title}</h2>
            <p className="mt-1 text-sm text-[var(--text)]">{job.company}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2"
            style={{
              border: '1px solid var(--border-strong)',
              background: 'var(--surface-soft)',
              color: 'var(--text)',
            }}
          >
            <span className="sr-only">Close tailoring</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">
                  Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(event) => onResumeChange(event.target.value)}
                  className="mt-2 w-full rounded-2xl px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-sky-500"
                  style={{
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-soft)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onGenerate()}
                  disabled={!selectedResume || isTailoring}
                  className="rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, #38bdf8, #0f172a)'
                      : 'linear-gradient(135deg, #0f172a, #0369a1)',
                  }}
                >
                  {isTailoring
                    ? 'Generating tailoring...'
                    : tailoredResume
                      ? 'Refresh suggestions'
                      : 'Generate suggestions'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenJob?.()}
                  className="rounded-2xl px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    border: '1px solid var(--border-strong)',
                    background: 'var(--surface-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  Open job
                </button>
              </div>
            </div>

            {selectedResume && (
              <p className="mt-3 text-sm text-[var(--text)]">
                Suggestions are generated from{' '}
                <span className="font-medium text-[var(--text-strong)]">{selectedResume.name}</span> and
                stored locally for this job.
              </p>
            )}
          </div>

          {tailoredResume ? (
            <>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  Best angle
                </h3>
                <p className="mt-2 text-sm text-blue-900">{tailoredResume.overview}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <DetailSection
                  title="Strengths to keep"
                  items={tailoredResume.strengthsToKeep}
                  emptyText="No specific strengths were called out."
                  tone="green"
                />
                <DetailSection
                  title="Priority gaps"
                  items={tailoredResume.priorityGaps}
                  emptyText="No major risks were identified."
                  tone="red"
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Suggested rewrites
                  </h3>
                  <p className="text-xs text-gray-500">
                    {tailoredResume.changes.filter((change) => change.accepted).length}/
                    {tailoredResume.changes.length} marked accepted
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Accepted changes are saved locally as checklist items only. Your stored resume and
                  PDF stay unchanged for now.
                </p>

                <div className="mt-4 space-y-4">
                  {tailoredResume.changes.map((change) => (
                    <div
                      key={change.id}
                      className={`rounded-xl border p-4 ${
                        change.accepted
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {change.section}
                          </p>
                          <h4 className="mt-1 text-base font-semibold text-gray-900">
                            {change.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => void onToggleAccepted?.(tailoredResume.id, change.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            change.accepted
                              ? 'bg-green-200 text-green-900'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {change.accepted ? 'Accepted' : 'Mark accepted'}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Current version
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                            {change.original || 'No original text returned.'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-slate-900 p-3 text-white">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                            Tailored version
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-50">
                            {change.tailored || 'No tailored rewrite returned.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-blue-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Why this helps
                          </p>
                          <p className="mt-2 text-sm text-blue-900">
                            {change.reason || 'Reason not provided.'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Expected impact
                          </p>
                          <p className="mt-2 text-sm text-amber-900">
                            {change.impact || 'Impact not provided.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-700">
              Generate tailoring suggestions to get a job-specific rewrite plan for the selected
              resume. This phase focuses on structured edits you can apply manually, not PDF
              regeneration yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'slate';
}) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-gray-900">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: string[];
  emptyText: string;
  tone: 'green' | 'red';
}) {
  const toneStyles = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  } as const;

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={`${title}-${item}`}
              className={`rounded-full px-2.5 py-1 text-sm ${toneStyles[tone]}`}
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-gray-600">{emptyText}</p>
        )}
      </div>
    </div>
  );
}
