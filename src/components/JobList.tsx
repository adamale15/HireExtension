import { useState } from 'react';
import type { ScrapedJob } from '../lib/types';

interface JobListProps {
  jobs: ScrapedJob[];
  onJobClick?: (job: ScrapedJob) => void;
  loading?: boolean;
}

export function JobList({ jobs, onJobClick, loading }: JobListProps) {
  const [filter, setFilter] = useState<'all' | 'remote' | 'onsite' | 'hybrid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredJobs = jobs.filter((job) => {
    // Work model filter
    if (filter !== 'all' && job.workModel !== filter) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
        <p className="text-gray-600 mb-4">
          Sign in to Jobright and visit the recommended jobs page to start scanning
        </p>
        <a
          href="https://jobright.ai/jobs/recommend"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Recommended Jobs
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search jobs, companies, or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="flex gap-2">
          {(['all', 'remote', 'onsite', 'hybrid'] as const).map((workModel) => (
            <button
              key={workModel}
              onClick={() => setFilter(workModel)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                filter === workModel
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {workModel}
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => onJobClick?.(job)} />
        ))}
      </div>
    </div>
  );
}

interface JobCardProps {
  job: ScrapedJob;
  onClick?: () => void;
}

function JobCard({ job, onClick }: JobCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company}</p>
        </div>
        
        {job.workModel && (
          <span
            className={`ml-2 px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
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

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </div>

        {job.salary && (
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ${(job.salary.min / 1000).toFixed(0)}K - ${(job.salary.max / 1000).toFixed(0)}K
          </div>
        )}

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {job.postedAt}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {job.h1bSponsorship === true && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
            H1B Sponsor Likely
          </span>
        )}
        {job.h1bSponsorship === false && (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
            No H1B
          </span>
        )}
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
          {job.applicantCount} applicants
        </span>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <a
          href={job.applyUrl || job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
        >
          {job.applyUrl ? 'Apply Now' : 'View Job'}
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
