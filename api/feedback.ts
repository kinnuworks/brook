// POST /api/feedback — a System Usability Scale questionnaire after a check.
// GET — the summary the research hub shows (score is computed in the database).

import { dbConfigured, rpc } from "./_lib/db.js";
import { fail, json, readJson, sameOrigin } from "./_lib/http.js";

interface Body {
  submissionId?: string | null;
  lang: string;
  answers: number[];
  trial?: boolean;
  comment?: string;
  clientId?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return fail(403, "forbidden");
  if (!dbConfigured()) return fail(503, "storage-not-configured");
  const b = await readJson<Body>(request, 4000);
  if (!b || !Array.isArray(b.answers) || b.answers.length !== 10 || !b.answers.every((a) => Number.isInteger(a) && a >= 1 && a <= 5)) {
    return fail(400, "bad-answers");
  }
  try {
    const id = await rpc<string>("brook_add_feedback", {
      p: {
        submission_id: b.submissionId && UUID.test(b.submissionId) ? b.submissionId : "",
        lang: ["en", "pt", "fr", "it", "nl", "no", "el"].includes(b.lang) ? b.lang : "en",
        answers: b.answers,
        trial: Boolean(b.trial),
        comment: typeof b.comment === "string" ? b.comment.slice(0, 1000) : "",
        client_id: typeof b.clientId === "string" ? b.clientId.slice(0, 64) : null,
      },
    });
    return json({ id });
  } catch (err) {
    console.error("feedback failed", err);
    return fail(502, "storage-unavailable");
  }
}

export async function GET(): Promise<Response> {
  if (!dbConfigured()) return json({ n: 0 });
  try {
    return json(await rpc("brook_feedback_summary", {}), 200, { "cache-control": "public, s-maxage=30" });
  } catch {
    return fail(502, "storage-unavailable");
  }
}
