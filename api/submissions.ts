// POST /api/submissions — stores a finished check, the photos the citizen
// chose to share, and forwards the FHIR bundle to OneAquaHealth's FHIR
// sandbox (HL7 Europe). GET — the list the research hub reads.

import { dbConfigured, rpc } from "./_lib/db.js";
import { fail, json, readJson, sameOrigin } from "./_lib/http.js";
import { LANGS, QUESTION_BY_ID, isValidAnswer, type QuestionId } from "../src/core/protocol.js";

const SANDBOX = process.env.OAH_FHIR_BASE || "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
const ALLOWED_TYPES = new Set(["Location", "QuestionnaireResponse", "Observation", "Device", "Provenance"]);
const BROOK_TAG_CODE = "brook-citizen-check";

interface Body {
  submission: {
    is_demo?: boolean;
    site_code: string;
    site_name: string;
    city?: string | null;
    lat: number;
    lon: number;
    custom_site?: boolean;
    lang: string;
    mode: "voice" | "tap" | "mixed";
    duration_s?: number;
    dto: Record<string, unknown>;
    provenance?: Record<string, string>;
    events?: unknown[];
    second_looks?: unknown[];
    weather?: unknown;
    client_id?: string;
  };
  fhir?: { resourceType?: string; type?: string; entry?: { resource?: { resourceType?: string; meta?: { tag?: { code?: string }[] } } }[] };
  photos?: { slot: string; b64: string }[];
}

function checkDto(dto: Record<string, unknown>): string | null {
  if (typeof dto.latitude !== "number" || typeof dto.longitude !== "number") return "dto-location";
  if (typeof dto.researchSite !== "string" || !dto.researchSite) return "dto-site";
  if (!["GOOD", "MODERATE", "POOR"].includes(String(dto.overallAssessment))) return "dto-overall";
  for (const [key, value] of Object.entries(dto)) {
    if (["latitude", "longitude", "researchSite", "overallAssessment"].includes(key)) continue;
    if (["joy", "serenity", "anger", "fear"].includes(key)) {
      if (!(Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 5)) return `dto-${key}`;
      continue;
    }
    const q = QUESTION_BY_ID[key as QuestionId];
    if (!q) return `dto-unknown-${key}`;
    if (!isValidAnswer(q, value)) return `dto-${key}`;
  }
  return null;
}

function checkBundle(b: Body["fhir"]): boolean {
  if (!b || b.resourceType !== "Bundle" || b.type !== "transaction" || !Array.isArray(b.entry)) return false;
  if (b.entry.length > 30) return false;
  return b.entry.every(
    (e) => e.resource && ALLOWED_TYPES.has(String(e.resource.resourceType)) && e.resource.meta?.tag?.some((t) => t.code === BROOK_TAG_CODE),
  );
}

async function forwardToSandbox(bundle: unknown) {
  const started = Date.now();
  try {
    const res = await fetch(SANDBOX, {
      method: "POST",
      headers: { "content-type": "application/fhir+json", accept: "application/fhir+json", "cache-control": "no-cache" },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(9000),
    });
    const text = await res.text();
    let locations: string[] = [];
    try {
      const parsed = JSON.parse(text) as { entry?: { response?: { location?: string; status?: string } }[] };
      locations = (parsed.entry ?? []).map((e) => e.response?.location ?? "").filter(Boolean);
    } catch {
      /* non-JSON error page */
    }
    return { ok: res.ok, status: res.status, server: SANDBOX, locations, ms: Date.now() - started, at: new Date().toISOString() };
  } catch (err) {
    return { ok: false, status: 0, server: SANDBOX, error: String((err as Error).message).slice(0, 120), ms: Date.now() - started, at: new Date().toISOString() };
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return fail(403, "forbidden");
  if (!dbConfigured()) return fail(503, "storage-not-configured");
  const body = await readJson<Body>(request, 2_000_000);
  const s = body?.submission;
  if (!s || typeof s !== "object") return fail(400, "bad-request");
  if (!(LANGS as readonly string[]).includes(s.lang)) return fail(400, "bad-lang");
  if (!["voice", "tap", "mixed"].includes(s.mode)) return fail(400, "bad-mode");
  if (typeof s.lat !== "number" || typeof s.lon !== "number" || Math.abs(s.lat) > 90 || Math.abs(s.lon) > 180) return fail(400, "bad-location");
  const dtoError = checkDto(s.dto ?? {});
  if (dtoError) return fail(400, dtoError);
  if (JSON.stringify(s.events ?? []).length > 60_000) return fail(400, "events-too-large");

  const id = await rpc<string>("brook_insert_submission", {
    p: {
      is_demo: Boolean(s.is_demo),
      site_code: String(s.site_code).slice(0, 64),
      site_name: String(s.site_name).slice(0, 160),
      city: s.city ?? null,
      lat: s.lat,
      lon: s.lon,
      custom_site: Boolean(s.custom_site),
      lang: s.lang,
      mode: s.mode,
      duration_s: Math.max(0, Math.min(7200, Math.round(Number(s.duration_s ?? 0)))),
      dto: s.dto,
      provenance: s.provenance ?? {},
      events: s.events ?? [],
      second_looks: s.second_looks ?? [],
      weather: s.weather ?? null,
      client_id: typeof s.client_id === "string" ? s.client_id.slice(0, 64) : null,
    },
  });

  const photoIds: string[] = [];
  for (const p of (body!.photos ?? []).slice(0, 4)) {
    if (!["upstream", "downstream", "surroundings", "biodiversity"].includes(p.slot)) continue;
    if (typeof p.b64 !== "string" || p.b64.length > 520_000 || !/^[A-Za-z0-9+/=]+$/.test(p.b64)) continue;
    try {
      photoIds.push(await rpc<string>("brook_add_photo", { p_submission: id, p_slot: p.slot, p_jpeg_b64: p.b64 }));
    } catch (err) {
      console.error("photo store failed", err);
    }
  }

  let fhir: Awaited<ReturnType<typeof forwardToSandbox>> | null = null;
  if (body!.fhir && checkBundle(body!.fhir) && process.env.BROOK_FHIR_FORWARD !== "off") {
    fhir = await forwardToSandbox(body!.fhir);
    try {
      await rpc("brook_set_fhir_result", { p_id: id, p_result: fhir });
    } catch (err) {
      console.error("fhir result store failed", err);
    }
  }

  return json({ id, photos: photoIds.length, fhir });
}

export async function GET(request: Request): Promise<Response> {
  if (!dbConfigured()) return json({ submissions: [], configured: false });
  const limit = Math.min(1000, Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 500)));
  try {
    const submissions = await rpc<unknown[]>("brook_list_submissions", { p_limit: limit });
    return json({ submissions, configured: true }, 200, { "cache-control": "public, s-maxage=10, stale-while-revalidate=30" });
  } catch (err) {
    console.error("list failed", err);
    return fail(502, "storage-unavailable");
  }
}
