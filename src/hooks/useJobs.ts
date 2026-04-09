import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/types';
import type { ScrapedJob } from '../lib/types';

export function useJobs() {
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();

    // Listen for new jobs from content script
    const listener = (message: any) => {
      if (message.type === 'JOBS_SCRAPED') {
        console.log('UI received scraped jobs:', message.payload.length);
        setJobs(message.payload);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await browser.storage.local.get(STORAGE_KEYS.SCRAPED_JOBS);
      const storedJobs = result[STORAGE_KEYS.SCRAPED_JOBS] || [];
      
      // Convert date strings back to Date objects
      const parsedJobs = storedJobs.map((job: any) => ({
        ...job,
        scrapedAt: new Date(job.scrapedAt),
      }));
      
      setJobs(parsedJobs);
      console.log(`Loaded ${parsedJobs.length} jobs from storage`);
    } catch (err: any) {
      console.error('Error loading jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const clearJobs = async () => {
    try {
      await browser.storage.local.remove([
        STORAGE_KEYS.SCRAPED_JOBS,
        'cached_jobs',
        'cache_timestamp'
      ]);
      setJobs([]);
      await browser.action.setBadgeText({ text: '' });
      console.log('✅ Cleared all jobs and cache');
    } catch (err: any) {
      console.error('Error clearing jobs:', err);
      setError(err.message || 'Failed to clear jobs');
    }
  };

  const refreshJobs = async () => {
    // Send message to content script to re-scrape current page
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id, { type: 'MANUAL_SCRAPE' });
      }
    } catch (err) {
      console.log('Could not send scrape message to content script:', err);
    }
    
    // Also reload from storage
    await loadJobs();
  };

  return {
    jobs,
    loading,
    error,
    refreshJobs,
    clearJobs,
  };
}
