import type {
  AIJobMatch,
  MatchCategory,
  ParsedProfile,
  Resume,
  ResumeChange,
  ScrapedJob,
} from './types';

type ClaudeBridgeImportMeta = ImportMeta & {
  env?: {
    VITE_CLAUDE_BRIDGE_URL?: string;
    VITE_CLAUDE_BRIDGE_TOKEN?: string;
    VITE_CLAUDE_BRIDGE_MODEL?: string;
  };
};

interface ResumeAnalyzeResponse {
  id: string;
  object: string;
  model: string;
  analysis: string;
  extraction?: {
    items?: Array<{
      filename?: string;
      mediaType?: string;
      kind?: string;
      extractedText?: string;
      warnings?: string[];
      metadata?: {
        page_count?: number;
      };
    }>;
  };
  bridge?: {
    session_id?: string;
    claude_session_id?: string;
  };
}

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:11435';
const DEFAULT_BRIDGE_TOKEN = 'replace-me';
const DEFAULT_BRIDGE_MODEL = 'claude-sonnet';

function getBridgeConfig() {
  const env = (import.meta as ClaudeBridgeImportMeta).env;

  return {
    baseUrl: (env?.VITE_CLAUDE_BRIDGE_URL || DEFAULT_BRIDGE_URL).replace(/\/$/, ''),
    token: env?.VITE_CLAUDE_BRIDGE_TOKEN || DEFAULT_BRIDGE_TOKEN,
    model: env?.VITE_CLAUDE_BRIDGE_MODEL || DEFAULT_BRIDGE_MODEL,
  };
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

function parseJsonAnalysis<T>(analysis: string): T {
  return JSON.parse(stripMarkdownFences(analysis));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeProfile(payload: any): ParsedProfile {
  return {
    skills: Array.isArray(payload.skills)
      ? payload.skills
          .filter((skill: any) => skill && typeof skill.name === 'string')
          .map((skill: any) => ({
            name: skill.name,
            category: skill.category === 'soft' ? 'soft' : 'technical',
            yearsOfExperience:
              typeof skill.yearsOfExperience === 'number' ? skill.yearsOfExperience : 0,
          }))
      : [],
    experience: Array.isArray(payload.experience)
      ? payload.experience
          .filter((experience: any) => experience && typeof experience.title === 'string')
          .map((experience: any) => ({
            title: experience.title,
            company: typeof experience.company === 'string' ? experience.company : 'Unknown',
            startDate:
              typeof experience.startDate === 'string' ? experience.startDate : 'Unknown',
            endDate: typeof experience.endDate === 'string' ? experience.endDate : 'Present',
            bullets: normalizeStringArray(experience.bullets),
          }))
      : [],
    education: Array.isArray(payload.education)
      ? payload.education
          .filter((education: any) => education && typeof education.degree === 'string')
          .map((education: any) => ({
            degree: education.degree,
            field: typeof education.field === 'string' ? education.field : 'Unknown',
            institution:
              typeof education.institution === 'string' ? education.institution : 'Unknown',
            year: typeof education.year === 'number' ? education.year : 0,
          }))
      : [],
    certifications: normalizeStringArray(payload.certifications),
    summary: typeof payload.summary === 'string' ? payload.summary : '',
  };
}

function normalizeCategory(value: unknown): MatchCategory {
  return value === 'safe' || value === 'moderate' || value === 'dont-apply'
    ? value
    : 'moderate';
}

function normalizeMatch(payload: any, resumeId: string): AIJobMatch {
  return {
    score: Math.min(100, Math.max(0, Number(payload.score) || 0)),
    category: normalizeCategory(payload.category),
    recommendedResumeId: resumeId,
    matchingSkills: normalizeStringArray(payload.matchingSkills),
    missingSkills: normalizeStringArray(payload.missingSkills),
    experienceMatch: {
      required:
        payload.experienceMatch && typeof payload.experienceMatch.required === 'string'
          ? payload.experienceMatch.required
          : 'unknown',
      yourLevel:
        payload.experienceMatch && typeof payload.experienceMatch.yourLevel === 'string'
          ? payload.experienceMatch.yourLevel
          : 'unknown',
      isMatch: Boolean(payload.experienceMatch?.isMatch),
    },
    insights: normalizeStringArray(payload.insights),
    analyzedAt: new Date(),
  };
}

function normalizeResumeChanges(value: unknown): ResumeChange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((change: any, index) => {
      if (!change || typeof change !== 'object') {
        return null;
      }

      return {
        id:
          typeof change.id === 'string' && change.id.trim()
            ? change.id
            : `change-${index + 1}`,
        section: typeof change.section === 'string' ? change.section : 'general',
        title: typeof change.title === 'string' ? change.title : `Suggestion ${index + 1}`,
        original: typeof change.original === 'string' ? change.original : '',
        tailored: typeof change.tailored === 'string' ? change.tailored : '',
        reason: typeof change.reason === 'string' ? change.reason : '',
        impact: typeof change.impact === 'string' ? change.impact : '',
        accepted: false,
      };
    })
    .filter((change): change is ResumeChange => Boolean(change));
}

export interface TailoredResumeDraft {
  overview: string;
  strengthsToKeep: string[];
  priorityGaps: string[];
  changes: ResumeChange[];
}

function normalizeTailoredResume(payload: any): TailoredResumeDraft {
  return {
    overview: typeof payload.overview === 'string' ? payload.overview : '',
    strengthsToKeep: normalizeStringArray(payload.strengthsToKeep),
    priorityGaps: normalizeStringArray(payload.priorityGaps),
    changes: normalizeResumeChanges(payload.changes),
  };
}

function decodeResumePdf(resume: Resume): File {
  const [header, base64] = resume.pdfUrl.split(',', 2);

  if (!base64) {
    throw new Error(`Resume "${resume.name}" does not contain a valid PDF payload`);
  }

  const mimeTypeMatch = header.match(/^data:(.*?);base64$/);
  const mimeType = mimeTypeMatch?.[1] || 'application/pdf';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], resume.fileName || `${resume.name}.pdf`, { type: mimeType });
}

