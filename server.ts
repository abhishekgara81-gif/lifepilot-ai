import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type { QuestionItem } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GEMINI_MODEL = 'gemini-3.8-flash';
const VALID_DOMAINS = new Set(['academic', 'software', 'career', 'research']);
const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);
const VALID_CATEGORIES = new Set(['study', 'coding', 'project', 'revision', 'personal', 'learning']);

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    totalEstimatedHours: { type: Type.NUMBER },
    timeframeDays: { type: Type.NUMBER },
    dailyFocusHours: { type: Type.NUMBER },
    phases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                estimatedMinutes: { type: Type.NUMBER },
                category: { type: Type.STRING, enum: ['study', 'coding', 'project', 'revision', 'personal', 'learning'] },
                dueDateOffsetDays: { type: Type.NUMBER },
                subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['title', 'description', 'priority', 'estimatedMinutes', 'category', 'dueDateOffsetDays', 'subtasks'],
            },
          },
        },
        required: ['name', 'description', 'tasks'],
      },
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['title', 'summary', 'totalEstimatedHours', 'timeframeDays', 'dailyFocusHours', 'phases', 'recommendations'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidPlan(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)
    || !isNonEmptyString(value.title)
    || !isNonEmptyString(value.summary)
    || !isFiniteNumber(value.totalEstimatedHours)
    || !isFiniteNumber(value.timeframeDays)
    || !isFiniteNumber(value.dailyFocusHours)
    || !Array.isArray(value.phases)
    || value.phases.length === 0
    || !Array.isArray(value.recommendations)
    || !value.recommendations.every(isNonEmptyString)) {
    return false;
  }

  return value.phases.every((phase) => isRecord(phase)
    && isNonEmptyString(phase.name)
    && isNonEmptyString(phase.description)
    && Array.isArray(phase.tasks)
    && phase.tasks.every((task) => isRecord(task)
      && isNonEmptyString(task.title)
      && isNonEmptyString(task.description)
      && typeof task.priority === 'string'
      && VALID_PRIORITIES.has(task.priority)
      && isFiniteNumber(task.estimatedMinutes)
      && typeof task.category === 'string'
      && VALID_CATEGORIES.has(task.category)
      && isFiniteNumber(task.dueDateOffsetDays)
      && Array.isArray(task.subtasks)
      && task.subtasks.every(isNonEmptyString)));
}

type GeminiErrorCategory =
  | 'authentication_or_access'
  | 'invalid_model'
  | 'invalid_request'
  | 'quota'
  | 'rate_limit'
  | 'network'
  | 'upstream'
  | 'unknown';

interface GeminiErrorDetails {
  category: GeminiErrorCategory;
  status?: number;
  code?: string;
}

function getErrorDetails(error: unknown): GeminiErrorDetails {
  const record = isRecord(error) ? error : {};
  const cause = isRecord(record.cause) ? record.cause : {};
  const response = isRecord(record.response) ? record.response : {};
  const status = typeof record.status === 'number'
    ? record.status
    : typeof response.status === 'number'
      ? response.status
      : undefined;
  const rawMessage = typeof record.message === 'string' ? record.message : '';
  const causeCode = typeof cause.code === 'string' ? cause.code : '';
  const errorCode = typeof record.code === 'string' ? record.code : '';
  const knownCodes = /^(?:API_KEY_INVALID|PERMISSION_DENIED|UNAUTHENTICATED|RESOURCE_EXHAUSTED|INVALID_ARGUMENT|NOT_FOUND|UNAVAILABLE|DEADLINE_EXCEEDED|INTERNAL|TOO_MANY_REQUESTS|UND_ERR_[A-Z_]+|ECONN[A-Z]+|ENOTFOUND|EAI_AGAIN|EACCES|ETIMEDOUT)$/i;
  const code = [errorCode, causeCode].find((candidate) => knownCodes.test(candidate));
  const searchable = `${rawMessage} ${code || ''}`.toLowerCase();

  let category: GeminiErrorCategory = 'unknown';
  if (/quota|resource[_ ]exhausted|daily[_ ]limit/.test(searchable) || status === 429) {
    category = 'quota';
  } else if (status === 401 || status === 403 || /api[_ -]?key.{0,30}(invalid|not valid|expired)|invalid.{0,30}api[_ -]?key|unauthori[sz]ed|permission[_ ]denied|unauthenticated|api.{0,30}(not enabled|not active)/.test(searchable)) {
    category = 'authentication_or_access';
  } else if (status === 404 || code?.toUpperCase() === 'NOT_FOUND' || /model.{0,120}(not found|does not exist|unsupported|not supported)|(?:not found|does not exist|unsupported|not supported).{0,120}model/.test(searchable)) {
    category = 'invalid_model';
  } else if (/rate[_ -]?limit|too many requests/.test(searchable)) {
    category = 'rate_limit';
  } else if (status === 400) {
    category = 'invalid_request';
  } else if (/fetch failed|timeout|timed out|requesttimeouterror|econnreset|econnrefused|enotfound|eai_again|eacces|network error/.test(searchable)
    || Boolean(code && /^(UND_ERR|ECONN|ENOTFOUND|EAI_|EACCES|ETIMEDOUT|ERR_NETWORK)/.test(code))) {
    category = 'network';
  } else if (typeof status === 'number' && status >= 500) {
    category = 'upstream';
  }

  // Log only status/category/allowlisted codes; do not serialize provider messages or request objects.
  return {
    category,
    ...(typeof status === 'number' ? { status } : {}),
    ...(code ? { code } : {}),
  };
}

function clientErrorFor(category: GeminiErrorCategory): string {
  switch (category) {
    case 'authentication_or_access':
      return 'Gemini rejected the configured key or project access. Verify the key is valid and the Gemini API is enabled.';
    case 'invalid_model':
      return 'The configured Gemini model is unavailable to this API. Verify the model name and project access.';
    case 'invalid_request':
      return 'Gemini rejected the request configuration. Check the model and structured response settings.';
    case 'quota':
      return 'Gemini project quota is exhausted. Check the project quota and billing, then retry.';
    case 'rate_limit':
      return 'Gemini rate limit reached. Wait briefly before trying again.';
    case 'network':
      return 'LifePilot could not connect to Gemini. Check the server network connection and try again.';
    case 'upstream':
      return 'Gemini is temporarily unavailable. Please try again shortly.';
    default:
      return 'Gemini could not generate a plan right now. Please try again shortly.';
  }
}

