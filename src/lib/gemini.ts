import type { ParsedProfile } from './types';
import {
  isClaudeBridgeConfigured,
  parseResumeWithClaude,
  testClaudeBridgeConnection,
} from './claude-bridge';

// Backward-compatible wrapper while the app migrates away from Gemini naming.
export function initializeGemini(_apiKey: string) {
  console.warn('initializeGemini is deprecated. HireExtension now uses the local Claude bridge.');
}

export function isGeminiInitialized(): boolean {
  return isClaudeBridgeConfigured();
}

export async function parseResumePDF(file: File): Promise<ParsedProfile> {
  if (!isClaudeBridgeConfigured()) {
    throw new Error('Claude bridge is not configured. Add the bridge settings in .env.local.');
  }

  try {
    return await parseResumeWithClaude(file);
  } catch (error: any) {
    console.error('Error parsing resume with Claude bridge:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

export async function testGeminiConnection(_apiKey: string): Promise<boolean> {
  return testClaudeBridgeConnection();
}
