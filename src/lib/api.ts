// Thin client for Brook's own API. Every AI call can come back as
// { fallback: true }: the caller then carries on without AI.

import type { AnswerValue, Lang, QuestionId } from "@/core/protocol";

export interface InterpretResult {
  intent?: "answer" | "not_sure" | "help" | "repeat" | "back" | "unclear";
  value?: AnswerValue;
  reply?: string;
  fallback?: boolean;
  reason?: string;
}

export interface Suggestion {
  value: AnswerValue;
  confidence: "low" | "medium" | "high";
  evidence: string;
}

export interface VisionResult {
  isStream?: boolean;
  issues?: string[];
  suggestions?: Partial<Record<QuestionId, Suggestion>>;
  biodiversity?: string | null;
  model?: string;
  fallback?: boolean;
  reason?: string;
}

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const interpret = (b: { lang: Lang; qid: QuestionId; utterance: string; question: string; labels: Record<string, string> }) =>
  post<InterpretResult>("/api/interpret", b, 12_000);

export const analysePhotos = (b: { lang: Lang; photos: { slot: string; dataUrl: string }[] }) =>
  post<VisionResult>("/api/vision", b, 40_000);

export async function aiStatus(): Promise<{ ai: boolean; model: string | null } | null> {
  try {
    const res = await fetch("/api/status", { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
