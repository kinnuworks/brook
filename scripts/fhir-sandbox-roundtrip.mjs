// A real round trip on OneAquaHealth's public FHIR sandbox (HAPI, R4): post
// sample bundle (b), the verified demo check at O17, as a transaction, then
// read the Location and one Observation back and compare them with what was
// sent, and find the Observation again by search.
//
//   node scripts/fhir-sandbox-roundtrip.mjs      → docs/evidence/sandbox-roundtrip.json
//
// Only a bundle whose every resource carries Brook's demo tag is ever posted.
// Re-running is safe: every entry is a PUT to a fixed id, so a second run
// updates (200) rather than duplicates.

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.OAH_FHIR_BASE || "https://sandbox.hl7europe.eu/oneaquahealth/fhir";
const FILE = "docs/evidence/bundles/b-verified-check-o17.json";
const TAG = "brook-citizen-check";
const OAH_CODES = "http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu";
const headers = { "content-type": "application/fhir+json", accept: "application/fhir+json", "cache-control": "no-cache" };

const bundle = JSON.parse(await readFile(join(ROOT, FILE), "utf8"));
const sent = bundle.entry.map((e) => e.resource);
if (bundle.type !== "transaction" || !sent.every((r) => r.meta?.tag?.some((t) => t.code === TAG))) {
  throw new Error(`Refusing to post: every resource must carry the ${TAG} tag`);
}

async function call(method, url, body) {
  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30_000) });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, ok: res.ok, ms: Date.now() - started, json, text: json ? undefined : text.slice(0, 400) };
  } catch (err) {
    return { status: 0, ok: false, ms: Date.now() - started, error: String(err?.message ?? err).slice(0, 200) };
  }
}

const pick = (r) => ({
  resourceType: r.resourceType,
  id: r.id,
  status: r.status,
  profile: r.meta?.profile ?? [],
  tag: (r.meta?.tag ?? []).map((t) => t.code),
  security: (r.meta?.security ?? []).map((t) => t.code),
  code: r.code?.coding?.map((c) => `${c.system}|${c.code}`),
  subject: r.subject?.reference,
  performer: r.performer?.map((p) => p.display ?? p.reference),
  components: r.component?.length,
  answerSources: r.component?.map((c) => c.extension?.find((x) => x.url.endsWith("/answer-source"))?.valueCode ?? null),
  identifier: r.identifier?.map((i) => `${i.system}|${i.value}`),
  position: r.position,
});

const meta = await call("GET", `${BASE}/metadata?_summary=true`);
const report = {
  server: BASE,
  software: meta.json ? `${meta.json.software?.name ?? "?"} ${meta.json.software?.version ?? ""}`.trim() : null,
  fhirVersion: meta.json?.fhirVersion ?? null,
  ran: new Date().toISOString(),
  request: {
    method: "POST",
    url: BASE,
    headers,
    body: FILE,
    entries: sent.length,
    resources: Object.entries(sent.reduce((n, r) => ({ ...n, [r.resourceType]: (n[r.resourceType] ?? 0) + 1 }), {})).map(([t, n]) => `${n} ${t}`),
  },
};

const post = await call("POST", BASE, bundle);
report.response = {
  status: post.status,
  ms: post.ms,
  ...(post.error ? { error: post.error } : {}),
  ...(post.text ? { body: post.text } : {}),
  ...(post.json?.resourceType === "OperationOutcome" ? { outcome: post.json.issue } : {}),
  entries: (post.json?.entry ?? []).map((e) => ({ status: e.response?.status, location: e.response?.location })),
};

if (post.ok) {
  const location = sent.find((r) => r.resourceType === "Location");
  const hydrology = sent.find((r) => r.resourceType === "Observation" && r.code.coding[0].code === "hydrology");
  report.readBack = [];
  for (const original of [location, hydrology]) {
    const got = await call("GET", `${BASE}/${original.resourceType}/${original.id}`);
    const stored = got.json && got.json.resourceType === original.resourceType ? got.json : null;
    const a = pick(original);
    const b = stored ? pick(stored) : null;
    report.readBack.push({
      url: `${BASE}/${original.resourceType}/${original.id}`,
      status: got.status,
      versionId: stored?.meta?.versionId ?? null,
      lastUpdated: stored?.meta?.lastUpdated ?? null,
      sameAsSent: b ? JSON.stringify(a) === JSON.stringify(b) : false,
      stored: b,
    });
  }
  const search = await call(
    "GET",
    `${BASE}/Observation?subject=Location/${location.id}&code=${encodeURIComponent(`${OAH_CODES}|hydrology`)}&_tag=${encodeURIComponent(`${location.meta.tag[0].system}|${TAG}`)}&_elements=id,status`,
  );
  report.search = {
    query: `Observation?subject=Location/${location.id}&code=${OAH_CODES}|hydrology&_tag=…|${TAG}`,
    status: search.status,
    total: search.json?.total ?? null,
    found: (search.json?.entry ?? []).map((e) => `${e.resource.resourceType}/${e.resource.id}`),
    includesSent: (search.json?.entry ?? []).some((e) => e.resource.id === hydrology.id),
  };
}

await writeFile(join(ROOT, "docs", "evidence", "sandbox-roundtrip.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ post: report.response.status, entries: report.response.entries.length, readBack: report.readBack?.map((r) => [r.status, r.sameAsSent]), search: report.search }, null, 2));
process.exit(post.ok ? 0 : 1);
