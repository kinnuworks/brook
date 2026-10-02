// The one place Brook talks to OpenAI. Every call is checked against three
// spending caps first and recorded afterwards, so a hackathon budget of a few
// dollars can never be drained, by bots or by accident. When a cap is hit
// the app keeps working without AI: answers are tapped or matched locally.

import OpenAI from "openai";
import { rpc } from "./db.js";

export const MODEL = () => process.env.BROOK_MODEL || "gpt-6-luna";

// USD per 1M tokens for the default model (developers.openai.com/api/docs/pricing, Oct 2026).
const PRICE = { input: 0.1, cachedInput: 0.01, output: 0.5 };

export const CAPS = {
  totalUsd: Number(process.env.BROOK_AI_TOTAL_USD ?? 3),
  dayUsd: Number(process.env.BROOK_AI_DAY_USD ?? 0.4),
  callerDayUsd: Number(process.env.BROOK_AI_CALLER_DAY_USD ?? 0.06),
  callerHourCalls: Number(process.env.BROOK_AI_CALLER_HOUR_CALLS ?? 120),
};

let client: OpenAI | null = null;
export function openai(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 20_000, maxRetries: 1 });
  return client;
}

interface Budget {
  total: number;
  day: number;
  bucketDay: number;
  bucketHourCalls: number;
}

/** null when a call may go ahead, otherwise the reason it may not. */
export async function budgetBlock(bucket: string): Promise<string | null> {
  if (!openai()) return "ai-not-configured";
  try {
    const b = await rpc<Budget>("brook_ai_budget", { p_bucket: bucket });
    if (Number(b.total) >= CAPS.totalUsd) return "budget-total";
    if (Number(b.day) >= CAPS.dayUsd) return "budget-day";
    if (Number(b.bucketDay) >= CAPS.callerDayUsd) return "budget-caller";
    if (Number(b.bucketHourCalls) >= CAPS.callerHourCalls) return "rate-caller";
    return null;
  } catch {
    return "budget-unavailable"; // fail closed: no ledger, no spending
  }
}

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { cached_tokens?: number } | null;
}

export function costOf(usage: Usage | undefined): number {
  if (!usage) return 0;
  const cached = usage.input_tokens_details?.cached_tokens ?? 0;
  const fresh = Math.max(0, (usage.input_tokens ?? 0) - cached);
  return (fresh * PRICE.input + cached * PRICE.cachedInput + (usage.output_tokens ?? 0) * PRICE.output) / 1e6;
}

export async function record(bucket: string, kind: "interpret" | "vision", usage: Usage | undefined) {
  try {
    await rpc("brook_ai_record", {
      p_bucket: bucket,
      p_kind: kind,
      p_in: usage?.input_tokens ?? 0,
      p_out: usage?.output_tokens ?? 0,
      p_cost: Number(costOf(usage).toFixed(6)),
    });
  } catch (err) {
    console.error("ledger write failed", err);
  }
}
