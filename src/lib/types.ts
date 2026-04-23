export type WorkModel = 'remote' | 'onsite' | 'hybrid';
export type MatchCategory = 'safe' | 'moderate' | 'dont-apply';

// User related types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  updatedAt: Date;
}

// Resume related types
export interface ParsedProfile {
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  certifications: string[];
  summary: string;
}

export interface Skill {
  name: string;
  category: 'technical' | 'soft';
  yearsOfExperience?: number;
}

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number;
}

export interface Resume {
  id: string;
  userId: string;
  name: string;
  fileName: string;
  pdfUrl: string;
  parsedProfile: ParsedProfile;
  uploadedAt: Date;
  updatedAt: Date;
}

export interface AIJobMatch {
  score: number;
  category: MatchCategory;
  recommendedResumeId: string | null;
  matchingSkills: string[];
  missingSkills: string[];
  experienceMatch: {
    required: string;
    yourLevel: string;
    isMatch: boolean;
  };
  insights: string[];
  analyzedAt: Date;
}

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  workModel: WorkModel | null;
  salary: {
    min: number;
    max: number;
    currency: string;
  } | null;
  url: string;
  applyUrl?: string;
  h1bSponsorship: boolean | null;
  applicantCount: string;
  postedAt: string;
  scrapedAt: Date;
  matchScore?: number;
  rankDesc?: string;
  jobSummary?: string;
  aiMatch?: AIJobMatch;
}

export interface StoredJobMatch {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  score: number;
  category: MatchCategory;
  reasons: string[];
  missingSkills: string[];
  recommendedResumeId: string | null;
  matchedAt: Date;
}

export interface TailoredResume {
  id: string;
  originalResumeId: string;
  jobId: string;
  userId: string;
  changes: ResumeChange[];
  tailoredPdfUrl: string | null;
  createdAt: Date;
}

export interface ResumeChange {
  section: string;
  original: string;
  tailored: string;
  accepted: boolean;
}

// Message types for extension communication
export type MessageType =
  | 'SCRAPE_JOBS'
  | 'MANUAL_SCRAPE'
  | 'JOBS_SCRAPED'
  | 'JOBS_UPDATED'
  | 'ANALYZE_JOBS'
  | 'JOB_ANALYZED'
  | 'TAILOR_RESUME'
  | 'RESUME_TAILORED'
  | 'FIND_HIRING_MANAGER'
  | 'AUTH_STATE_CHANGED';

export interface ExtensionMessage<T = unknown> {
  type: MessageType;
  payload: T;
}

// Storage keys
export const STORAGE_KEYS = {
  USER_SESSION: 'user_session',
  SCRAPED_JOBS: 'scraped_jobs',
  JOB_MATCHES: 'job_matches',
  GEMINI_API_KEY: 'gemini_api_key',
  DEFAULT_RESUME_ID: 'default_resume_id',
  LAST_SCRAPE_TIME: 'last_scrape_time',
} as const;
