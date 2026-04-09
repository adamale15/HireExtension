import { fetchAllRecommendedJobs } from '../lib/jobright-api';
import type { ScrapedJob } from '../lib/types';

export default defineContentScript({
  matches: ['*://jobright.ai/*'],
  main() {
    console.log('HireExtension content script loaded on Jobright');

    // Only work on the recommended jobs page
    const isRecommendedPage = window.location.pathname === '/jobs/recommend';

    if (!isRecommendedPage) {
      console.log('Not the recommended jobs page, skipping');
      console.log('Please navigate to https://jobright.ai/jobs/recommend');
      return;
    }

    console.log('✅ Recommended jobs page detected');
    console.log('🚀 Using Jobright API to fetch all jobs...');

    // Listen for manual refresh requests
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'MANUAL_SCRAPE') {
        console.log('🔄 Manual refresh requested');
        fetchAndSendJobs();
      }
    });

    // Auto-fetch jobs after page loads
    setTimeout(() => {
      fetchAndSendJobs();
    }, 3000); // Wait for page to be ready
  },
});

async function fetchAndSendJobs() {
  try {
    console.log('📡 Fetching all recommended jobs from Jobright API...');
    
    // Check if we have cached jobs from the last hour
    const cachedData = await browser.storage.local.get(['cached_jobs', 'cache_timestamp']);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    if (cachedData.cached_jobs && cachedData.cache_timestamp) {
      const cacheAge = now - cachedData.cache_timestamp;
      if (cacheAge < oneHour) {
        console.log(`✅ Using cached jobs (${Math.round((oneHour - cacheAge) / 1000 / 60)} minutes remaining)`);
        const cachedJobs = cachedData.cached_jobs.map((job: any) => ({
          ...job,
          scrapedAt: new Date(job.scrapedAt)
        }));
        sendJobsToBackground(cachedJobs);
        return;
      }
    }
    
    // Fetch fresh jobs from API
    const jobs = await fetchAllRecommendedJobs();
    
    if (jobs.length > 0) {
      console.log(`✅ Successfully fetched ${jobs.length} jobs!`);
      
      // Cache the jobs for 1 hour
      await browser.storage.local.set({
        cached_jobs: jobs,
        cache_timestamp: now
      });
      
      sendJobsToBackground(jobs);
    } else {
      // Try to use cache even if expired
      if (cachedData.cached_jobs && cachedData.cached_jobs.length > 0) {
        console.warn('⚠️  API returned no jobs (rate limit?), using cached data');
        const cachedJobs = cachedData.cached_jobs.map((job: any) => ({
          ...job,
          scrapedAt: new Date(job.scrapedAt)
        }));
        sendJobsToBackground(cachedJobs);
      } else {
        console.log('⚠️  No jobs found. Make sure you are signed in to Jobright.');
      }
    }
  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    
    // Try to use cached data on error
    const cachedData = await browser.storage.local.get('cached_jobs');
    if (cachedData.cached_jobs && cachedData.cached_jobs.length > 0) {
      console.log('📦 Using cached jobs due to error');
      const cachedJobs = cachedData.cached_jobs.map((job: any) => ({
        ...job,
        scrapedAt: new Date(job.scrapedAt)
      }));
      sendJobsToBackground(cachedJobs);
    }
  }
}

function sendJobsToBackground(jobs: ScrapedJob[]) {
  browser.runtime.sendMessage({
    type: 'JOBS_SCRAPED',
    payload: jobs,
  }).catch((error) => {
    console.error('Error sending jobs to background:', error);
  });
}

