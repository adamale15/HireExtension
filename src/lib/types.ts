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

// Job related types
export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  workModel: 'remote' | 'onsite' | 'hybrid' | null;
  salary: {
    min: number;
    max: number;
    currency: string;
  } | null;
  url: string;
  h1bSponsorship: boolean | null;
  applicantCount: string;
  postedAt: string;
  scrapedAt: Date;
}

export interface JobMatch {
  id: string;
  jobId: string;
  userId: string;
  resumeId: string;
  score: number;
  category: 'safe_apply' | 'moderate_apply' | 'dont_apply';
  reasons: string[];
  missingSkills: string[];
  recommendedResumeId: string;
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
  | 'JOBS_SCRAPED'
  | 'ANALYZE_JOBS'
  | 'JOB_ANALYZED'
  | 'TAILOR_RESUME'
  | 'RESUME_TAILORED'
  | 'FIND_HIRING_MANAGER'
  | 'AUTH_STATE_CHANGED';

export interface ExtensionMessage<T = any> {
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
} as const;
