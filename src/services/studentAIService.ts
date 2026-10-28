import {
  StudentSubject,
  SyllabusExtractionResult,
  QuestionItem,
  CrashStudyPlan,
  TestAttemptRecord,
  InterviewReport,
  EngineeringBranch,
  InterviewRoundType,
} from '../types';

interface ApiErrorResponse {
  error?: string;
}

// In-memory cache for repetitive calls (5-minute TTL)
const apiCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached(key: string, data: any) {
  // Evict old entries if cache grows large
  if (apiCache.size > 100) {
    const firstKey = apiCache.keys().next().value;
    if (firstKey) apiCache.delete(firstKey);
  }
  apiCache.set(key, { timestamp: Date.now(), data });
}

/**
 * Robust fetch with bounded retries on 503 temporary errors.
 * Fails fast on 4xx client errors or user aborts.
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 1): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.status === 503 && attempt < maxRetries && !options.signal?.aborted) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      return res;
    } catch (err: any) {
      if (options.signal?.aborted || err?.name === 'AbortError') {
        throw new Error('Request was cancelled by user.');
      }
      if (attempt < maxRetries) {
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed to complete request to ${url} after retries.`);
}

/**
 * MODULE 1: Syllabus Extraction & Multimodal Vision Parser
 */
export async function extractSyllabus(params: {
  text?: string;
  imageBase64?: string;
  fileBase64?: string;
  mimeType?: string;
  queryPrompt?: string;
  university?: string;
  boardOrUniversity?: string;
  branch?: string;
  courseOrClass?: string;
  educationLevel?: string;
  semester?: number | string;
  signal?: AbortSignal;
}): Promise<SyllabusExtractionResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Syllabus extraction requires an active network connection.');
  }

  // Check cache for text/prompt based queries
  const cacheKey = !params.imageBase64 && !params.fileBase64
    ? `syll:${params.educationLevel}:${params.boardOrUniversity || params.university}:${params.queryPrompt || params.text}`
    : null;

  if (cacheKey) {
    const cached = getCached<SyllabusExtractionResult>(cacheKey);
    if (cached) return cached;
  }

  let res: Response;
  try {
    res = await fetchWithRetry('/api/syllabus/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: params.signal,
    });
  } catch (err: any) {
    if (params.signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      throw new Error('Syllabus extraction was cancelled.');
    }
    throw new Error('Failed to connect to LifePilot server for syllabus extraction.');
  }

  const data = (await res.json().catch(() => null)) as (SyllabusExtractionResult & ApiErrorResponse) | null;
  if (!res.ok) {
    throw new Error(data?.error || `Syllabus extraction failed (HTTP ${res.status}).`);
  }

  if (!data || !Array.isArray(data.units)) {
    throw new Error('Server returned an invalid syllabus structure.');
  }

  if (cacheKey) {
    setCached(cacheKey, data);
  }

  return data;
}

/**
 * MODULE 2: Study from Your Syllabus & Practice Question Generator
 * Supports photo/PDF topics, MCQs, short notes, long answers, marks breakdown.
 * Practice questions are strictly tagged as unverified AI practice questions.
 */
export async function generatePracticeQuestions(params: {
  subjectName: string;
  unitNumber?: number;
  topic?: string;
  topics?: string[];
  count?: number;
  educationLevel?: string;
  boardOrUniversity?: string;
  courseOrClass?: string;
  questionType?: 'all' | 'important' | 'revision' | 'mcq' | 'short_note' | 'long_answer' | 'programming' | 'numerical' | 'theory';
  expectedMarks?: 2 | 5 | 8 | 10 | 16;
  language?: 'en' | 'hi' | 'hinglish';
  signal?: AbortSignal;
}): Promise<QuestionItem[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Generating practice questions requires an active network connection.');
  }

  const cacheKey = `qgen:${params.subjectName}:${params.topic || params.topics?.join(',')}:${params.questionType}:${params.expectedMarks}:${params.language}`;
  const cached = getCached<QuestionItem[]>(cacheKey);
  if (cached) return cached;

  let res: Response;
  try {
    res = await fetchWithRetry('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: params.signal,
    });
  } catch (err: any) {
    if (params.signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      throw new Error('Question generation was cancelled.');
    }
    throw new Error('Failed to connect to LifePilot server for question generation.');
  }

  const data = (await res.json().catch(() => null)) as ({
    questions: QuestionItem[];
    isFallback?: boolean;
    providerStatus?: string;
    notice?: string;
  } & ApiErrorResponse) | null;
  if (!res.ok) {
    throw new Error(data?.error || `Question generation failed (HTTP ${res.status}).`);
  }

  if (!data || !Array.isArray(data.questions)) {
    throw new Error('Server returned an invalid questions response.');
  }

  const enrichedQuestions = data.questions.map((q) => ({
    ...q,
    isFallback: q.isFallback ?? data.isFallback,
    providerStatus: q.providerStatus ?? data.providerStatus,
    notice: q.notice ?? data.notice,
  }));

  setCached(cacheKey, enrichedQuestions);
  return enrichedQuestions;
}

