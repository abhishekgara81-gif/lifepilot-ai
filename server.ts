import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

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
  if (/quota|resource[_ ]exhausted|daily[_ ]limit/.test(searchable)) {
    category = 'quota';
  } else if (status === 401 || status === 403 || /api[_ -]?key.{0,30}(invalid|not valid|expired)|invalid.{0,30}api[_ -]?key|unauthori[sz]ed|permission[_ ]denied|unauthenticated|api.{0,30}(not enabled|not active)/.test(searchable)) {
    category = 'authentication_or_access';
  } else if (status === 404 || code?.toUpperCase() === 'NOT_FOUND' || /model.{0,120}(not found|does not exist|unsupported|not supported)|(?:not found|does not exist|unsupported|not supported).{0,120}model/.test(searchable)) {
    category = 'invalid_model';
  } else if (status === 429 || /rate[_ -]?limit|too many requests/.test(searchable)) {
    category = 'rate_limit';
  } else if (status === 400) {
    category = 'invalid_request';
  } else if (/fetch failed|timeout|timed out|econnreset|econnrefused|enotfound|eai_again|eacces|network error/.test(searchable)
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

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredKey = process.env.GEMINI_API_KEY?.trim();
  const isPlaceholderKey = !configuredKey
    || /^(your[_ -].*|replace[_ -].*|my[_ -].*|<.*>)$/i.test(configuredKey);
  const ai = !configuredKey || isPlaceholderKey ? null : new GoogleGenAI({ apiKey: configuredKey });

  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(ai) });
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

  // Per-process limit to protect the Gemini quota from accidental rapid retries.
  const generationRequests = new Map<string, { count: number; resetAt: number }>();
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

    if (!ai) {
      return res.status(503).json({ error: 'Gemini is not configured. Add GEMINI_API_KEY to the local .env file and restart the server.' });
    }

    const now = Date.now();
    const clientId = req.ip || 'unknown';
    let rateWindow = generationRequests.get(clientId);
    if (!rateWindow || rateWindow.resetAt <= now) {
      rateWindow = { count: 0, resetAt: now + 60_000 };
      generationRequests.set(clientId, rateWindow);
    }
    if (rateWindow.count >= 10) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateWindow.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({ error: `Too many plan requests. Please try again in ${retryAfterSeconds} seconds.` });
    }
    rateWindow.count += 1;

    // Periodically discard expired client buckets so the map stays bounded.
    if (generationRequests.size > 1000) {
      for (const [key, window] of generationRequests) {
        if (window.resetAt <= now) generationRequests.delete(key);
      }
    }

    try {
      const cleanPrompt = prompt.trim();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Create a comprehensive action plan for the following goal:\n${cleanPrompt}\n\nTarget timeframe: ${timeframeDays} days\nAvailable work hours per day: ${hoursPerDay}\nPrimary domain: ${domain}`,
        config: {
          systemInstruction: `You are LifePilot AI, an action planner for students, engineers, and self-directed learners. Create a realistic phased plan with specific, executable tasks, durations in minutes, priorities, categories, due date offsets from day zero, and concrete subtasks. Fit the workload to the stated timeframe and daily hours. Keep recommendations specific and concise.`,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

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

startServer().catch((error: unknown) => {
  console.error('Failed to start LifePilot server.', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
