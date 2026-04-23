import { STORAGE_KEYS } from '../lib/types';

export default defineBackground(() => {
  console.log('HireExtension background worker started');

  browser.action.onClicked.addListener(async (tab) => {
    if (browser.sidePanel) {
      await browser.sidePanel.open({ windowId: tab.windowId });
    }
  });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Background received message:', message);

    switch (message.type) {
      case 'JOBS_SCRAPED':
        void handleJobsScraped(message.payload);
        break;

      case 'ANALYZE_JOBS':
        void handleAnalyzeJobs(message.payload).then(sendResponse);
        return true;

      case 'TAILOR_RESUME':
        void handleTailorResume(message.payload).then(sendResponse);
        return true;

      case 'AUTH_STATE_CHANGED':
        void handleAuthStateChanged(message.payload);
        break;
    }

    return undefined;
  });

  async function handleJobsScraped(jobs: unknown[]) {
    console.log(`Received ${jobs.length} scraped jobs`);

    await browser.storage.local.set({
      [STORAGE_KEYS.SCRAPED_JOBS]: jobs,
      [STORAGE_KEYS.LAST_SCRAPE_TIME]: new Date().toISOString(),
    });

    const text = jobs.length > 0 ? jobs.length.toString() : '';
    const color = jobs.length > 0 ? '#4F46E5' : '#9CA3AF';

    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color });

    try {
      await browser.runtime.sendMessage({
        type: 'JOBS_UPDATED',
        payload: jobs,
      });
    } catch {
      console.log('No receivers for JOBS_UPDATED');
    }
  }

  async function handleAnalyzeJobs(_payload: { jobs: unknown[]; resumes: unknown[] }) {
    return {
      success: true,
      message: 'Use the side panel jobs workspace to run AI analysis.',
    };
  }

  async function handleTailorResume(payload: { resumeId: string; jobId: string }) {
    console.log('Tailor resume requested:', payload);
    return { success: true, message: 'Resume tailoring is planned for a later phase.' };
  }

  async function handleAuthStateChanged(user: unknown) {
    console.log('Auth state changed:', user ? 'signed in' : 'signed out');

    if (!user) {
      await browser.action.setBadgeText({ text: '' });
    }
  }
});