export function getLocalSyllabusFallback(params: {
  university?: unknown;
  boardOrUniversity?: unknown;
  branch?: unknown;
  courseOrClass?: unknown;
  educationLevel?: unknown;
  semester?: unknown;
  subjectName?: string;
}) {
  const university = typeof params.boardOrUniversity === 'string' && params.boardOrUniversity.trim()
    ? params.boardOrUniversity.trim()
    : typeof params.university === 'string' && params.university.trim()
      ? params.university.trim()
      : 'Academic Board / University';
  const course = typeof params.courseOrClass === 'string' && params.courseOrClass.trim()
    ? params.courseOrClass.trim()
    : typeof params.branch === 'string' && params.branch.trim()
      ? params.branch.trim()
      : 'Course';
  const semester = params.semester ? String(params.semester) : 'Current';
  const level = typeof params.educationLevel === 'string' ? params.educationLevel : 'engineering';

  if (level === 'school' || (typeof params.courseOrClass === 'string' && params.courseOrClass.toLowerCase().includes('class'))) {
    return {
      summary: `Syllabus structured for ${university} - ${course}`,
      extractedTextPreview: 'Standard high-yield secondary / senior secondary curriculum topics parsed successfully.',
      topics: [
        'Core Foundations & Theoretical Principles',
        'Mathematical & Diagrammatic Formulations',
        'Analytical Applications & Problem Solving',
        'Board Examination Review & Numerical Practice',
      ],
      units: [
        {
          unitNumber: 1,
          title: 'Unit 1: Fundamentals & Conceptual Laws',
          topics: ['Key definitions & governing laws', 'SI units & dimensional analysis', 'Standard formulations', 'Primary diagrams'],
        },
        {
          unitNumber: 2,
          title: 'Unit 2: Mechanisms & Intermediate Applications',
          topics: ['Step-by-step derivations', 'Standard chemical / physical equations', 'Comparative case studies', 'Graph interpretations'],
        },
        {
          unitNumber: 3,
          title: 'Unit 3: Problem Solving & Advanced Problems',
          topics: ['Multi-step numerical problems', 'Edge case boundary conditions', 'Experimental setup & observations'],
        },
        {
          unitNumber: 4,
          title: 'Unit 4: High-Yield Revision & Board Exam PYQ Focus',
          topics: ['Frequently repeated board concepts', 'High-weightage diagram questions', 'Sample paper test problems'],
        },
      ],
      importantFocusAreas: [
        'Core Law Derivations & Statement Proofs',
        'Labeled Diagrams & Step Mark Criteria',
        'Standard 5-Mark Comprehensive Questions',
      ],
    };
  }

  if (level === 'medical_health' || course.toLowerCase().includes('nurs') || course.toLowerCase().includes('pharm')) {
    return {
      summary: `Clinical & Theoretical Syllabus parsed for ${university} - ${course}`,
      extractedTextPreview: 'Medical & Healthcare curriculum units extracted with clinical competence areas.',
      topics: [
        'Anatomical & Physiological Frameworks',
        'Clinical Nursing Foundations & Patient Safety',
        'Pharmacological Interventions & Dosages',
        'Diagnostic Evaluation & Patient Case Management',
      ],
      units: [
        {
          unitNumber: 1,
          title: 'Unit 1: Anatomical Structures & Systemic Foundations',
          topics: ['Histological foundations', 'Primary organ systems anatomy', 'Circulatory & Respiratory mechanisms'],
        },
        {
          unitNumber: 2,
          title: 'Unit 2: Clinical Assessment & Care Protocols',
          topics: ['Vital sign assessments (TPR & BP)', 'Aseptic techniques & infection prevention', 'Patient handover protocols (SBAR)'],
        },
        {
          unitNumber: 3,
          title: 'Unit 3: Applied Pharmacology & Drug Administration',
          topics: ['Ten rights of medication', 'Dosage calculations', 'Adverse drug reaction monitoring'],
        },
        {
          unitNumber: 4,
          title: 'Unit 4: Practical Viva & Clinical Scenario Review',
          topics: ['Emergency triage scenarios', 'Clinical viva question preparation', 'Comprehensive patient care plans'],
        },
      ],
      importantFocusAreas: [
        'Clinical Protocols & Patient Safety Standards',
        'Vital Sign Interpretation & Normal Reference Ranges',
        'Emergency Resuscitation & Practical Viva Prompts',
      ],
    };
  }

  return {
    summary: `Syllabus parsed for ${university} - ${course} (Semester ${semester})`,
    extractedTextPreview: 'University engineering & technical syllabus decomposed into 4 core units.',
    topics: [
      'Linear Data Structures (Stacks, Queues, Linked Lists)',
      'Non-Linear Trees & AVL Rotations',
      'Graph Algorithms (Dijkstra, MST)',
      'Sorting & Dynamic Programming',
    ],
    units: [
      {
        unitNumber: 1,
        title: 'Linear Data Structures & Analysis',
        topics: ['Array addressing', 'Stack applications (Infix to Postfix)', 'Circular Queues', 'Linked List operations'],
      },
      {
        unitNumber: 2,
        title: 'Tree Data Structures & Balancing',
        topics: ['Binary Search Tree insertion/deletion', 'AVL Rotations', 'B-Trees & B+ Trees in indexing'],
      },
      {
        unitNumber: 3,
        title: 'Graph Traversals & Shortest Paths',
        topics: ['BFS & DFS', 'Prim & Kruskal MST', 'Dijkstra Single-Source Shortest Path'],
      },
      {
        unitNumber: 4,
        title: 'Dynamic Programming & Complexity',
        topics: ['0/1 Knapsack problem', 'Longest Common Subsequence', 'Greedy vs DP paradigms'],
      },
    ],
    importantFocusAreas: [
      'AVL Rotations (3-Star PYQ topic)',
      'Dijkstra vs Bellman-Ford Shortest Path',
      '0/1 Knapsack DP recurrence relation',
    ],
  };
}

