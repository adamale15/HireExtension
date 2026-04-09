import { useState, useEffect } from 'react';
import { 
  getResumes as fetchResumes,
  uploadResume as uploadResumeToFirebase,
  updateResumeName as updateResumeNameInFirebase,
  deleteResume as deleteResumeFromFirebase
} from '../lib/firebase';
import { getDefaultResumeId, saveDefaultResumeId } from '../lib/storage';
import type { Resume } from '../lib/types';

export function useResumes(userId: string | undefined) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [defaultResumeId, setDefaultResumeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadResumes();
      loadDefaultResumeId();
    }
  }, [userId]);

  const loadResumes = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedResumes = await fetchResumes(userId);
      setResumes(fetchedResumes);
    } catch (err: any) {
      console.error('Error loading resumes:', err);
      setError(err.message || 'Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultResumeId = async () => {
    const id = await getDefaultResumeId();
    setDefaultResumeId(id);
  };

  const uploadResume = async (
    file: File,
    name: string,
    parsedProfile: Resume['parsedProfile']
  ): Promise<Resume> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);
      const resume = await uploadResumeToFirebase(userId, file, name, parsedProfile);
      setResumes(prev => [...prev, resume]);
      
      // If this is the first resume, set it as default
      if (resumes.length === 0) {
        await setDefaultResume(resume.id);
      }
      
      return resume;
    } catch (err: any) {
      console.error('Error uploading resume:', err);
      setError(err.message || 'Failed to upload resume');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateResumeName = async (resumeId: string, name: string) => {
    try {
      setError(null);
      await updateResumeNameInFirebase(resumeId, name);
      setResumes(prev =>
        prev.map(r => (r.id === resumeId ? { ...r, name } : r))
      );
    } catch (err: any) {
      console.error('Error updating resume name:', err);
      setError(err.message || 'Failed to update resume name');
      throw err;
    }
  };

  const deleteResume = async (resumeId: string) => {
    if (!userId) throw new Error('User not authenticated');

    try {
      setError(null);
      await deleteResumeFromFirebase(resumeId, userId);
      setResumes(prev => prev.filter(r => r.id !== resumeId));
      
      // If deleted resume was default, clear default
      if (defaultResumeId === resumeId) {
        setDefaultResumeId(null);
        await saveDefaultResumeId('');
      }
    } catch (err: any) {
      console.error('Error deleting resume:', err);
      setError(err.message || 'Failed to delete resume');
      throw err;
    }
  };

  const setDefaultResume = async (resumeId: string) => {
    try {
      setError(null);
      await saveDefaultResumeId(resumeId);
      setDefaultResumeId(resumeId);
    } catch (err: any) {
      console.error('Error setting default resume:', err);
      setError(err.message || 'Failed to set default resume');
      throw err;
    }
  };

  return {
    resumes,
    defaultResumeId,
    loading,
    error,
    uploadResume,
    updateResumeName,
    deleteResume,
    setDefaultResume,
    refreshResumes: loadResumes
  };
}
