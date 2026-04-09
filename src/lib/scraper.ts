import type { ScrapedJob } from './types';

export function scrapeJobrightJobs(): ScrapedJob[] {
  const jobs: ScrapedJob[] = [];
  
  console.log('Starting Jobright recommended jobs scraping...');

  // Jobright has nested job-card divs. We want the ones that actually contain job links
  // Strategy: Find all job-card divs that have a direct job link (not parent containers)
  const allJobCards = Array.from(document.querySelectorAll('div[class*="job-card"]'));
  
  console.log(`Found ${allJobCards.length} total job-card divs`);

  if (allJobCards.length === 0) {
    console.warn('No job cards found. Page may still be loading.');
    return jobs;
  }

  // Find the actual job cards - they have a direct child link with /jobs/info/
  const actualJobCards = allJobCards.filter(card => {
    // Check if this card has a direct child anchor tag (not nested deep)
    const directLink = Array.from(card.children).find(
      child => child.tagName === 'A' && child.getAttribute('href')?.includes('/jobs/info/')
    );
    
    // Also check for immediate descendant (one level down)
    const immediateLink = card.querySelector('a[href*="/jobs/info/"]');
    const isActualJobCard = directLink || (immediateLink && card.querySelector('.index_job-card-main__zhEkE'));
    
    return isActualJobCard;
  });

  console.log(`Found ${actualJobCards.length} actual job cards with links`);

  // Track unique job URLs to prevent duplicates
  const seenUrls = new Set<string>();
  
  actualJobCards.forEach((element, index) => {
    try {
      const job = extractJobFromElement(element);
      if (job && !seenUrls.has(job.url)) {
        seenUrls.add(job.url);
        jobs.push(job);
        console.log(`✓ Job ${jobs.length}: ${job.title} at ${job.company}`);
      } else if (job && seenUrls.has(job.url)) {
        console.log(`⊘ Skipping duplicate: ${job.title}`);
      }
    } catch (error) {
      console.error(`Error scraping job ${index}:`, error);
    }
  });

  console.log(`✅ Successfully scraped ${jobs.length} unique jobs`);
  return jobs;
}

