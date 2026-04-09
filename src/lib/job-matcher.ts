import Groq from 'groq-sdk';
import type { ScrapedJob, JobMatch, Resume } from './types';

let groq: Groq | null = null;

// Initialize Groq
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
if (apiKey) {
  groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  console.log('Groq AI initialized');
}

/**
 * Analyze a job against a resume using Gemini AI
 */
export async function analyzeJobMatch(
  job: ScrapedJob,
  resume: Resume
): Promise<JobMatch> {
  if (!groq) {
    throw new Error('Groq API not initialized');
  }

  console.log(`🤖 Analyzing match for "${job.title}" with resume "${resume.name}"`);

  try {
    const prompt = `
You are an expert career advisor and recruiter. Analyze how well this candidate's resume matches the job posting.

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Work Model: ${job.workModel || 'Not specified'}
${job.jobSummary ? `Description: ${job.jobSummary}` : ''}
Salary: ${job.salary ? `$${job.salary.min}-$${job.salary.max}` : 'Not specified'}

CANDIDATE RESUME:
Name: ${resume.name}
Summary: ${resume.parsedProfile.summary}

Skills (${resume.parsedProfile.skills.length}):
${resume.parsedProfile.skills.map(s => `- ${s.name} (${s.category}, ${s.yearsOfExperience}+ years)`).join('\n')}

Experience (${resume.parsedProfile.experience.length} positions):
${resume.parsedProfile.experience.map(e => `
- ${e.title} at ${e.company} (${e.startDate} to ${e.endDate})
  ${e.bullets.slice(0, 2).join('. ')}
`).join('\n')}

Education:
${resume.parsedProfile.education.map(e => `- ${e.degree} in ${e.field} from ${e.institution} (${e.year})`).join('\n')}

Certifications: ${resume.parsedProfile.certifications.join(', ') || 'None'}

ANALYSIS TASK:
Provide a detailed match analysis in JSON format ONLY (no markdown, no code blocks):

{
  "score": <number 0-100>,
  "category": "<safe|moderate|dont-apply>",
  "matchingSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "experienceMatch": {
    "required": "<entry|mid|senior>",
    "yourLevel": "<entry|mid|senior>",
    "isMatch": <boolean>
  },
  "insights": [
    "Insight 1 about why this is a good/bad match",
    "Insight 2 about strengths",
    "Insight 3 about gaps or concerns",
    "Insight 4 about application tips"
  ]
}

SCORING GUIDELINES:
- 80-100: Safe Apply (strong match, highly qualified)
- 60-79: Moderate Apply (good match, worth applying)
- 0-59: Don't Apply (poor match, not worth time)

Be honest and realistic. Consider:
1. Technical skills match (most important)
2. Experience level alignment
3. Domain/industry experience
4. Location and work model preferences
5. Salary expectations vs current compensation

Return ONLY the JSON object.
`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast and high quality
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      top_p: 0.95,
    });

    const text = completion.choices[0]?.message?.content?.trim() || '';

    if (!text) {
      throw new Error('No response from Groq API');
    }

    // Clean up response
    let jsonText = text;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(jsonText);

    // Validate and return
    const jobMatch: JobMatch = {
      score: Math.min(100, Math.max(0, analysis.score)),
      category: analysis.category,
      recommendedResumeId: resume.id,
      matchingSkills: analysis.matchingSkills || [],
      missingSkills: analysis.missingSkills || [],
      experienceMatch: analysis.experienceMatch || {
        required: 'unknown',
        yourLevel: 'unknown',
        isMatch: false,
      },
      insights: analysis.insights || [],
      analyzedAt: new Date(),
    };

    console.log(`  ✓ Match score: ${jobMatch.score}% (${jobMatch.category})`);
    return jobMatch;
  } catch (error: any) {
    console.error('Error analyzing job match:', error);
    throw new Error(`Failed to analyze match: ${error.message}`);
  }
}

/**
 * Analyze a job against ALL user resumes and pick the best match
 */
export async function findBestResumeMatch(
  job: ScrapedJob,
  resumes: Resume[]
): Promise<JobMatch> {
  if (resumes.length === 0) {
    throw new Error('No resumes available for matching');
  }

  console.log(`🎯 Finding best resume match for "${job.title}"...`);

  // Analyze job against each resume
  const matches: JobMatch[] = [];

  for (const resume of resumes) {
    try {
      const match = await analyzeJobMatch(job, resume);
      matches.push(match);

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error analyzing with resume "${resume.name}":`, error);
    }
  }

  if (matches.length === 0) {
    throw new Error('Failed to analyze job with any resume');
  }

  // Return the best match (highest score)
  matches.sort((a, b) => b.score - a.score);
  const bestMatch = matches[0];

  console.log(`  ✓ Best match: Resume #${bestMatch.recommendedResumeId} (${bestMatch.score}%)`);
  return bestMatch;
}

/**
 * Batch analyze multiple jobs (with rate limiting)
 */
export async function analyzeAllJobs(
  jobs: ScrapedJob[],
  resumes: Resume[],
  onProgress?: (current: number, total: number) => void
): Promise<ScrapedJob[]> {
  console.log(`\n🚀 Starting AI job matching for ${jobs.length} jobs...`);

  const analyzedJobs: ScrapedJob[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    try {
      // Skip if already analyzed
      if (job.aiMatch) {
        console.log(`⏭️  Skipping "${job.title}" (already analyzed)`);
        analyzedJobs.push(job);
        continue;
      }

      console.log(`\n[${i + 1}/${jobs.length}] Analyzing: ${job.title}`);

      const match = await findBestResumeMatch(job, resumes);

      analyzedJobs.push({
        ...job,
        aiMatch: match,
      });

      // Progress callback
      if (onProgress) {
        onProgress(i + 1, jobs.length);
      }

      // Rate limiting: 1 request per 2 seconds (30 per minute)
      if (i < jobs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error: any) {
      console.error(`Error analyzing job "${job.title}":`, error);
      // Keep job without AI match
      analyzedJobs.push(job);
    }
  }

  console.log(`\n✅ Finished analyzing ${analyzedJobs.length} jobs`);
  return analyzedJobs;
}
