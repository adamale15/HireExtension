# Phase 3 Testing Guide - Recommended Jobs Scraping

## What's Implemented

Phase 3 adds job scraping functionality specifically from Jobright's **Recommended Jobs** page:
- ✅ Content script that targets `/jobs/recommend` page only
- ✅ DOM scraping to extract personalized recommended job information
- ✅ MutationObserver for infinite scroll detection
- ✅ Background worker storage and badge updates
- ✅ Job list UI with filters and search
- ✅ Real-time job updates in the extension

## How to Test

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. The extension should already be loaded by WXT
4. You should see "HireExtension" in your extensions

### 2. Sign In to Jobright and Navigate to Recommended Jobs

**IMPORTANT**: You must be signed in to Jobright to access the recommended jobs page.

1. Open a new tab
2. Go to https://jobright.ai and **sign in** with your Jobright account
3. Once signed in, navigate to: **https://jobright.ai/jobs/recommend**
4. This is the page where Jobright shows your personalized recommended jobs

### 3. Wait for Scraping

1. The content script will automatically detect the recommended page
2. Wait 3 seconds for the initial scrape (longer delay for dynamic content)
3. Check the extension badge - it should show the number of recommended jobs found
4. Open DevTools (F12) > Console to see scraping logs:
   ```
   HireExtension content script loaded on Jobright
   Recommended jobs page detected, initializing scraper
   Starting Jobright job scraping...
   Found X elements with selector: ...
   Scraping X job cards...
   Successfully scraped X recommended jobs
   ```

### 4. View Recommended Jobs in Extension

1. Click the HireExtension icon in your toolbar
2. The side panel should open
3. Make sure you're signed in (use email/password)
4. Go to the "Jobs" tab
5. You should see all your personalized recommended jobs with:
   - Job title and company
   - Location and work model (Remote/Onsite/Hybrid)
   - Salary range (if available)
   - H1B sponsorship status
   - Applicant count
   - Posted time
   - Filters (All/Remote/Onsite/Hybrid)
   - Search functionality

### 5. Test Infinite Scroll

1. On the Jobright recommended page, scroll down to load more jobs
2. The MutationObserver should detect new jobs
3. The badge and job list should update automatically
4. Check DevTools console for:
   ```
   Observer detected X new jobs
   ```

### 6. Test Job Actions

- **Click on a job card**: Should open the job in a new tab
- **Search**: Type in the search box to filter by title/company/location
- **Filters**: Click Remote/Onsite/Hybrid to filter by work model
- **Refresh**: Click refresh to reload jobs from storage
- **Clear All**: Remove all scraped jobs

## Important Notes

- **Authentication Required**: The `/jobs/recommend` page requires you to be signed in to Jobright
- **Personalized Results**: The jobs shown are personalized based on your Jobright profile and resume
- **Page-Specific**: The scraper ONLY works on `https://jobright.ai/jobs/recommend`
  - Other Jobright pages (like `/jobs/search`) will be ignored
  - This ensures you're scraping the AI-recommended jobs, not generic search results

## Expected Data Extracted

For each job, the scraper extracts:
- `id`: Unique identifier from Jobright URL
- `title`: Job title (e.g., "Senior Software Engineer")
- `company`: Company name (e.g., "Google")
- `location`: Location (e.g., "Remote", "San Francisco, CA")
- `workModel`: Remote, Onsite, or Hybrid
- `salary`: Min/max range with currency (if listed)
- `url`: Direct link to the job on Jobright
- `h1bSponsorship`: true/false/null
- `applicantCount`: Number of applicants
- `postedAt`: When the job was posted
- `scrapedAt`: Timestamp of when we scraped it

## Troubleshooting

### No jobs showing up

1. **Make sure you're signed in to Jobright** - the recommended page requires authentication
2. Verify you're on the correct URL: `https://jobright.ai/jobs/recommend`
3. Check DevTools console for errors
4. Try refreshing the Jobright page
5. Make sure the extension is loaded and enabled
6. If you see "Not the recommended jobs page, skipping scraping" in console, you're on the wrong page

### Wrong page message

If console shows "Not the recommended jobs page, skipping scraping":
- You need to navigate to exactly: `https://jobright.ai/jobs/recommend`
- Other Jobright pages (like `/jobs/search`, `/jobs/applied`) will not trigger scraping
- This is intentional - we only scrape the AI-recommended jobs

### Badge not updating

1. Check background worker logs: DevTools > Extensions > Inspect service worker
2. Verify storage: DevTools > Application > Storage > Extension storage

### Jobs not persisting

- Jobs are stored in `chrome.storage.local`
- They persist across browser sessions
- Use "Clear All" button to reset

## What's Next

Phase 4-5 will add:
- AI-powered job matching with your resumes using Gemini
- Smart categorization (Safe Apply / Moderate Apply / Don't Apply)
- Resume recommendations for each job
- Match scores and detailed analysis

## Dev Logs

Content script logs:
```
HireExtension content script loaded on Jobright
Job listing page detected, initializing scraper
Starting Jobright job scraping...
```

Background worker logs:
```
Background received message: { type: 'JOBS_SCRAPED', payload: [...] }
Received X scraped jobs
```

Side panel logs:
```
UI received scraped jobs: X
Loaded X jobs from storage
```
