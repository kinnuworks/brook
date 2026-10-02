// Photo-suggestion evaluation: sends each labelled photo (tests/eval/photos.json)
// through Brook's real /api/vision endpoint and compares the suggestions with
// the reference labels. Answers the question that matters for the UI: when
// Brook offers a suggestion, how often is it right — per question and per
// confidence level? Photos marked notStream check the other side: Brook should
// say there is no stream and suggest nothing. Writes docs/evidence/vision-eval.json.
//
// The photos are real stream photos from Wikimedia Commons (credits in
// photos.json), none of them used while building Brook. Labels cover only what
// a photo plainly shows; left/right answers are labelled only when both banks
// agree, because one photo can't show which way the water flows.
//
// Needs the dev server running with OPENAI_API_KEY set. Cost: ~0.1 ¢ per photo.
// Run: node scripts/eval-vision.mjs [baseUrl]

import { readFile, writeFile, mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "http://localhost:5173";
const photos = JSON.parse(await readFile("tests/eval/photos.json", "utf8"));
const same = (a, b) => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x) => b.includes(x)) : a === b);

async function look(p) {
  const b64 = (await readFile(p.file)).toString("base64");
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${BASE}/api/vision`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE },
        body: JSON.stringify({ lang: "en", photos: [{ slot: "upstream", dataUrl: `data:image/jpeg;base64,${b64}` }] }),
      });
      const out = await res.json();
      if (out.fallback) throw new Error(`AI unavailable: ${out.reason}`);
      if (!res.ok) throw new Error(`${p.id}: HTTP ${res.status} ${JSON.stringify(out)}`);
      return out;
    } catch (err) {
      if (attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const results = [];
let model;
for (const p of photos) {
  const out = await look(p);
  model ??= out.model;
  results.push({ id: p.id, notStream: Boolean(p.notStream), labels: p.labels, suggestions: out.suggestions ?? {}, isStream: out.isStream });
  process.stdout.write(".");
}
console.log();

const offeredOf = (r) => Object.entries(r.suggestions).filter(([, s]) => s.confidence !== "low");

// Stream photos: per-question coverage and precision.
const fields = {};
const misses = [];
for (const r of results.filter((r) => !r.notStream)) {
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
      else misses.push({ photo: r.id, field, label: truth, suggested: s.value, confidence: s.confidence, evidence: s.evidence });
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
const byConfidence = { medium: [0, 0], high: [0, 0] };
for (const f of Object.values(fields)) for (const c of ["medium", "high"]) byConfidence[c] = [byConfidence[c][0] + f.byConfidence[c][0], byConfidence[c][1] + f.byConfidence[c][1]];

// Unlabelled suggestions on stream photos are not scored (we only label what is
// plainly visible), but they are counted so nothing is hidden.
const unscored = results.filter((r) => !r.notStream).reduce((a, r) => a + offeredOf(r).filter(([k]) => !(k in r.labels)).length, 0);

const streams = results.filter((r) => !r.notStream);
const others = results.filter((r) => r.notStream);
const overall = {
  streamPhotos: streams.length,
  labelled,
  offered,
  coverage: +(offered / labelled).toFixed(2),
  precision: +(correct / offered).toFixed(2),
  wrong: offered - correct,
  byConfidence: Object.fromEntries(Object.entries(byConfidence).map(([c, [n, ok]]) => [c, { offered: n, correct: ok, precision: n ? +(ok / n).toFixed(2) : null }])),
  unscoredSuggestions: unscored,
  streamsRecognised: streams.filter((r) => r.isStream).length,
  notStreamPhotos: others.length,
  notStreamRecognised: others.filter((r) => r.isStream === false).length,
  suggestionsOnNotStreamPhotos: others.reduce((a, r) => a + offeredOf(r).length, 0),
};

await mkdir("docs/evidence", { recursive: true });
await writeFile(
  "docs/evidence/vision-eval.json",
  JSON.stringify({ at: new Date().toISOString(), model, photos: results.length, overall, byField: summary, misses, results }, null, 2),
);
console.table(Object.fromEntries(Object.entries(summary).map(([k, v]) => [k, { labelled: v.labelled, offered: v.offered, coverage: v.coverage, precision: v.precision }])));
console.log(
  `stream photos: offered ${offered}/${labelled} labelled answers (coverage ${overall.coverage}), precision ${overall.precision}, wrong ${overall.wrong}; ` +
    `recognised as streams ${overall.streamsRecognised}/${streams.length}; not-stream photos recognised ${overall.notStreamRecognised}/${others.length}, suggestions on them ${overall.suggestionsOnNotStreamPhotos}`,
);
if (misses.length) console.table(misses.map((m) => ({ photo: m.photo, field: m.field, label: JSON.stringify(m.label), suggested: JSON.stringify(m.suggested), confidence: m.confidence })));
