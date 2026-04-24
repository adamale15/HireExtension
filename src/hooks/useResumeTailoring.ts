import { useEffect, useState } from 'react';
import { generateResumeTailoring } from '../lib/resume-tailoring';
import { getFromStorage, setInStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/types';
import type { Resume, ResumeChange, ScrapedJob, TailoredResume } from '../lib/types';

function buildTailoredResumeId(userId: string, resumeId: string, jobId: string) {
  return `${userId}::${resumeId}::${jobId}`;
}

function toDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function hydrateTailoredResume(value: any): TailoredResume {
  return {
    ...value,
    strengthsToKeep: Array.isArray(value?.strengthsToKeep) ? value.strengthsToKeep : [],
    priorityGaps: Array.isArray(value?.priorityGaps) ? value.priorityGaps : [],
    changes: Array.isArray(value?.changes)
      ? value.changes.map((change: any, index: number) => ({
          id:
            typeof change?.id === 'string' && change.id.trim()
              ? change.id
              : `change-${index + 1}`,
          section: typeof change?.section === 'string' ? change.section : 'general',
          title: typeof change?.title === 'string' ? change.title : `Suggestion ${index + 1}`,
          original: typeof change?.original === 'string' ? change.original : '',
          tailored: typeof change?.tailored === 'string' ? change.tailored : '',
          reason: typeof change?.reason === 'string' ? change.reason : '',
          impact: typeof change?.impact === 'string' ? change.impact : '',
          accepted: Boolean(change?.accepted),
        }))
      : [],
    createdAt: toDate(value?.createdAt),
    updatedAt: toDate(value?.updatedAt),
  } as TailoredResume;
}

export function useResumeTailoring(userId: string | undefined) {
  const [tailoredResumes, setTailoredResumes] = useState<TailoredResume[]>([]);
  const [tailoring, setTailoring] = useState(false);
  const [activeTailoringKey, setActiveTailoringKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadTailoredResumes();
  }, [userId]);

  const loadTailoredResumes = async () => {
    if (!userId) {
      setTailoredResumes([]);
      return;
    }

    const stored = await getFromStorage<TailoredResume[]>(STORAGE_KEYS.TAILORED_RESUMES);
    const hydrated = Array.isArray(stored) ? stored.map(hydrateTailoredResume) : [];
    setTailoredResumes(hydrated.filter((resume) => resume.userId === userId));
  };

  const persistTailoredResumes = async (nextUserResumes: TailoredResume[]) => {
    const stored = await getFromStorage<TailoredResume[]>(STORAGE_KEYS.TAILORED_RESUMES);
    const hydrated = Array.isArray(stored) ? stored.map(hydrateTailoredResume) : [];
    const otherUsersResumes = hydrated.filter((resume) => resume.userId !== userId);

    await setInStorage(STORAGE_KEYS.TAILORED_RESUMES, [...otherUsersResumes, ...nextUserResumes]);
    setTailoredResumes(nextUserResumes);
  };

  const getTailoredResume = (jobId: string, resumeId: string) =>
    tailoredResumes.find(
      (tailoredResume) =>
        tailoredResume.jobId === jobId && tailoredResume.originalResumeId === resumeId,
    ) || null;

  const generateTailoring = async (job: ScrapedJob, resume: Resume): Promise<TailoredResume> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const tailoringKey = `${job.id}:${resume.id}`;
    const existing = getTailoredResume(job.id, resume.id);

    try {
      setTailoring(true);
      setActiveTailoringKey(tailoringKey);
      setError(null);

      const draft = await generateResumeTailoring(job, resume);
      const now = new Date();
      const nextTailoredResume: TailoredResume = {
        id: existing?.id || buildTailoredResumeId(userId, resume.id, job.id),
        originalResumeId: resume.id,
        jobId: job.id,
        userId,
        overview: draft.overview,
        strengthsToKeep: draft.strengthsToKeep,
        priorityGaps: draft.priorityGaps,
        changes: draft.changes.map((change, index) => ({
          ...change,
          id: change.id || `change-${index + 1}`,
          accepted: existing?.changes.find((current) => current.id === change.id)?.accepted || false,
        })),
        tailoredPdfUrl: null,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      const nextTailoredResumes = tailoredResumes.filter(
        (tailoredResume) => tailoredResume.id !== nextTailoredResume.id,
      );
      nextTailoredResumes.unshift(nextTailoredResume);
      await persistTailoredResumes(nextTailoredResumes);
      return nextTailoredResume;
    } catch (err: any) {
      console.error('Error generating tailoring:', err);
      setError(err.message || 'Failed to tailor resume');
      throw err;
    } finally {
      setTailoring(false);
      setActiveTailoringKey(null);
    }
  };

  const updateTailoringChanges = async (
    tailoredResumeId: string,
    updater: (changes: ResumeChange[]) => ResumeChange[],
  ) => {
    const nextTailoredResumes = tailoredResumes.map((tailoredResume) =>
      tailoredResume.id === tailoredResumeId
        ? {
            ...tailoredResume,
            changes: updater(tailoredResume.changes),
            updatedAt: new Date(),
          }
        : tailoredResume,
    );

    await persistTailoredResumes(nextTailoredResumes);
  };

  const toggleAccepted = async (tailoredResumeId: string, changeId: string) => {
    await updateTailoringChanges(tailoredResumeId, (changes) =>
      changes.map((change) =>
        change.id === changeId ? { ...change, accepted: !change.accepted } : change,
      ),
    );
  };

  return {
    tailoredResumes,
    tailoring,
    activeTailoringKey,
    error,
    getTailoredResume,
    generateTailoring,
    toggleAccepted,
    refreshTailoring: loadTailoredResumes,
  };
}
