// GET /api/status — whether the optional AI helper is available, so the app
// can tell people upfront instead of failing mid-check.

import { CAPS, MODEL, openai } from "./_lib/ai.js";
import { dbConfigured, rpc } from "./_lib/db.js";
import { json } from "./_lib/http.js";

export async function GET(): Promise<Response> {
  let spent: number | null = null;
  try {
    if (dbConfigured()) spent = Number((await rpc<{ total: number }>("brook_ai_budget", { p_bucket: "status" })).total);
  } catch {
    spent = null;
  }
  const ai = Boolean(openai()) && spent !== null && spent < CAPS.totalUsd;
  return json({ ai, model: ai ? MODEL() : null, storage: dbConfigured() }, 200, { "cache-control": "public, s-maxage=30" });
}