/**
 * MODULE 3: Generate Day-Wise Crash Study Plan
 */
export async function generateCrashPlan(params: {
  subjectName: string;
  subjectId: string;
  examDate: string;
  dailyHours: number;
  completedTopics?: string[];
  units: {
    unitNumber: number;
    title: string;
    topics: string[];
  }[];
  signal?: AbortSignal;
}): Promise<CrashStudyPlan> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Generating a study plan requires an active network connection.');
  }

  let res: Response;
  try {
    res = await fetchWithRetry('/api/plan/crash-study', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: params.signal,
    });
  } catch (err: any) {
    if (params.signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      throw new Error('Crash study plan generation was cancelled.');
    }
    throw new Error('Failed to connect to LifePilot server for study planning.');
  }

  const data = (await res.json().catch(() => null)) as (CrashStudyPlan & ApiErrorResponse) | null;
  if (!res.ok) {
    throw new Error(data?.error || `Crash plan generation failed (HTTP ${res.status}).`);
  }

  if (!data || !Array.isArray(data.days)) {
    throw new Error('Server returned an incomplete study schedule.');
  }

  return data;
}

/**
 * MODULE 4: Multimodal Copy Checking & Voice / Typed Test Evaluation
 */
export async function evaluateTestAnswer(params: {
  mode: 'handwritten' | 'viva' | 'typed';
  subjectName: string;
  unit?: number;
  question: string;
  studentAnswer?: string;
  imageBase64?: string;
  mimeType?: string;
  maxMarks?: number;
  rubric?: string;
  signal?: AbortSignal;
}): Promise<TestAttemptRecord> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. AI copy evaluation requires an active network connection.');
  }

  let res: Response;
  try {
    res = await fetchWithRetry('/api/test/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: params.signal,
    });
  } catch (err: any) {
    if (params.signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      throw new Error('Test evaluation was cancelled.');
    }
    throw new Error('Failed to connect to LifePilot server for test evaluation.');
  }

  const data = (await res.json().catch(() => null)) as (TestAttemptRecord & ApiErrorResponse) | null;
  if (!res.ok) {
    throw new Error(data?.error || `Answer evaluation failed (HTTP ${res.status}).`);
  }

  if (!data || typeof data.marksObtained !== 'number') {
    throw new Error('Server returned an unreadable test evaluation.');
  }

  return data;
}

/**
 * MODULE 5: Placement Mock Interview Interactive Turn
 */
export async function executeInterviewTurn(params: {
  branch: EngineeringBranch;
  domain: string;
  difficulty: 'Entry-Level / Fresher' | 'Intermediate' | 'Core Engineering High-Difficulty';
  round: InterviewRoundType;
  history: { sender: 'ai' | 'student'; text: string }[];
  studentAnswer: string;
  isFinalTurn?: boolean;
  signal?: AbortSignal;
}): Promise<{
  feedback: string;
  technicalAccuracyScore: number;
  communicationScore: number;
  followUpQuestion?: string;
  report?: InterviewReport;
}> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Placement mock interview requires an active network connection.');
  }

  let res: Response;
  try {
    res = await fetchWithRetry('/api/interview/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: params.signal,
    });
  } catch (err: any) {
    if (params.signal?.aborted || err?.name === 'AbortError' || err?.message?.includes('cancelled')) {
      throw new Error('Mock interview turn was cancelled.');
    }
    throw new Error('Failed to connect to LifePilot server for mock interview.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Interview response failed (HTTP ${res.status}).`);
  }

  return data;
}