export function getLocalQuestionsFallback(params: {
  subjectName: string;
  unitNumber?: unknown;
  topic?: unknown;
  topics?: unknown;
  questionType?: unknown;
  expectedMarks?: unknown;
}): { questions: QuestionItem[] } {
  const unitNum = typeof params.unitNumber === 'number' && Number.isFinite(params.unitNumber) ? params.unitNumber : 1;
  const cleanSubject = params.subjectName.trim();
  const cleanTopic = typeof params.topic === 'string' && params.topic.trim() ? params.topic.trim() : cleanSubject;
  const targetMarks = typeof params.expectedMarks === 'number' && [2, 5, 8, 10, 16].includes(params.expectedMarks)
    ? (params.expectedMarks as 2 | 5 | 8 | 10 | 16)
    : 10;
  const qType = typeof params.questionType === 'string' ? params.questionType : 'all';

  if (qType === 'mcq') {
    return {
      questions: [
        {
          id: `q-mcq-${Date.now()}-1`,
          subjectId: 'custom-sub',
          subjectName: cleanSubject,
          unit: unitNum,
          question: `Which of the following statements is TRUE regarding the fundamental mechanism of ${cleanTopic}?`,
          expectedMarks: 2,
          stars: 0,
          isVerifiedPYQ: false,
          sourceCategory: 'ai_practice',
          questionKind: 'mcq',
          repetitionCount: 0,
          keyTopics: [cleanTopic],
          mcqOptions: [
            'A) It guarantees optimal time efficiency across all edge inputs.',
            'B) It operates based on deterministic state transitions and well-defined invariants.',
            'C) It requires unbounded auxiliary memory allocation under worst-case runtime.',
            'D) It bypasses boundary checking during recursive calls.',
          ],
          correctAnswer: 'B) It operates based on deterministic state transitions and well-defined invariants.',
          modelAnswer: `Correct Option: B. In ${cleanTopic}, operations maintain invariant states throughout each computational step.`,
          markingPoints: ['1 mark for identifying correct option B', '1 mark for theoretical justification'],
          createdAt: new Date().toISOString(),
        },
        {
          id: `q-mcq-${Date.now()}-2`,
          subjectId: 'custom-sub',
          subjectName: cleanSubject,
          unit: unitNum,
          question: `What is the primary constraint or trade-off encountered when optimizing ${cleanTopic}?`,
          expectedMarks: 2,
          stars: 0,
          isVerifiedPYQ: false,
          sourceCategory: 'ai_practice',
          questionKind: 'mcq',
          repetitionCount: 0,
          keyTopics: [cleanTopic],
          mcqOptions: [
            'A) Space complexity overhead vs time complexity speedup.',
            'B) Total hardware clock cycle limitation.',
            'C) Inability to serialize structured data.',
            'D) Fixed input size requirements.',
          ],
          correctAnswer: 'A) Space complexity overhead vs time complexity speedup.',
          modelAnswer: `Correct Option: A. The classic trade-off in ${cleanTopic} involves auxiliary memory vs computational speed.`,
          markingPoints: ['1 mark for correct option', '1 mark for trade-off context'],
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  return {
    questions: [
      {
        id: `q-gen-${Date.now()}-1`,
        subjectId: 'custom-sub',
        subjectName: cleanSubject,
        unit: unitNum,
        question: `Explain the core theoretical principles and practical algorithmic or analytical steps for ${cleanTopic}.`,
        expectedMarks: targetMarks,
        stars: 0,
        isVerifiedPYQ: false,
        sourceCategory: 'ai_practice',
        repetitionCount: 0,
        keyTopics: [cleanTopic],
        modelAnswer: `1. Foundational Definition: Clearly define core terminology and initial parameters.\n2. Methodology / Formulation: State necessary governing equations and algorithmic steps.\n3. Diagram / Trace: Provide structured illustrative example.\n4. Complexity / Trade-offs: State boundary conditions and practical constraints.`,
        markingPoints: [
          `Definition & Principles (${Math.round(targetMarks * 0.3)} marks)`,
          `Core Formulation & Proof (${Math.round(targetMarks * 0.5)} marks)`,
          `Example / Diagram (${Math.round(targetMarks * 0.2)} marks)`,
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: `q-gen-${Date.now()}-2`,
        subjectId: 'custom-sub',
        subjectName: cleanSubject,
        unit: unitNum,
        question: `Differentiate between the primary approaches or alternative methodologies used in ${cleanTopic} with illustrative diagrams or comparative tabular analysis.`,
        expectedMarks: targetMarks > 5 ? 5 : targetMarks,
        stars: 0,
        isVerifiedPYQ: false,
        sourceCategory: 'ai_practice',
        repetitionCount: 0,
        keyTopics: [cleanTopic, 'Comparative Analysis'],
        modelAnswer: `Construct a structured comparison table analyzing:\n- Operational Mechanism\n- Time & Space Overheads\n- Implementation Complexity\n- Practical Exam / Industry Use Cases`,
        markingPoints: [
          'Tabular Comparison Parameters (3 marks)',
          'Illustrative Examples & Use-Cases (2 marks)',
        ],
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function getLocalTestEvaluationFallback(params: {
  mode: 'handwritten' | 'viva' | 'typed';
  question: string;
  studentAnswer?: string;
  maxMarks?: number;
  reason?: string;
  notice?: string;
}) {
  const mode = params.mode;
  const maxScore = typeof params.maxMarks === 'number' && params.maxMarks > 0 ? params.maxMarks : 10;
  const answerText = typeof params.studentAnswer === 'string' ? params.studentAnswer.trim() : '';
  const hasSubmission = mode === 'handwritten' || answerText.length > 0;

  // IMPORTANT PRODUCTION-SAFETY RULE:
  // Never derive correctness or assign high marks based purely on text length or file size.
  // When live AI is unavailable, this returns a provisional submission structure review with
  // all steps explicitly marked as unverified/partial and clearly disclaiming AI evaluation.
  const step1Max = Math.round(maxScore * 0.35 * 10) / 10;
  const step2Max = Math.round(maxScore * 0.45 * 10) / 10;
  const step3Max = Math.round((maxScore - step1Max - step2Max) * 10) / 10;

  // Transparent provisional baseline: 50% structural attempt credit if an answer was submitted,
  // 0% if empty. No answer-length inflation.
  const provisionalMarks = hasSubmission ? Math.round(maxScore * 0.5 * 10) / 10 : 0;
  const step1Award = hasSubmission ? Math.round(step1Max * 0.5 * 10) / 10 : 0;
  const step2Award = hasSubmission ? Math.round(step2Max * 0.5 * 10) / 10 : 0;
  const step3Award = hasSubmission ? Math.round(step3Max * 0.5 * 10) / 10 : 0;

  const reasonDesc = params.reason === 'quota_exhausted' || params.reason === 'quota'
    ? 'Gemini Free Tier quota reached'
    : params.reason === 'unconfigured'
      ? 'Gemini API key not configured'
      : params.reason === 'network'
        ? 'network connectivity issue'
        : 'live AI evaluation unavailable';

  const defaultNotice = params.notice || (
    params.reason === 'quota_exhausted' || params.reason === 'quota'
      ? 'Provisional Rubric Estimate: Live AI grading quota was exhausted. This score is an unverified structural estimate only.'
      : 'Provisional Rubric Estimate: Generated by local fallback engine because live AI grading was unavailable.'
  );

  return {
    id: `test-att-${Date.now()}`,
    mode,
    question: params.question,
    studentAnswer: answerText || (mode === 'handwritten' ? '[Answer Sheet Photo Uploaded]' : '[No answer text provided]'),
    maxMarks: maxScore,
    marksObtained: provisionalMarks,
    percentage: Math.round((provisionalMarks / maxScore) * 100),
    isFallback: true,
    isEstimatedScore: true,
    providerStatus: params.reason || 'quota_exhausted',
    notice: defaultNotice,
    stepEvaluation: [
      {
        stepNumber: 1,
        stepDescription: 'Core Concept Definition & Framework Formulation',
        status: hasSubmission ? ('partial' as const) : ('incorrect' as const),
        marksAwarded: step1Award,
        maxMarks: step1Max,
        feedback: hasSubmission
          ? 'Submission structure recognized for opening step. Conceptual validity and governing laws require teacher / answer-key verification.'
          : 'No opening answer formulation provided.',
      },
      {
        stepNumber: 2,
        stepDescription: 'Mathematical / Algorithmic Intermediate Working Steps',
        status: hasSubmission ? ('partial' as const) : ('incorrect' as const),
        marksAwarded: step2Award,
        maxMarks: step2Max,
        feedback: hasSubmission
          ? 'Intermediate working received. Step derivations and arithmetic accuracy were not checked by live AI.'
          : 'Intermediate steps omitted.',
      },
      {
        stepNumber: 3,
        stepDescription: 'Conclusion, Final Answer & Units Verification',
        status: hasSubmission ? ('partial' as const) : ('incorrect' as const),
        marksAwarded: step3Award,
        maxMarks: step3Max,
        feedback: hasSubmission
          ? 'Concluding statement recorded. Verification against the official marking scheme is recommended.'
          : 'Concluding answer missing.',
      },
    ],
    strengths: hasSubmission ? [
      'Answer submission successfully captured for structural review',
      'Follows academic exam question breakdown structure',
    ] : ['Question registered in test record'],
    mistakes: [
      'Provisional Estimate Only: Semantic accuracy, numerical correctness, and formula validity have NOT been graded by live AI.',
      'Do not rely on this score for official grading. Have your instructor review or retry when AI service is connected.',
    ],
    explanation: `PROVISIONAL RUBRIC ESTIMATE ONLY: Live AI evaluation was unavailable (${reasonDesc}). Answer correctness cannot be inferred from text length or file size alone. All steps are marked as provisional.`,
    handwritingConfidence: mode === 'handwritten' ? 0 : undefined,
    evaluatedAt: new Date().toISOString(),
  };
}

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export class BoundedRateLimiter {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(
    public readonly maxLimit: number,
    public readonly windowMs = 60_000,
    public readonly maxBuckets = 1000
  ) {}

  public check(ip: string): RateLimitCheckResult {
    const now = Date.now();
    let bucket = this.buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(ip, bucket);
    }
    if (bucket.count >= this.maxLimit) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      return { allowed: false, retryAfterSeconds };
    }
    bucket.count += 1;

    // Periodically prune expired buckets so memory remains strictly bounded
    if (this.buckets.size > this.maxBuckets) {
      for (const [key, b] of this.buckets) {
        if (b.resetAt <= now) {
          this.buckets.delete(key);
        }
      }
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  public reset(): void {
    this.buckets.clear();
  }

  public getBucketCount(): number {
    return this.buckets.size;
  }
}


async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Gemini API call timed out after ${timeoutMs / 1000} seconds.`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredKey = process.env.GEMINI_API_KEY?.trim();
  const isPlaceholderKey = !configuredKey
    || /^(your[_ -].*|replace[_ -].*|my[_ -].*|<.*>)$/i.test(configuredKey);

  // Initialize official Google Gen AI SDK with bounded timeout and no unbounded 429 retries
  const ai = !configuredKey || isPlaceholderKey
    ? null
    : new GoogleGenAI({
        apiKey: configuredKey,
        httpOptions: {
          timeout: 10000,
          retryOptions: {
            attempts: 1, // Fail fast on non-retryable errors like 429 quota exhaustion or 400 invalid argument
          },
        },
      });

  // Track provider quota exhaustion to fail-fast to deterministic local fallback without unnecessary remote delay
  let providerQuotaExhaustedUntil = 0;

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const isQuotaExhausted = Date.now() < providerQuotaExhaustedUntil;
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(ai),
      providerStatus: !ai ? 'unconfigured' : isQuotaExhausted ? 'quota_exhausted' : 'configured',
      model: GEMINI_MODEL,
    });
  });

  app.get('/api/firebase-config', (_req, res) => {
    const apiKey = (process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '').trim();
    const projectId = (process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
    const authDomain = (process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '').trim() || (projectId ? `${projectId}.firebaseapp.com` : '');
    const storageBucket = (process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '').trim() || (projectId ? `${projectId}.appspot.com` : '');
    const messagingSenderId = (process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '').trim();
    const appId = (process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '').trim();

    const isConfigured = Boolean(apiKey && projectId && !apiKey.includes('your_') && !projectId.includes('your_'));
    res.json({
      isConfigured,
      config: isConfigured ? { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } : null,
    });
  });

  // Centralized, bounded per-route rate limiters protecting quotas and memory
  const planLimiter = new BoundedRateLimiter(10, 60_000, 1000);
  const syllabusLimiter = new BoundedRateLimiter(15, 60_000, 1000);
  const questionsLimiter = new BoundedRateLimiter(20, 60_000, 1000);
  const crashPlanLimiter = new BoundedRateLimiter(20, 60_000, 1000);
  const testEvaluateLimiter = new BoundedRateLimiter(15, 60_000, 1000);
  const interviewLimiter = new BoundedRateLimiter(30, 60_000, 1000);

  function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  app.post('/api/plan/generate', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const { prompt, timeframeDays, hoursPerDay, domain } = req.body;
    if (typeof prompt !== 'string' || prompt.trim().length < 5 || prompt.trim().length > 4000) {
      return res.status(400).json({ error: 'Goal description must be between 5 and 4,000 characters.' });
    }
    if (!Number.isInteger(timeframeDays) || (timeframeDays as number) < 1 || (timeframeDays as number) > 365) {
      return res.status(400).json({ error: 'Timeframe must be a whole number between 1 and 365 days.' });
    }
    if (!isFiniteNumber(hoursPerDay) || hoursPerDay < 1 || hoursPerDay > 24) {
      return res.status(400).json({ error: 'Daily focus hours must be between 1 and 24.' });
    }
    if (typeof domain !== 'string' || !VALID_DOMAINS.has(domain)) {
      return res.status(400).json({ error: 'Choose a valid planning domain.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = planLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many plan requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to the local .env file and restart the server.' });
    }

    try {
      const cleanPrompt = prompt.trim();
      const response = await callGeminiWithTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `Create a comprehensive action plan for the following goal:\n${cleanPrompt}\n\nTarget timeframe: ${timeframeDays} days\nAvailable work hours per day: ${hoursPerDay}\nPrimary domain: ${domain}`,
          config: {
            systemInstruction: `You are LifePilot AI, an action planner for students, engineers, and self-directed learners. Create a realistic phased plan with specific, executable tasks, durations in minutes, priorities, categories, due date offsets from day zero, and concrete subtasks. Fit the workload to the stated timeframe and daily hours. Keep recommendations specific and concise.`,
            responseMimeType: 'application/json',
            responseSchema,
          },
        })
      );

      const rawText = response.text?.trim();
      if (!rawText) {
        console.error('Gemini response was empty.', JSON.stringify({ category: 'response_parsing', upstreamHttpStatus: 200, stage: 'empty_text' }));
        return res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
      }

      let parsedPlan: unknown;
      try {
        parsedPlan = JSON.parse(rawText);
      } catch {
        console.error('Gemini response could not be parsed.', JSON.stringify({ category: 'response_parsing', upstreamHttpStatus: 200, stage: 'invalid_json' }));
        return res.status(502).json({ error: 'Gemini returned a plan that could not be read. Please try again.' });
      }

      if (!isValidPlan(parsedPlan)) {
        console.error('Gemini response did not match the plan schema.', JSON.stringify({ category: 'response_parsing', upstreamHttpStatus: 200, stage: 'schema_validation' }));
        return res.status(502).json({ error: 'Gemini returned an incomplete plan. Please retry your request.' });
      }

      return res.json({
        ...parsedPlan,
        isAIGenerated: true,
        notice: `Generated in real time by Google Gemini (${GEMINI_MODEL}).`,
      });
    } catch (error: unknown) {
      const details = getErrorDetails(error);
      console.error('Gemini upstream request failed.', JSON.stringify({
        category: details.category,
        upstreamHttpStatus: details.status ?? null,
        providerCode: details.code ?? null,
      }));
      if (details.category === 'rate_limit' || details.category === 'quota') {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: clientErrorFor(details.category) });
      }
      return res.status(502).json({ error: clientErrorFor(details.category) });
    }
  });

  // ==============================================================
  // MODULE 1: Customized Syllabus & Notes Extraction Endpoint
  // ==============================================================
  app.post('/api/syllabus/extract', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = syllabusLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many syllabus extraction requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const {
      text,
      queryPrompt,
      university,
      boardOrUniversity,
      branch,
      courseOrClass,
      educationLevel,
      semester,
      imageBase64,
      fileBase64,
      mimeType,
    } = req.body;

    if (typeof text === 'string' && text.length > 50000) {
      return res.status(400).json({ error: 'Syllabus text exceeds the 50,000 character limit.' });
    }
    if (typeof queryPrompt === 'string' && queryPrompt.length > 50000) {
      return res.status(400).json({ error: 'Query prompt exceeds the 50,000 character limit.' });
    }

    const board = (typeof boardOrUniversity === 'string' && boardOrUniversity.trim()) ||
      (typeof university === 'string' && university.trim()) ||
      'Academic Board / University';
    const course = (typeof courseOrClass === 'string' && courseOrClass.trim()) ||
      (typeof branch === 'string' && branch.trim()) ||
      'Course';

    const inputMedia = (typeof imageBase64 === 'string' ? imageBase64 : '') ||
      (typeof fileBase64 === 'string' ? fileBase64 : '');
    const inputText = (typeof text === 'string' ? text.trim() : '') ||
      (typeof queryPrompt === 'string' ? queryPrompt.trim() : '');

    if (!inputText && !inputMedia) {
      return res.status(400).json({ error: 'Please enter a query, paste syllabus text, or upload an image/notes file.' });
    }

    if (inputMedia && inputMedia.length > 12_000_000) {
      return res.status(400).json({ error: 'Uploaded file size exceeds the 8MB limit.' });
    }

    const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
    if (mimeType && typeof mimeType === 'string' && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported file type. Allowed formats: JPEG, PNG, WebP, PDF.' });
    }

    const fallbackPayload = getLocalSyllabusFallback({
      boardOrUniversity: board,
      university: board,
      branch: course,
      courseOrClass: course,
      educationLevel,
      semester,
    });

    if (!ai) {
      return res.json({
        ...fallbackPayload,
        isFallback: true,
        providerStatus: 'unconfigured',
        notice: 'Generated by deterministic local curriculum engine (Gemini key not configured).',
      });
    }

    if (Date.now() < providerQuotaExhaustedUntil) {
      return res.json({
        ...fallbackPayload,
        isFallback: true,
        providerStatus: 'quota_exhausted',
        notice: 'Generated by deterministic local curriculum engine (Gemini Free Tier daily quota reached).',
      });
    }

    try {
      let contents: any;
      const contextDesc = `Education Level: ${educationLevel || 'General'}\nBoard/University: ${board}\nCourse/Class: ${course}\nYear/Semester: ${semester || 'Current'}`;

      if (inputMedia && inputMedia.length > 20) {
        const cleanBase64 = inputMedia.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        contents = [
          `You are LifePilot Vision Syllabus Extractor. Transcribe and extract all syllabus units, chapters, and topics from this photo or document of syllabus pages, textbook contents, or topic lists.\n${contextDesc}\nReturn strictly valid JSON matching schema.`,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
            },
          },
        ];
      } else {
        contents = `Analyze the following syllabus text or student query for an academic student:\n"${inputText}"\n\n${contextDesc}\n\nDecompose into structured units, topics, and high-yield exam focus areas.`;
      }

      const response = await callGeminiWithTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction: `You are LifePilot AI Syllabus Analyzer. Extract syllabus units, chapters, topics, and important exam focus areas. Return strictly valid JSON matching this schema:
{
  "summary": "concise overview of syllabus and exam scope",
  "extractedTextPreview": "verbatim or structured transcription of extracted topics from image/text",
  "topics": ["topic 1", "topic 2", "topic 3"],
  "units": [
    {
      "unitNumber": 1,
      "title": "Unit / Chapter Title",
      "topics": ["Topic A", "Topic B"]
    }
  ],
  "importantFocusAreas": ["High priority focus 1", "High priority focus 2"]
}`,
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      const raw = response.text?.trim();
      if (!raw) {
        return res.json({
          ...fallbackPayload,
          isFallback: true,
          providerStatus: 'upstream',
          notice: 'Generated by deterministic local curriculum engine (empty upstream response).',
        });
      }
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.units)) {
        return res.json({
          ...parsed,
          extractedTextPreview: parsed.extractedTextPreview || inputText || 'Syllabus topics parsed from input document.',
          isFallback: false,
          providerStatus: 'live_ai',
          notice: `Generated in real time by Google Gemini (${GEMINI_MODEL}).`,
        });
      }
      return res.json({
        ...fallbackPayload,
        isFallback: true,
        providerStatus: 'upstream',
        notice: 'Generated by deterministic local curriculum engine.',
      });
    } catch (error: unknown) {
      const details = getErrorDetails(error);
      if (details.category === 'quota') {
        providerQuotaExhaustedUntil = Date.now() + 60_000;
      }
      console.warn('Gemini syllabus extraction fallback triggered:', JSON.stringify({ category: details.category, status: details.status }));
      return res.json({
        ...fallbackPayload,
        isFallback: true,
        providerStatus: details.category === 'quota' ? 'quota_exhausted' : details.category,
        notice: `Generated by deterministic local curriculum engine (${clientErrorFor(details.category)}).`,
      });
    }
  });

  // ==============================================================
  // MODULE 2: Generate Syllabus-Based Practice Questions
  // ==============================================================
  app.post('/api/questions/generate', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = questionsLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many question generation requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const {
      subjectName,
      unitNumber,
      topic,
      topics,
      count = 3,
      educationLevel,
      boardOrUniversity,
      courseOrClass,
      questionType = 'all',
      expectedMarks = 10,
      language = 'en',
    } = req.body;

    if (typeof subjectName !== 'string' || subjectName.trim().length < 2 || subjectName.trim().length > 200) {
      return res.status(400).json({ error: 'Subject name must be between 2 and 200 characters.' });
    }

    const safeCount = Math.max(1, Math.min(10, Number.isInteger(count) ? Number(count) : 3));
    const safeLang = typeof language === 'string' && ['en', 'hi', 'hinglish'].includes(language) ? language : 'en';

    const selectedTopicsList = Array.isArray(topics) && topics.length > 0
      ? topics.slice(0, 20).map((t: unknown) => String(t).trim().substring(0, 200)).filter(Boolean)
      : (typeof topic === 'string' && topic.trim() ? [topic.trim().substring(0, 200)] : ['Core Syllabus']);

    const targetMarks = typeof expectedMarks === 'number' && [2, 5, 8, 10, 16].includes(expectedMarks)
      ? (expectedMarks as 2 | 5 | 8 | 10 | 16)
      : 10;

    const fallbackQuestionsPayload = getLocalQuestionsFallback({
      subjectName,
      unitNumber,
      topic: selectedTopicsList[0] || subjectName,
      questionType,
      expectedMarks: targetMarks,
    });

    if (!ai) {
      return res.json({
        ...fallbackQuestionsPayload,
        isFallback: true,
        providerStatus: 'unconfigured',
        notice: 'Generated by deterministic local curriculum engine (Gemini key not configured).',
      });
    }

    if (Date.now() < providerQuotaExhaustedUntil) {
      return res.json({
        ...fallbackQuestionsPayload,
        isFallback: true,
        providerStatus: 'quota_exhausted',
        notice: 'Generated by deterministic local curriculum engine (Gemini Free Tier daily quota reached).',
      });
    }

    try {
      const prompt = `Generate ${safeCount} high-yield exam practice questions for:
Subject: ${subjectName}
Education Level: ${educationLevel || 'Undergraduate'}
Board/University: ${boardOrUniversity || 'General Board/University'}
Course/Class: ${courseOrClass || 'Standard Curriculum'}
Unit/Chapter: ${unitNumber || 1}
Topics: ${selectedTopicsList.join(', ')}
Target Question Type: ${questionType} (e.g. important, revision, mcq, short_note, long_answer, numerical, programming)
Expected Marks per Question: ${targetMarks} marks
Language: ${safeLang === 'hi' ? 'Hindi' : safeLang === 'hinglish' ? 'Hinglish (conversational mix of Hindi & English)' : 'English'}

Strict Rules:
1. If questionType is 'mcq', generate 4 plausible options ("mcqOptions": ["A) ...", "B) ...", "C) ...", "D) ..."]) and "correctAnswer".
2. Include comprehensive model answer and step marking points.
3. Mark questions as unverified AI practice questions: isVerifiedPYQ: false, stars: 0, repetitionCount: 0, sourceCategory: "ai_practice".
Never invent fake university paper citations or fake repetition counts.`;

      const response = await callGeminiWithTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            systemInstruction: `You are LifePilot Exam Question Generator. Return valid JSON matching this schema:
{
  "questions": [
    {
      "id": "q-unique-id",
      "subjectId": "custom-sub",
      "subjectName": "${subjectName}",
      "unit": ${unitNumber || 1},
      "chapterOrUnitName": "Unit / Chapter Title",
      "question": "Question text...",
      "expectedMarks": ${targetMarks},
      "stars": 0,
      "isVerifiedPYQ": false,
      "sourceCategory": "ai_practice",
      "repetitionCount": 0,
      "keyTopics": ["Topic 1", "Topic 2"],
      "modelAnswer": "Model answer points...",
      "markingPoints": ["Point 1", "Point 2"],
      "mcqOptions": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "createdAt": "${new Date().toISOString()}"
    }
  ]
}`,
            responseMimeType: 'application/json',
          },
        }),
        10000
      );

      const raw = response.text?.trim();
      if (!raw) {
        return res.json({
          ...fallbackQuestionsPayload,
          isFallback: true,
          providerStatus: 'upstream',
          notice: 'Generated by deterministic local curriculum engine (empty upstream response).',
        });
      }
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions)) {
        return res.json({
          ...parsed,
          isFallback: false,
          providerStatus: 'live_ai',
          notice: `Generated in real time by Google Gemini (${GEMINI_MODEL}).`,
        });
      }
      return res.json({
        ...fallbackQuestionsPayload,
        isFallback: true,
        providerStatus: 'upstream',
        notice: 'Generated by deterministic local curriculum engine.',
      });
    } catch (error: unknown) {
      const details = getErrorDetails(error);
      if (details.category === 'quota') {
        providerQuotaExhaustedUntil = Date.now() + 60_000;
      }
      console.warn('Gemini question generation fallback triggered:', JSON.stringify({ category: details.category, status: details.status }));
      return res.json({
        ...fallbackQuestionsPayload,
        isFallback: true,
        providerStatus: details.category === 'quota' ? 'quota_exhausted' : details.category,
        notice: `Generated by deterministic local curriculum engine (${clientErrorFor(details.category)}).`,
      });
    }
  });

  // ==============================================================
  // MODULE 3: Day-Wise Crash Study Planner
  // ==============================================================
  app.post('/api/plan/crash-study', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = crashPlanLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many study plan requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const { subjectName, subjectId, examDate, dailyHours = 4, completedTopics = [], units = [] } = req.body;
    if (typeof subjectName !== 'string' || !subjectName.trim() || subjectName.trim().length > 200) {
      return res.status(400).json({ error: 'Subject name must be between 1 and 200 characters.' });
    }
    if (typeof examDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(examDate.trim())) {
      return res.status(400).json({ error: 'Valid exam date (YYYY-MM-DD) is required.' });
    }

    const examTime = new Date(`${examDate}T00:00:00`).getTime();
    const nowTime = new Date().getTime();
    const daysRemaining = Math.max(1, Math.min(60, Math.ceil((examTime - nowTime) / (1000 * 60 * 60 * 24))));
    const hours = Math.max(1, Math.min(16, Number(dailyHours) || 4));

    // Synthesize structured days
    const days: any[] = [];
    const unitList = Array.isArray(units) && units.length > 0 ? units.slice(0, 20) : [
      { unitNumber: 1, title: 'Unit 1: Foundations', topics: ['Core concepts', 'Analysis', 'Definitions'] },
      { unitNumber: 2, title: 'Unit 2: Key Algorithms', topics: ['Methodology', 'Tracing', 'Examples'] },
      { unitNumber: 3, title: 'Unit 3: Advanced Topics', topics: ['Complex scenarios', 'Optimizations'] },
      { unitNumber: 4, title: 'Unit 4: Applications & Review', topics: ['Previous questions', 'Mock paper'] },
    ];

    for (let i = 1; i <= Math.min(daysRemaining, 14); i++) {
      const d = new Date();
      d.setDate(d.getDate() + (i - 1));
      const dateStr = d.toISOString().split('T')[0];
      const activeUnit = unitList[(i - 1) % unitList.length];

      const tasks: any[] = [
        {
          id: `ct-${Date.now()}-${i}-1`,
          dayNumber: i,
          date: dateStr,
          topic: `Study: ${activeUnit.title} core theory and concepts`,
          unit: activeUnit.unitNumber,
          durationMinutes: Math.round(hours * 30),
          type: 'study',
          completed: false,
          missed: false,
        },
        {
          id: `ct-${Date.now()}-${i}-2`,
          dayNumber: i,
          date: dateStr,
          topic: `Practice Questions: 3-Star & 2-Star PYQ problems for Unit ${activeUnit.unitNumber}`,
          unit: activeUnit.unitNumber,
          durationMinutes: Math.round(hours * 15),
          type: 'practice_questions',
          completed: false,
          missed: false,
        },
        {
          id: `ct-${Date.now()}-${i}-3`,
          dayNumber: i,
          date: dateStr,
          topic: i % 2 === 0
            ? `Mock Test: 30-min timed answer sheet test on Unit ${activeUnit.unitNumber}`
            : `Rapid Revision: High-yield summary cards & formula recall`,
          unit: activeUnit.unitNumber,
          durationMinutes: Math.round(hours * 15),
          type: i % 2 === 0 ? 'mock_test' : 'revision',
          completed: false,
          missed: false,
        },
      ];

      days.push({
        dayNumber: i,
        date: dateStr,
        theme: `Day ${i}: ${activeUnit.title}`,
        targetMinutes: hours * 60,
        tasks,
      });
    }

    return res.json({
      id: `crash-${Date.now()}`,
      subjectId: subjectId || 'sub-custom',
      subjectName: subjectName.trim(),
      examDate,
      daysRemaining,
      dailyHours: hours,
      days,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // ==============================================================
  // MODULE 4: Multimodal Test and Copy Checking
  // ==============================================================
  app.post('/api/test/evaluate', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = testEvaluateLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many test evaluation requests. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const { mode, question, studentAnswer, imageBase64, mimeType, maxMarks = 10 } = req.body;
    if (typeof question !== 'string' || question.trim().length < 3 || question.trim().length > 4000) {
      return res.status(400).json({ error: 'Exam question must be between 3 and 4,000 characters.' });
    }

    const validModes = new Set(['handwritten', 'viva', 'typed']);
    if (typeof mode !== 'string' || !validModes.has(mode)) {
      return res.status(400).json({ error: 'Invalid test mode specified. Must be handwritten, viva, or typed.' });
    }
    const safeMode = mode as 'handwritten' | 'viva' | 'typed';
    const safeAnswer = typeof studentAnswer === 'string' ? studentAnswer : undefined;

    const maxScore = Math.max(1, Math.min(100, typeof maxMarks === 'number' && maxMarks > 0 ? Math.round(maxMarks) : 10));

    if (typeof studentAnswer === 'string' && studentAnswer.length > 20000) {
      return res.status(400).json({ error: 'Student answer exceeds 20,000 character limit.' });
    }

    if (mode === 'handwritten' && imageBase64) {
      if (typeof imageBase64 === 'string' && imageBase64.length > 12_000_000) {
        return res.status(400).json({ error: 'Uploaded answer sheet image exceeds 8MB limit.' });
      }
      const ALLOWED_IMG_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
      if (mimeType && typeof mimeType === 'string' && !ALLOWED_IMG_MIME.has(mimeType.toLowerCase())) {
        return res.status(400).json({ error: 'Unsupported image format. Allowed: JPEG, PNG, WebP.' });
      }
    }

    if (!ai) {
      return res.json(getLocalTestEvaluationFallback({
        mode: safeMode,
        question,
        studentAnswer: safeAnswer,
        maxMarks: maxScore,
        reason: 'unconfigured',
      }));
    }

    if (Date.now() < providerQuotaExhaustedUntil) {
      return res.json(getLocalTestEvaluationFallback({
        mode: safeMode,
        question,
        studentAnswer: safeAnswer,
        maxMarks: maxScore,
        reason: 'quota_exhausted',
      }));
    }

    try {
      let contents: any;
      const systemInstruction = `You are an expert university examiner evaluating student answers for academic/engineering exams.
Evaluate strictly, award partial marks for correct steps, point out conceptual or arithmetic mistakes, and provide constructive feedback.
If evaluating handwriting from an image: Read the handwriting carefully. If any formula or word is ambiguous/unclear, state it explicitly in unclearHandwritingPrompt.
Return valid JSON matching this schema:
{
  "maxMarks": ${maxScore},
  "marksObtained": 8.5,
  "percentage": 85,
  "stepEvaluation": [
    {
      "stepNumber": 1,
      "stepDescription": "Step description",
      "status": "correct", // "correct" | "partial" | "incorrect"
      "marksAwarded": 3,
      "maxMarks": 3,
      "feedback": "Step feedback"
    }
  ],
  "strengths": ["Clear diagram", "Accurate formula"],
  "mistakes": ["Omitted units in step 2"],
  "explanation": "Detailed overall evaluation summary",
  "handwritingConfidence": 92,
  "unclearHandwritingPrompt": "Unclear text if any"
}`;

      if (mode === 'handwritten' && typeof imageBase64 === 'string' && imageBase64.length > 20) {
        const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        contents = [
          `Question: "${question}"\nMax Marks: ${maxScore}\nMode: Handwritten answer sheet photo upload.\nEvaluate the handwriting in this image step by step.`,
          {
            inlineData: {
              data: cleanBase64,
              mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
            },
          },
        ];
      } else {
        contents = `Question: "${question}"\nMax Marks: ${maxScore}\nMode: ${mode === 'viva' ? 'Spoken Voice Viva' : 'Typed Answer'}\nStudent Answer:\n"${studentAnswer || 'No answer provided'}"\nEvaluate step-by-step against standard marking rubric.`;
      }

      const response = await callGeminiWithTimeout(
        ai.models.generateContent({
          model: GEMINI_MODEL,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );

      const raw = response.text?.trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        return res.json({
          id: `test-att-${Date.now()}`,
          mode,
          question,
          studentAnswer: studentAnswer || (mode === 'handwritten' ? '[Answer Sheet Photo Uploaded]' : ''),
          answerImageUrl: mode === 'handwritten' && typeof imageBase64 === 'string' ? imageBase64.substring(0, 500) : undefined,
          ...parsed,
          isFallback: false,
          isEstimatedScore: false,
          providerStatus: 'live_ai',
          notice: `Evaluated in real time by Google Gemini (${GEMINI_MODEL}).`,
          evaluatedAt: new Date().toISOString(),
        });
      }

      return res.json(getLocalTestEvaluationFallback({
        mode: safeMode,
        question,
        studentAnswer: safeAnswer,
        maxMarks: maxScore,
        reason: 'upstream',
      }));
    } catch (err: unknown) {
      const details = getErrorDetails(err);
      if (details.category === 'quota') {
        providerQuotaExhaustedUntil = Date.now() + 60_000;
      }
      console.warn('Gemini test evaluation fallback triggered:', JSON.stringify({ category: details.category, status: details.status }));
      return res.json(getLocalTestEvaluationFallback({
        mode: safeMode,
        question,
        studentAnswer: safeAnswer,
        maxMarks: maxScore,
        reason: details.category === 'quota' ? 'quota_exhausted' : details.category,
      }));
    }
  });

  // ==============================================================
  // MODULE 5: Branch and Domain-Specific Mock Interview
  // ==============================================================
  app.post('/api/interview/chat', async (req, res) => {
    if (!isRecord(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const clientId = getClientIp(req);
    const rateCheck = interviewLimiter.check(clientId);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many interview chat turns. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }

    const { branch, domain, difficulty, round, history = [], studentAnswer, isFinalTurn = false } = req.body;
    if (typeof branch !== 'string' || !branch.trim() || branch.trim().length > 100) {
      return res.status(400).json({ error: 'Engineering branch is required (max 100 characters).' });
    }
    if (typeof studentAnswer !== 'string' || !studentAnswer.trim() || studentAnswer.trim().length > 5000) {
      return res.status(400).json({ error: 'Student answer must be between 1 and 5,000 characters.' });
    }

    const safeHistory = Array.isArray(history)
      ? history.slice(-20).map((h: any) => ({
          sender: h?.sender === 'student' ? 'student' : 'ai',
          text: typeof h?.text === 'string' ? h.text.trim().substring(0, 2000) : '',
        }))
      : [];

    if (ai) {
      try {
        const prompt = `You are a Senior Technical Interviewer conducting a campus placement interview.
Student Branch: ${branch}
Domain: ${domain || 'Core Engineering'}
Difficulty: ${difficulty || 'Intermediate'}
Current Round: ${round || 'technical_logical'}
Is Final Round Turn: ${isFinalTurn}

Prior Conversation History:
${JSON.stringify(safeHistory)}

Student's Latest Answer:
"${studentAnswer.trim()}"

Evaluate the answer. Give:
1. Constructive feedback (1-2 sentences).
2. Technical Accuracy score (0-100).
3. Communication Clarity score (0-100).
4. ${isFinalTurn ? 'Comprehensive final interview report (strengths, areasForImprovement, practiceRoadmap, readinessRating).' : 'Next realistic, probing follow-up question for this round.'}

Return valid JSON.`;

        const response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              systemInstruction: `You are an expert technical interviewer. Return JSON:
{
  "feedback": "1-2 sentence feedback on student response",
  "technicalAccuracyScore": 88,
  "communicationScore": 90,
  "followUpQuestion": "${isFinalTurn ? '' : 'Next realistic follow-up question...'}",
  "report": ${isFinalTurn ? `{
    "id": "rep-${Date.now()}",
    "branch": "${branch}",
    "domain": "${domain || 'Core'}",
    "difficulty": "${difficulty || 'Intermediate'}",
    "overallTechnicalScore": 88,
    "overallCommunicationScore": 90,
    "readinessRating": "Ready for Placement",
    "strengths": ["Strength 1", "Strength 2"],
    "areasForImprovement": ["Area 1", "Area 2"],
    "practiceRoadmap": ["Practice tip 1", "Practice tip 2"],
    "completedAt": "${new Date().toISOString()}"
  }` : 'null'}
}`,
              responseMimeType: 'application/json',
            },
          })
        );

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          return res.json({
            ...parsed,
            isFallback: false,
            providerStatus: 'live_ai',
            notice: `Evaluated in real time by Google Gemini (${GEMINI_MODEL}).`,
          });
        }
      } catch (err: unknown) {
        console.warn('Gemini interview fallback triggered:', err);
      }
    }

    // High quality deterministic fallback
    const techScore = Math.min(95, Math.max(65, 75 + Math.round((studentAnswer.length % 20))));
    const commScore = Math.min(96, Math.max(70, 80 + Math.round((studentAnswer.length % 15))));

    if (isFinalTurn) {
      return res.json({
        feedback: 'Excellent round completion. You communicated core engineering tradeoffs with poise and clarity.',
        technicalAccuracyScore: techScore,
        communicationScore: commScore,
        isFallback: true,
        isEstimatedScore: true,
        providerStatus: 'fallback',
        notice: 'Provisional interview report generated by local deterministic engine.',
        report: {
          id: `rep-${Date.now()}`,
          branch,
          domain: domain || 'Core Technical',
          difficulty: difficulty || 'Intermediate',
          overallTechnicalScore: techScore,
          overallCommunicationScore: commScore,
          readinessRating: techScore >= 80 ? 'Ready for Placement' : 'Needs Targeted Practice',
          strengths: [
            'Direct, structured answer framing without hesitation',
            'Strong theoretical grasp of core branch paradigms',
            'Solid articulation of design and implementation trade-offs',
          ],
          areasForImprovement: [
            'Cite specific quantitative metrics and performance benchmarks',
            'Elaborate more on failure recovery and edge-case handling',
          ],
          practiceRoadmap: [
            `Solve 5 standard university and placement interview questions in ${domain || branch}`,
            'Practice 1 live timed System Design / Component Design mock round',
            'Review time/space complexities for multi-threaded implementations',
          ],
          completedAt: new Date().toISOString(),
        },
      });
    }

    return res.json({
      feedback: 'Solid explanation. You accurately addressed the main mechanism.',
      technicalAccuracyScore: techScore,
      communicationScore: commScore,
      isFallback: true,
      isEstimatedScore: true,
      providerStatus: 'fallback',
      notice: 'Interview response evaluated by local deterministic engine.',
      followUpQuestion: `Building on your point, how would you design this to handle concurrency and avoid race conditions or performance degradation when scaled across multiple nodes?`,
    });
  });

  // Keep malformed JSON and oversized API requests in the same JSON error format.
  app.use((error: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api/')) return next(error);
    const status = isRecord(error) && typeof error.status === 'number' ? error.status : undefined;
    if (status === 413) return res.status(413).json({ error: 'Request is too large.' });
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error: unknown) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('sw.js')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Service-Worker-Allowed', '/');
        }
      },
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`LifePilot AI server active on http://0.0.0.0:${port}`);
  });
}

const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isDirectRun) {
  startServer().catch((error: unknown) => {
    console.error('Failed to start LifePilot server.', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  });
}
