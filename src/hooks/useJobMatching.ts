import { useState } from 'react';
import type { Resume, ScrapedJob } from '../lib/types';
import {
  analyzeAllJobs,
  analyzeJobAgainstResume,
  findBestResumeMatch,
} from '../lib/job-matcher';

export function useJobMatching() {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const analyzeJobs = async (jobs: ScrapedJob[], resumes: Resume[]): Promise<ScrapedJob[]> => {
    if (resumes.length === 0) {
      setError('Please upload at least one resume first');
      return jobs;
    }

    try {
      setAnalyzing(true);
      setError(null);
      setProgress({ current: 0, total: jobs.length });

      const analyzedJobs = await analyzeAllJobs(jobs, resumes, (current, total) => {
        setProgress({ current, total });
      });

      return analyzedJobs;
    } catch (err: any) {
      console.error('Error during job matching:', err);
      setError(err.message || 'Failed to analyze jobs');
      return jobs;
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeJob = async (
    job: ScrapedJob,
    resumes: Resume[],
    selectedResumeId?: string,
  ): Promise<ScrapedJob> => {
    if (resumes.length === 0) {
      setError('Please upload at least one resume first');
      return job;
    }

    try {
      setAnalyzing(true);
      setActiveJobId(job.id);
      setError(null);

      const selectedResume = selectedResumeId
        ? resumes.find((resume) => resume.id === selectedResumeId)
        : null;

      if (selectedResumeId && !selectedResume) {
        throw new Error('Selected resume could not be found');
      }

      const match = selectedResume
        ? await analyzeJobAgainstResume(job, selectedResume)
        : await findBestResumeMatch(job, resumes);

      return {
        ...job,
        aiMatch: match,
      };
    } catch (err: any) {
      console.error('Error during single-job matching:', err);
      setError(err.message || 'Failed to analyze this job');
      return job;
    } finally {
      setAnalyzing(false);
      setActiveJobId(null);
    }
  };

  return {
    analyzing,
    activeJobId,
    progress,
    error,
    analyzeJob,
    analyzeJobs,
  };
}
