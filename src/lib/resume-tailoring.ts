import {
  isClaudeBridgeConfigured,
  tailorResumeForJobWithClaude,
  type TailoredResumeDraft,
} from './claude-bridge';
import type { Resume, ScrapedJob } from './types';

function ensureBridgeConfigured() {
  if (!isClaudeBridgeConfigured()) {
    throw new Error('Claude bridge is not configured');
  }
}

export async function generateResumeTailoring(
  job: ScrapedJob,
  resume: Resume,
): Promise<TailoredResumeDraft> {
  ensureBridgeConfigured();

  console.log(`Generating tailored resume guidance for "${job.title}" with "${resume.name}"`);

  try {
    return await tailorResumeForJobWithClaude(job, resume);
  } catch (error: any) {
    console.error('Error generating tailored resume guidance:', error);
    throw new Error(`Failed to tailor resume: ${error.message}`);
  }
}