function extractJobFromElement(element: Element): ScrapedJob | null {
  try {
    const elementText = element.textContent || '';
    
    // Skip elements that are just labels/badges
    const invalidTitles = [
      'Why this job is a match',
      'H1B Sponsor Likely',
      'No H1B',
      'Comp. & Benefits',
      'Growth Opportunities',
      'STRONG MATCH',
      'ASK ORION',
      'APPLY WITH AUTOFILL'
    ];
    
    // Extract job URL from link
    const linkElement = element.querySelector('a[href*="/jobs/info/"]');
    if (!linkElement) {
      return null; // Must have a job link
    }
    
    const href = linkElement.getAttribute('href');
    const jobUrl = href?.startsWith('http') ? href : `https://jobright.ai${href}`;
    
    // Extract job ID from URL
    const jobIdMatch = jobUrl.match(/\/jobs\/info\/([a-zA-Z0-9]+)/);
    if (!jobIdMatch) {
      return null;
    }
    const jobId = jobIdMatch[1];

    // Extract title - usually in a heading or link text
    let title = '';
    
    // Try to get title from the main job link
    const jobLink = element.querySelector('a[href*="/jobs/info/"]');
    if (jobLink) {
      // The link itself might contain the title, or a heading inside it
      const heading = jobLink.querySelector('h1, h2, h3, h4');
      if (heading?.textContent?.trim()) {
        title = heading.textContent.trim();
      } else if (jobLink.textContent?.trim()) {
        // Get just the link's direct text, not all descendants
        const linkText = Array.from(jobLink.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent?.trim())
          .filter(text => text && text.length > 10)
          .join(' ');
        if (linkText) {
          title = linkText;
        }
      }
    }
    
    // Fallback: look for h1-h4 in the entire element
    if (!title) {
      const headings = element.querySelectorAll('h1, h2, h3, h4');
      for (const heading of Array.from(headings)) {
        const text = heading.textContent?.trim() || '';
        if (text.length > 10 && text.length < 150 && !invalidTitles.some(inv => text.includes(inv))) {
          title = text;
          break;
        }
      }
    }

    // Validate title
    if (!title || title.length < 5 || invalidTitles.some(inv => title.includes(inv))) {
      console.log('Skipping element - invalid or missing title:', title || 'none');
      return null;
    }

    // Extract company name - look for specific Jobright class
    let company = '';
    
    // First try: Jobright's specific company name class
    const companyElement = element.querySelector('[class*="company-name"]');
    if (companyElement) {
      company = companyElement.textContent?.trim() || '';
    }
    
    // Second try: Look for company in the structure (usually third row after title)
    if (!company) {
      const thirdRow = element.querySelector('[class*="third-row"]');
      if (thirdRow) {
        const companyDiv = thirdRow.querySelector('div.ant-typography');
        if (companyDiv) {
          company = companyDiv.textContent?.trim() || '';
        }
      }
    }
    
    // Third try: Look for all ant-typography divs and find company pattern
    if (!company) {
      const allTypographyDivs = element.querySelectorAll('div.ant-typography');
      
      for (const el of Array.from(allTypographyDivs)) {
        const text = el.textContent?.trim() || '';
        
        // Company name characteristics for Jobright:
        if (
          text.length > 2 && 
          text.length < 100 &&
          text !== '/' &&
          !text.includes('ago') &&
          !text.includes('applicant') &&
          !text.includes('$') &&
          !text.includes('·') && // Industry separator
          !text.includes('Full-time') &&
          !text.includes('Remote') &&
          !text.includes('Onsite') &&
          !text.includes('Hybrid') &&
          !text.includes('APPLY') &&
          !text.includes('ASK ORION') &&
          !text.includes('alumni') &&
          !text.includes('work here') &&
          !invalidTitles.some(inv => text.includes(inv)) &&
          text !== title
        ) {
          company = text;
          break;
        }
      }
    }

    // If still no company, use fallback
    if (!company) {
      company = 'Company not found';
    }

    // Extract location
    const locationRegex = /\b(Remote|Onsite|Hybrid|United States|[A-Z]{2}|[A-Za-z\s]+,\s*[A-Z]{2})\b/;
    const locationMatch = elementText.match(locationRegex);
    const location = locationMatch ? locationMatch[0] : 'Location not specified';

    // Extract work model
    let workModel: 'remote' | 'onsite' | 'hybrid' | null = null;
    if (elementText.match(/\bRemote\b/i)) workModel = 'remote';
    else if (elementText.match(/\bOnsite\b/i)) workModel = 'onsite';
    else if (elementText.match(/\bHybrid\b/i)) workModel = 'hybrid';

    // Extract salary
    let salary: ScrapedJob['salary'] = null;
    const salaryRegex = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)[kK]?(?:\/yr)?\s*[-–]\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)[kK]?(?:\/yr)?/;
    const salaryMatch = elementText.match(salaryRegex);
    if (salaryMatch) {
      const min = parseInt(salaryMatch[1].replace(/,/g, ''));
      const max = parseInt(salaryMatch[2].replace(/,/g, ''));
      const multiplier = min < 1000 ? 1000 : 1;
      salary = { 
        min: min * multiplier, 
        max: max * multiplier, 
        currency: 'USD' 
      };
    }

    // Extract H1B sponsorship
    const h1bSponsorship = elementText.includes('H1B Sponsor Likely') ? true : 
                           elementText.includes('No H1B') ? false : null;

    // Extract applicant count
    const applicantRegex = /(\d+|\d+\+|Less than \d+)\s+applicants?/i;
    const applicantMatch = elementText.match(applicantRegex);
    const applicantCount = applicantMatch ? applicantMatch[1] : 'Unknown';

    // Extract posted time
    const timeRegex = /(\d+)\s+(minute|hour|day|week)s?\s+ago/i;
    const timeMatch = elementText.match(timeRegex);
    const postedAt = timeMatch ? timeMatch[0] : 'Recently';

    // Extract match score if present
    let matchScore: number | null = null;
    const matchScoreRegex = /(\d+)%/;
    const matchScoreMatch = elementText.match(matchScoreRegex);
    if (matchScoreMatch) {
      matchScore = parseInt(matchScoreMatch[1]);
    }

    return {
      id: jobId,
      title: title.substring(0, 200),
      company: company.substring(0, 100),
      location,
      workModel,
      salary,
      url: jobUrl,
      h1bSponsorship,
      applicantCount,
      postedAt,
      scrapedAt: new Date(),
      ...(matchScore && { matchScore })
    };
  } catch (error) {
    console.error('Error extracting job data:', error);
    return null;
  }
}

export function setupJobObserver(callback: (jobs: ScrapedJob[]) => void): () => void {
  console.log('Setting up MutationObserver for new jobs...');

  let debounceTimer: number | null = null;

  const observer = new MutationObserver(() => {
    // Debounce to avoid scraping too frequently
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = window.setTimeout(() => {
      console.log('Page mutation detected, re-scraping...');
      const jobs = scrapeJobrightJobs();
      if (jobs.length > 0) {
        callback(jobs);
      }
    }, 1500); // Increased debounce time
  });

  // Observe the main content area for changes
  const contentArea = document.querySelector('main') || 
                      document.querySelector('[role="main"]') ||
                      document.getElementById('root') ||
                      document.body;
  
  observer.observe(contentArea, {
    childList: true,
    subtree: true,
  });

  console.log('MutationObserver active on:', contentArea.tagName);

  return () => {
    observer.disconnect();
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  };
}
