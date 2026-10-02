// Photo-suggestion evaluation: sends each labelled photo (tests/eval/photos.json)
// through Brook's real /api/vision endpoint and compares the suggestions with
// the reference labels. Answers the question that matters for the UI: when
// Brook offers a suggestion, how often is it right — per question and per
// confidence level? Writes docs/evidence/vision-eval.json.
//
// Needs the dev server running with OPENAI_API_KEY set. Cost: ~0.1 ¢ per photo.
// Run: node scripts/eval-vision.mjs [baseUrl]

import { readFile, writeFile, mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:5173";
const photos = JSON.parse(await readFile("tests/eval/photos.json", "utf8"));
const same = (a, b) => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x) => b.includes(x)) : a === b);

const results = [];
for (const p of photos) {
  const b64 = (await readFile(p.file)).toString("base64");
  const res = await fetch(`${BASE}/api/vision`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ lang: "en", photos: [{ slot: "upstream", dataUrl: `data:image/jpeg;base64,${b64}` }] }),
  });
  const out = await res.json();
  if (out.fallback) {
    console.error("AI unavailable:", out.reason);
    process.exit(1);
  }
  results.push({ id: p.id, labels: p.labels, suggestions: out.suggestions ?? {}, isStream: out.isStream });
  process.stdout.write(".");
}
console.log();

const fields = {};
for (const r of results) {
  for (const [field, truth] of Object.entries(r.labels)) {
    const f = (fields[field] ??= { labelled: 0, suggested: 0, correct: 0, byConfidence: { low: [0, 0], medium: [0, 0], high: [0, 0] } });
    f.labelled++;
    const s = r.suggestions[field];
    if (!s) continue;
    const ok = same(s.value, truth);
    f.byConfidence[s.confidence][0]++;
    if (ok) f.byConfidence[s.confidence][1]++;
    if (s.confidence !== "low") {
      f.suggested++;
      if (ok) f.correct++;
    }
  }
}
const summary = Object.fromEntries(
  Object.entries(fields).map(([k, f]) => [
    k,
    { labelled: f.labelled, offered: f.suggested, coverage: +(f.suggested / f.labelled).toFixed(2), precision: f.suggested ? +(f.correct / f.suggested).toFixed(2) : null, byConfidence: f.byConfidence },
  ]),
);
const offered = Object.values(fields).reduce((a, f) => a + f.suggested, 0);
const correct = Object.values(fields).reduce((a, f) => a + f.correct, 0);
const labelled = Object.values(fields).reduce((a, f) => a + f.labelled, 0);
await mkdir("docs/evidence", { recursive: true });
await writeFile(
  "docs/evidence/vision-eval.json",
  JSON.stringify({ at: new Date().toISOString(), photos: results.length, overall: { labelled, offered, coverage: +(offered / labelled).toFixed(2), precision: +(correct / offered).toFixed(2) }, byField: summary, results }, null, 2),
);
console.table(Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, { labelled: v.labelled, offered: v.offered, coverage: v.coverage, precision: v.precision }])));
console.log(`overall: offered ${offered}/${labelled} labelled answers, precision ${(correct / offered).toFixed(2)}`);
