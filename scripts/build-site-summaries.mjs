// Turns the raw OneAquaHealth snapshot into one compact record per research
// site: where it is, what the lab last found there, its health-risk scores
// and a few urban context figures. Run after fetch-oah-snapshot.mjs.
import { readFile, writeFile } from "node:fs/promises";

const dir = new URL("../src/data/oah/", import.meta.url);
const load = async (name) => JSON.parse(await readFile(new URL(name, dir), "utf8"));

const { fetchedAt, data: sites } = await load("sites.json");
const { data: lab } = await load("lab.json");
const { data: risks } = await load("health-risks.json");
const { data: urban } = await load("urban.json");

const isBlank = (v) => v === null || v === undefined || v === "";
const round = (v, d = 2) => (isBlank(v) ? null : Math.round(v * 10 ** d) / 10 ** d);

/** Latest non-empty value of `field` across a site's lab rows. */
function latest(rows, field, extra) {
  const hits = rows
    .filter((r) => !isBlank(r[field]))
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!hits.length) return null;
  const r = hits[0];
  return { value: r[field], date: r.date.slice(0, 10), ...(extra ? { richness: r[extra] } : {}) };
}

const out = sites.map((s) => {
  const rows = lab[s.code] ?? [];
  const risk = risks
    .filter((r) => r.researchSiteCode === s.code)
    .sort((a, b) => (b.samplingDate ?? "").localeCompare(a.samplingDate ?? ""))[0];
  const u = urban.find((r) => r.researchSiteCode === s.code);
  return {
    code: s.code,
    name: s.name?.trim() || s.code,
    city: s.city.id,
    cityName: s.city.name,
    lat: s.latitude,
    lon: s.longitude,
    alt: s.altitude ?? null,
    lab: {
      macroinvertebrates: latest(rows, "macroinvertebratesQuality", "macroinvertebratesRichness"),
      diatoms: latest(rows, "diatomsQuality", "diatomsRichness"),
      fish: latest(rows, "fishQuality", "fishRichness"),
      nitrate: latest(rows, "nitrate"),
    },
    risk: risk
      ? {
          date: risk.samplingDate?.slice(0, 10) ?? null,
          pathogen: round(risk.scaledPathogenRisk),
          fecal: round(risk.scaledFecalRisk),
          arg: round(risk.scaledArgRisk),
          health: round(risk.healthRiskScore),
        }
      : null,
    urban: u
      ? {
          impervious100m: round(u.imperviousPct100m, 1),
          impervious500m: round(u.imperviousPct500m, 1),
          vegCover100m: round(u.vegCoverFrac100m, 1),
          urban500m: round(u.urbanPct500m, 1),
          distSewageM: round(u.distanceToSewageStations, 0),
          distHospitalM: round(u.distanceToHospitals, 0),
        }
      : null,
  };
});

await writeFile(
  new URL("sites-compact.json", dir),
  JSON.stringify({ fetchedAt, source: "https://api.enora-oah.eu", sites: out }),
);
const withLab = out.filter((s) => Object.values(s.lab).some(Boolean)).length;
console.log(`${out.length} sites, ${withLab} with lab results, ${out.filter((s) => s.risk).length} with risk scores`);
