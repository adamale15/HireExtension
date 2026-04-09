export default defineContentScript({
  matches: ['*://jobright.ai/*'],
  main() {
    console.log('HireExtension content script loaded on Jobright');

    // This will be fully implemented in Phase 3
    // For now, just log that we're ready to scrape
    
    if (window.location.pathname.includes('/jobs') || window.location.pathname.includes('/recommend')) {
      console.log('Job listing page detected, ready to scrape');
      
      // Placeholder for Phase 3 scraping logic
      // Will implement:
      // - DOM scraping of job cards
      // - MutationObserver for infinite scroll
      // - Sending scraped jobs to background worker
    }
  },
});
