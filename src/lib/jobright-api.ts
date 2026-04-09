import type { ScrapedJob } from './types';

interface CompanyResult {
  companyId: string;
  companyName: string;
  companySize?: string;
}

interface JobrightJobResult {
  jobId: string;
  jobTitle: string;
  jobLocation: string;
  jobSeniority: string;
  workModel: string;
  isRemote: boolean;
  salaryDesc: string;
  minSalary?: number;
  maxSalary?: number;
  employmentType: string;
  publishTimeDesc: string;
  jobSummary: string;
  applyLink: string;
  originalUrl: string;
  applicantsCount: number;
  isH1bSponsor: boolean;
  jdLogo?: string;
}

interface JobrightAPIItem {
  impId: string;
  displayScore: number;
  rankDesc: string;
  companyResult?: CompanyResult;
  jobResult: JobrightJobResult;
}

interface JobrightAPIResponse {
  success: boolean;
  errorCode: number;
  errorMsg: string | null;
  result: {
    jobList: JobrightAPIItem[];
  };
}

/**
 * Fetch all recommended jobs from Jobright API
 * This uses Jobright's internal API to get all job data directly
 */
export async function fetchAllRecommendedJobs(): Promise<ScrapedJob[]> {
  console.log('🔄 Fetching recommended jobs from Jobright API...');
  
  const allJobs: ScrapedJob[] = [];
  const jobsPerPage = 10;
  let position = 0;
  let hasMore = true;
  let attempts = 0;
  const maxAttempts = 100; // Max 1000 jobs
  
  while (hasMore && attempts < maxAttempts) {
    attempts++;
    
    try {
      const url = `https://jobright.ai/swan/recommend/list/jobs?refresh=false&sortCondition=0&position=${position}&count=${jobsPerPage}&syncRerank=false`;
      
      console.log(`📡 Fetching jobs at position ${position}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        break;
      }
      
      const data: JobrightAPIResponse = await response.json();
      
      if (!data.success || !data.result?.jobList) {
        console.error('API returned error:', data.errorMsg);
        break;
      }
      
      const jobs = data.result.jobList;
      
      if (jobs.length === 0) {
        console.log('✅ No more jobs available');
        hasMore = false;
        break;
      }
      
      console.log(`  ✓ Received ${jobs.length} jobs`);
      
      // Convert API response to ScrapedJob format
      jobs.forEach((item) => {
        const job = item.jobResult;
        
        // Extract company name - it's in companyResult at the item level
        let company = 'Company name not found';
        if (item.companyResult?.companyName) {
          company = item.companyResult.companyName;
        }
        
        // Debug logging for first job to see structure
        if (allJobs.length === 0) {
          console.log('📋 Sample job structure:', {
            hasCompanyResult: !!item.companyResult,
            companyResultKeys: item.companyResult ? Object.keys(item.companyResult) : [],
            jobResultKeys: Object.keys(job).filter(k => k.toLowerCase().includes('company')),
            urlFields: {
              applyLink: job.applyLink,
              originalUrl: job.originalUrl,
              hasApplyLink: !!job.applyLink,
              hasOriginalUrl: !!job.originalUrl
            }
          });
        }
        
        // Parse work model
        let workModel: 'remote' | 'onsite' | 'hybrid' | null = null;
        if (job.workModel?.toLowerCase() === 'remote' || job.isRemote) workModel = 'remote';
        else if (job.workModel?.toLowerCase() === 'onsite') workModel = 'onsite';
        else if (job.workModel?.toLowerCase() === 'hybrid') workModel = 'hybrid';
        
        // Parse salary
        let salary: ScrapedJob['salary'] = null;
        if (job.minSalary && job.maxSalary) {
          salary = {
            min: job.minSalary,
            max: job.maxSalary,
            currency: 'USD'
          };
        }
        
        // Determine the best URL to use for applying
        // Priority: applyLink > originalUrl
        let applyUrl = job.applyLink || job.originalUrl;
        
        // If no direct URL or it points back to Jobright, leave as undefined
        if (!applyUrl || applyUrl.includes('jobright.ai')) {
          applyUrl = undefined;
        }
        
        const scrapedJob: ScrapedJob = {
          id: job.jobId,
          title: job.jobTitle,
          company,
          location: job.jobLocation,
          workModel,
          salary,
          url: `https://jobright.ai/jobs/info/${job.jobId}`, // Jobright page
          applyUrl: applyUrl, // Direct company application link (if available)
          h1bSponsorship: job.isH1bSponsor,
          applicantCount: job.applicantsCount?.toString() || 'Unknown',
          postedAt: job.publishTimeDesc || 'Recently',
          scrapedAt: new Date(),
          // Store Jobright-specific data
          matchScore: item.displayScore,
          rankDesc: item.rankDesc,
          jobSummary: job.jobSummary,
        };
        
        allJobs.push(scrapedJob);
      });
      
      // Move to next page
      position += jobsPerPage;
      
      // If we got fewer jobs than requested, we've reached the end
      if (jobs.length < jobsPerPage) {
        console.log('  → Last page (fewer jobs than requested)');
        hasMore = false;
      }
      
      // Small delay to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error fetching jobs from API:', error);
      break;
    }
  }
  
  console.log(`\n✅ Successfully fetched ${allJobs.length} total jobs from Jobright API`);
  return allJobs;
}