function buildResumeParsingInstructions() {
  return `You are a resume parser. Extract structured resume information and return ONLY valid JSON.

Use this exact shape:
{
  "skills": [
    {
      "name": "skill name",
      "category": "technical" or "soft",
      "yearsOfExperience": number
    }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "degree type",
      "field": "field of study",
      "institution": "school name",
      "year": graduation year
    }
  ],
  "certifications": ["certification 1"],
  "summary": "A concise 2-3 sentence professional summary"
}

Be thorough, avoid invented information, and return JSON only with no markdown fences.`;
}

function buildJobDescription(job: ScrapedJob) {
  return [
    `Job Title: ${job.title}`,
    `Company: ${job.company}`,
    `Location: ${job.location}`,
    `Work Model: ${job.workModel || 'Not specified'}`,
    job.salary ? `Salary: $${job.salary.min}-$${job.salary.max}` : 'Salary: Not specified',
    `Posted: ${job.postedAt}`,
    `Applicants: ${job.applicantCount}`,
    job.jobSummary ? `Description: ${job.jobSummary}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildJobMatchInstructions(config: ReturnType<typeof getBridgeConfig>) {
  return `You are an expert recruiter and resume reviewer. Compare the uploaded resume to the provided job description and return ONLY valid JSON.

Use this exact shape:
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
    "Strength or fit summary",
    "Most relevant experience or technical overlap",
    "Main gap or risk",
    "Concrete improvement suggestion before applying"
  ]
}

Scoring:
- 80-100: safe
- 60-79: moderate
- 0-59: dont-apply

Focus on actual fit, gaps, and concrete improvements. The requested model is ${config.model}. Return JSON only.`;
}

function buildResumeTailoringInstructions(config: ReturnType<typeof getBridgeConfig>) {
  return `You are an expert resume writer. Rewrite the uploaded resume for the supplied job description and return ONLY valid JSON.

Use this exact shape:
{
  "overview": "One short paragraph describing the strongest angle for this application.",
  "strengthsToKeep": ["existing strength worth preserving"],
  "priorityGaps": ["important gap to address carefully"],
  "changes": [
    {
      "id": "summary-1",
      "section": "summary|experience|skills|education",
      "title": "Short label for the change",
      "original": "Original resume text or a short excerpt",
      "tailored": "Improved version tailored to the job",
      "reason": "Why this change improves alignment",
      "impact": "Expected outcome from making the change"
    }
  ]
}

Rules:
- Return 4 to 8 high-value changes.
- Keep changes truthful to the uploaded resume. Do not invent employers, dates, tools, degrees, or achievements.
- Prefer stronger framing, reordered emphasis, sharper bullets, and keyword alignment over fabrication.
- Use short, concrete text for each field.
- The requested model is ${config.model}.
- Return JSON only with no markdown fences.`;
}

async function postResumeAnalysis(
  file: File,
  jobDescription: string,
  instructions: string,
): Promise<ResumeAnalyzeResponse> {
  const config = getBridgeConfig();
  const formData = new FormData();

  formData.append('resume', file);
  formData.append('job_description', jobDescription);
  formData.append('instructions', instructions);

  const response = await fetch(`${config.baseUrl}/v1/resume/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude bridge request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as ResumeAnalyzeResponse;

  if (typeof payload.analysis !== 'string' || !payload.analysis.trim()) {
    throw new Error('Claude bridge did not return an analysis payload');
  }

  return payload;
}

export function isClaudeBridgeConfigured(): boolean {
  const config = getBridgeConfig();
  return Boolean(config.baseUrl);
}

export async function parseResumeWithClaude(file: File): Promise<ParsedProfile> {
  const response = await postResumeAnalysis(file, '', buildResumeParsingInstructions());
  const parsed = parseJsonAnalysis<any>(response.analysis);
  return normalizeProfile(parsed);
}

export async function analyzeResumeAgainstJobWithClaude(
  job: ScrapedJob,
  resume: Resume,
): Promise<AIJobMatch> {
  const config = getBridgeConfig();
  const response = await postResumeAnalysis(
    decodeResumePdf(resume),
    buildJobDescription(job),
    buildJobMatchInstructions(config),
  );
  const parsed = parseJsonAnalysis<any>(response.analysis);
  return normalizeMatch(parsed, resume.id);
}

export async function tailorResumeForJobWithClaude(
  job: ScrapedJob,
  resume: Resume,
): Promise<TailoredResumeDraft> {
  const config = getBridgeConfig();
  const response = await postResumeAnalysis(
    decodeResumePdf(resume),
    buildJobDescription(job),
    buildResumeTailoringInstructions(config),
  );
  const parsed = parseJsonAnalysis<any>(response.analysis);
  return normalizeTailoredResume(parsed);
}

export async function testClaudeBridgeConnection(): Promise<boolean> {
  const config = getBridgeConfig();

  try {
    const response = await fetch(`${config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: 'Reply with OK only.',
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Claude bridge connection test failed:', error);
    return false;
  }
}
