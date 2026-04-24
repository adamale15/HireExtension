import { analyzeResumeAgainstJobWithClaude, isClaudeBridgeConfigured } from './claude-bridge';
import type { AIJobMatch, Resume, ScrapedJob } from './types';

function ensureBridgeConfigured() {
  if (!isClaudeBridgeConfigured()) {
    throw new Error('Claude bridge is not configured');
  }
}

/**
 * Analyze a single job against a single resume.
 */
export async function analyzeJobAgainstResume(
  job: ScrapedJob,
  resume: Resume,
): Promise<AIJobMatch> {
  ensureBridgeConfigured();

  console.log(`Analyzing match for "${job.title}" with resume "${resume.name}"`);

  try {
    const jobMatch = await analyzeResumeAgainstJobWithClaude(job, resume);
    console.log(`Match score: ${jobMatch.score}% (${jobMatch.category})`);
    return jobMatch;
  } catch (error: any) {
    console.error('Error analyzing job match:', error);
    throw new Error(`Failed to analyze match: ${error.message}`);
  }
}

/**
 * Analyze a job against all resumes and return the strongest result.
 */
export async function findBestResumeMatch(
  job: ScrapedJob,
  resumes: Resume[],
): Promise<AIJobMatch> {
  if (resumes.length === 0) {
    throw new Error('No resumes available for matching');
  }

  console.log(`Finding best resume match for "${job.title}"...`);

  const matches: AIJobMatch[] = [];

  for (const resume of resumes) {
    try {
      const match = await analyzeJobAgainstResume(job, resume);
      matches.push(match);

      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (error) {
      console.error(`Error analyzing with resume "${resume.name}":`, error);
    }
  }

  if (matches.length === 0) {
    throw new Error('Failed to analyze job with any resume');
  }

  matches.sort((left, right) => right.score - left.score);
  const bestMatch = matches[0];

  console.log(
    `Best match: Resume #${bestMatch.recommendedResumeId || 'unknown'} (${bestMatch.score}%)`,
  );
  return bestMatch;
}

/**
 * Batch analyze multiple jobs and keep already-scored jobs intact.
 */
export async function analyzeAllJobs(
  jobs: ScrapedJob[],
  resumes: Resume[],
  onProgress?: (current: number, total: number) => void,
): Promise<ScrapedJob[]> {
  console.log(`Starting AI job matching for ${jobs.length} jobs...`);

  const analyzedJobs: ScrapedJob[] = [];

  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];

    try {
      if (job.aiMatch) {
        analyzedJobs.push(job);
        onProgress?.(index + 1, jobs.length);
        continue;
      }

      console.log(`[${index + 1}/${jobs.length}] Analyzing: ${job.title}`);
      const match = await findBestResumeMatch(job, resumes);

      analyzedJobs.push({
        ...job,
        aiMatch: match,
      });

      onProgress?.(index + 1, jobs.length);

      if (index < jobs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
    } catch (error: any) {
      console.error(`Error analyzing job "${job.title}":`, error);
      analyzedJobs.push(job);
      onProgress?.(index + 1, jobs.length);
    }
  }

  console.log(`Finished analyzing ${analyzedJobs.length} jobs`);
  return analyzedJobs;
}
