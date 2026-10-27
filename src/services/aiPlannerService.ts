import { AIPlan } from '../types';

export interface PlanGenerationParams {
  prompt: string;
  timeframeDays?: number;
  hoursPerDay?: number;
  domain?: string;
}

interface ApiErrorResponse {
  error?: string;
}

export async function checkAIHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return { status: 'offline', hasGeminiKey: false };
  }
}

export async function generateActionPlan(params: PlanGenerationParams): Promise<AIPlan> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('You are currently offline. Generating action plans with Google Gemini requires an active internet connection.');
  }

  const { prompt, timeframeDays = 30, hoursPerDay = 3, domain = 'academic' } = params;

  let res: Response;
  try {
    res = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, timeframeDays, hoursPerDay, domain }),
    });
  } catch {
    throw new Error('Network connection failed. LifePilot AI needs an active internet connection to communicate with Google Gemini.');
  }

  const data = await res.json().catch(() => null) as (AIPlan & ApiErrorResponse) | null;
  if (!res.ok) {
    throw new Error(data?.error || `Gemini request failed (HTTP ${res.status}).`);
  }
  if (!data || data.isAIGenerated !== true || !Array.isArray(data.phases)) {
    throw new Error('The server returned an unreadable Gemini plan. Please try again.');
  }
  return data;
}
