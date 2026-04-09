import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ParsedProfile } from './types';

let genAI: GoogleGenerativeAI | null = null;

// Initialize Gemini with API key from environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('Gemini AI initialized with environment API key');
}

export function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('Gemini AI initialized with provided API key');
}

export function isGeminiInitialized(): boolean {
  return genAI !== null;
}

export async function parseResumePDF(file: File): Promise<ParsedProfile> {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Please add your API key in Settings.');
  }

  try {
    // Convert PDF to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are a resume parser. Analyze this resume PDF and extract structured information.

Return a JSON object with the following structure:
{
  "skills": [
    {
      "name": "skill name",
      "category": "technical" or "soft",
      "yearsOfExperience": number (estimate based on context, can be 0)
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
      "year": graduation year (number)
    }
  ],
  "certifications": ["certification 1", "certification 2"],
  "summary": "A 2-3 sentence professional summary"
}

Be thorough but concise. Extract all relevant information from the resume.
Return ONLY valid JSON, no additional text.
`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Clean up the response to get just the JSON
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(jsonText);
    
    // Validate and return
    return {
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      certifications: parsed.certifications || [],
      summary: parsed.summary || '',
    };
  } catch (error: any) {
    console.error('Error parsing resume with Gemini:', error);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
}

export async function testGeminiConnection(apiKey: string): Promise<boolean> {
  try {
    const testAI = new GoogleGenerativeAI(apiKey);
    const model = testAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say "API key is valid" in 3 words');
    const response = await result.response;
    return response.text().length > 0;
  } catch (error) {
    console.error('Gemini API test failed:', error);
    return false;
  }
}
