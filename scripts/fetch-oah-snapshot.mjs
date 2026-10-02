// Pulls a snapshot of OneAquaHealth's public data (api.enora-oah.eu) into
// src/data/oah so the app works offline and judges never wait on a slow API.
// Run: node scripts/fetch-oah-snapshot.mjs
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "https://api.enora-oah.eu";
const OUT = new URL("../src/data/oah/", import.meta.url);

async function get(path, attempt = 1) {
  try {
    const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`${res.status} ${path}`);
    return await res.json();
  } catch (err) {
    if (attempt < 3) return get(path, attempt + 1);
    console.warn("skip", path, err.message);
    return null;
  }
}

await mkdir(OUT, { recursive: true });
const fetchedAt = new Date().toISOString();

const [cities, sites, healthRisks, urban] = await Promise.all([
  get("/api/cities/all"),
  get("/api/sites/all"),
  get("/api/resilience-map/health-risks"),
  get("/api/resilience-map/urban-parameters"),
]);

const answerLists = {};
for (const list of [
  "channel_forms", "channel_types", "bank_types", "habitats", "fallen_biomass",
  "water_flows", "water_colors", "vegetation_types", "stream_assessments",
]) {
  answerLists[list] = await get(`/api/citizens/${list}`);
}

// Per-site lab results (biological quality classes, richness, nitrate).
const lab = {};
for (const site of sites ?? []) {
  const rows = await get(`/api/dashboards/city/${encodeURIComponent(site.code)}`);
  if (rows?.length) lab[site.code] = rows;
}

const write = (name, data) =>
  writeFile(new URL(name, OUT), JSON.stringify({ fetchedAt, source: BASE, data }, null, 1));

await write("cities.json", cities);
await write("sites.json", sites);
await write("health-risks.json", healthRisks);
await write("urban.json", urban);
await write("answer-lists.json", answerLists);
await write("lab.json", lab);
console.log(`sites ${sites?.length}, lab ${Object.keys(lab).length}, risks ${healthRisks?.length}, urban ${urban?.length}`);
