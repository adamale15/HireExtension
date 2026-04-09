import { STORAGE_KEYS } from './types';

export async function getFromStorage<T>(key: string): Promise<T | null> {
  const result = await browser.storage.local.get(key);
  return result[key] || null;
}

export async function setInStorage<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function removeFromStorage(key: string): Promise<void> {
  await browser.storage.local.remove(key);
}

export async function clearStorage(): Promise<void> {
  await browser.storage.local.clear();
}

// Session management
export async function saveUserSession(user: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}): Promise<void> {
  await setInStorage(STORAGE_KEYS.USER_SESSION, user);
}

export async function getUserSession() {
  return getFromStorage<{
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
  }>(STORAGE_KEYS.USER_SESSION);
}

export async function clearUserSession(): Promise<void> {
  await removeFromStorage(STORAGE_KEYS.USER_SESSION);
}

// Gemini API key management
export async function saveGeminiApiKey(apiKey: string): Promise<void> {
  await setInStorage(STORAGE_KEYS.GEMINI_API_KEY, apiKey);
}

export async function getGeminiApiKey(): Promise<string | null> {
  return getFromStorage<string>(STORAGE_KEYS.GEMINI_API_KEY);
}

// Default resume management
export async function saveDefaultResumeId(resumeId: string): Promise<void> {
  await setInStorage(STORAGE_KEYS.DEFAULT_RESUME_ID, resumeId);
}

export async function getDefaultResumeId(): Promise<string | null> {
  return getFromStorage<string>(STORAGE_KEYS.DEFAULT_RESUME_ID);
}
