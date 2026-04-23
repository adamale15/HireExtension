import Groq from 'groq-sdk';
import type { AIJobMatch, Resume, ScrapedJob } from './types';

let groq: Groq | null = null;

type JobMatcherImportMeta = ImportMeta & {
  env?: {
    VITE_GROQ_API_KEY?: string;
  };
};

const apiKey = (import.meta as JobMatcherImportMeta).env?.VITE_GROQ_API_KEY;
if (apiKey) {
  groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  console.log('Groq AI initialized');
}

function ensureGroqClient(): Groq {
  if (!groq) {
    throw new Error('Groq API not initialized');
  }

  return groq;
}

function stripMarkdownFences(text: string) {
  if (text.startsWith('```json')) {
    return text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  if (text.startsWith('```')) {
    return text.replace(/```\n?/g, '');
  }

  return text;
}

function extractCompletionText(content: unknown): string {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .join('')
      .trim();
  }

  return '';
}

function normalizeMatch(analysis: any, resumeId: string): AIJobMatch {
  return {
    score: Math.min(100, Math.max(0, Number(analysis.score) || 0)),
    category:
      analysis.category === 'safe' ||
      analysis.category === 'moderate' ||
      analysis.category === 'dont-apply'
        ? analysis.category
        : 'moderate',
    recommendedResumeId: resumeId,
    matchingSkills: Array.isArray(analysis.matchingSkills) ? analysis.matchingSkills : [],
    missingSkills: Array.isArray(analysis.missingSkills) ? analysis.missingSkills : [],
    experienceMatch: {
      required: analysis.experienceMatch?.required || 'unknown',
      yourLevel: analysis.experienceMatch?.yourLevel || 'unknown',
      isMatch: Boolean(analysis.experienceMatch?.isMatch),
    },
    insights: Array.isArray(analysis.insights) ? analysis.insights : [],
    analyzedAt: new Date(),
  };
}

/**
 * Analyze a single job against a single resume.
 */
export async function analyzeJobAgainstResume(
  job: ScrapedJob,
  resume: Resume,
): Promise<AIJobMatch> {
  const client = ensureGroqClient();

  console.log(`Analyzing match for "${job.title}" with resume "${resume.name}"`);

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
${resume.parsedProfile.skills
  .map((skill) => `- ${skill.name} (${skill.category}, ${skill.yearsOfExperience || 0}+ years)`)
  .join('\n')}

Experience (${resume.parsedProfile.experience.length} positions):
${resume.parsedProfile.experience
  .map(
    (experience) => `
- ${experience.title} at ${experience.company} (${experience.startDate} to ${experience.endDate})
  ${experience.bullets.slice(0, 2).join('. ')}
`,
  )
  .join('\n')}

Education:
${resume.parsedProfile.education
  .map(
    (education) =>
      `- ${education.degree} in ${education.field} from ${education.institution} (${education.year})`,
  )
  .join('\n')}

Certifications: ${resume.parsedProfile.certifications.join(', ') || 'None'}

ANALYSIS TASK:
Provide a detailed match analysis in JSON format ONLY (no markdown, no code blocks):

{
  "score": <number 0-100>,
  "category": "<safe|moderate|dont-apply>",
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "experienceMatch": {
    "required": "<entry|mid|senior>",
    "yourLevel": "<entry|mid|senior>",
    "isMatch": <boolean>
  },
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3",
    "Insight 4"
  ]
}

SCORING GUIDELINES:
- 80-100: Safe Apply
- 60-79: Moderate Apply
- 0-59: Don't Apply

Be honest and realistic. Consider technical skills first, then experience level, domain fit, work model, and salary fit.
Return ONLY the JSON object.
`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
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

    const text = extractCompletionText(completion.choices[0]?.message?.content);

    if (!text) {
      throw new Error('No response from Groq API');
    }

    const analysis = JSON.parse(stripMarkdownFences(text));
    const jobMatch = normalizeMatch(analysis, resume.id);

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

      await new Promise((resolve) => setTimeout(resolve, 1000));
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
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
