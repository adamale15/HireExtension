import { useState } from 'react';
import type { ScrapedJob, Resume } from '../lib/types';
import { analyzeAllJobs } from '../lib/job-matcher';

export function useJobMatching() {
  const [analyzing, setAnalyzing] = useState(false);
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

      console.log('🤖 Starting AI job matching...');

      const analyzedJobs = await analyzeAllJobs(
        jobs,
        resumes,
        (current, total) => {
          setProgress({ current, total });
        }
      );

      console.log('✅ Job matching complete!');
      return analyzedJobs;
    } catch (err: any) {
      console.error('Error during job matching:', err);
      setError(err.message || 'Failed to analyze jobs');
      return jobs;
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    analyzing,
    progress,
    error,
    analyzeJobs,
  };
}
