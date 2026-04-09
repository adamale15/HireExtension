import { STORAGE_KEYS } from '../lib/types';

export default defineBackground(() => {
  console.log('HireExtension background worker started');

  // Handle side panel opening
  browser.action.onClicked.addListener(async (tab) => {
    if (browser.sidePanel) {
      await browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  // Message handler for communication between content scripts and UI
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    switch (message.type) {
      case 'JOBS_SCRAPED':
        handleJobsScraped(message.payload);
        break;
      
      case 'ANALYZE_JOBS':
        handleAnalyzeJobs(message.payload).then(sendResponse);
        return true; // Keep channel open for async response
      
      case 'TAILOR_RESUME':
        handleTailorResume(message.payload).then(sendResponse);
        return true;
      
      case 'AUTH_STATE_CHANGED':
        handleAuthStateChanged(message.payload);
        break;
    }
  });

  async function handleJobsScraped(jobs: any[]) {
    console.log(`Received ${jobs.length} scraped jobs`);
    
    // Store jobs in local storage with timestamp
    await browser.storage.local.set({ 
      [STORAGE_KEYS.SCRAPED_JOBS]: jobs,
      [STORAGE_KEYS.LAST_SCRAPE_TIME]: new Date().toISOString()
    });
    
    // Update badge with job count
    const text = jobs.length > 0 ? jobs.length.toString() : '';
    const color = jobs.length > 0 ? '#4F46E5' : '#9CA3AF';
    
    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color });
    
    // Notify UI components that jobs have been updated
    try {
      await browser.runtime.sendMessage({
        type: 'JOBS_UPDATED',
        payload: jobs
      });
    } catch (err) {
      // No listeners, that's okay
      console.log('No receivers for JOBS_UPDATED');
    }
  }

  async function handleAnalyzeJobs(payload: { jobs: any[]; resumes: any[] }) {
    // This will be implemented in Phase 4 with Gemini integration
    console.log('Analyze jobs requested:', payload);
    return { success: true, message: 'Analysis will be implemented in Phase 4' };
  }

  async function handleTailorResume(payload: { resumeId: string; jobId: string }) {
    // This will be implemented in Phase 6 with Gemini integration
    console.log('Tailor resume requested:', payload);
    return { success: true, message: 'Tailoring will be implemented in Phase 6' };
  }

  async function handleAuthStateChanged(user: any) {
    console.log('Auth state changed:', user ? 'signed in' : 'signed out');
    
    if (!user) {
      // Clear badge when signed out
      await browser.action.setBadgeText({ text: '' });
    }
  }
});
