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
    
    // Store jobs in local storage
    await browser.storage.local.set({ scraped_jobs: jobs });
    
    // Update badge with job count
    await browser.action.setBadgeText({ text: jobs.length.toString() });
    await browser.action.setBadgeBackgroundColor({ color: '#3b82f6' });
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
