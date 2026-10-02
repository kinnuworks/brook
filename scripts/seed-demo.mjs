// Seeds SIMULATED checks so the research hub has something to show before
// real volunteers use Brook. Every row is stored with is_demo = true, shown
// as "simulated" in the hub, and never forwarded to any FHIR server.
//
// The simulation is grounded where it can be: answers lean on each site's
// real OneAquaHealth data (urban cover, lab classes), and the difficulty of
// each question is a stated assumption below — not a finding.
//
// Run: node scripts/seed-demo.mjs [count]   (needs .env.local)

import { readFile } from "node:fs/promises";

const env = Object.fromEntries(
  (await readFile(new URL("../.env.local", import.meta.url), "utf8"))
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { sites } = JSON.parse(await readFile(new URL("../src/data/oah/sites-compact.json", import.meta.url), "utf8"));

// Deterministic RNG so the demo is reproducible.
let seed = 20261002;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

// ASSUMED question difficulty for the simulation: [help, notSure, unclear-by-voice].
const DIFFICULTY = {
  channelForm: [0.22, 0.08, 0.1],
  bottomChannelType: [0.08, 0.05, 0.05],
  banksChannelType: [0.18, 0.06, 0.08],
  habitats: [0.3, 0.14, 0.12],
  fallenBiomassTypes: [0.1, 0.06, 0.06],
  waterFlow: [0.06, 0.03, 0.04],
  waterColor: [0.05, 0.03, 0.04],
  waterAbstraction: [0.2, 0.3, 0.06],
  hasDams: [0.12, 0.08, 0.04],
  pipes: [0.1, 0.18, 0.05],
  waterDischarge: [0.14, 0.34, 0.05],
  construction: [0.04, 0.04, 0.03],
  waterHeight: [0.16, 0.12, 0.14],
  imperviousAreasLeft: [0.34, 0.18, 0.1],
  imperviousAreasRight: [0.22, 0.14, 0.08],
  isVegetationCoveredLeft: [0.1, 0.05, 0.04],
  vegetationTypeLeft: [0.2, 0.08, 0.07],
  isVegetationCoveredRight: [0.08, 0.04, 0.04],
  vegetationTypeRight: [0.16, 0.07, 0.06],
  hasInvasivePlantSpecies: [0.26, 0.4, 0.05],
  recentVegetationCuts: [0.06, 0.12, 0.04],
  overallAssessment: [0.12, 0, 0.05],
  feelings: [0.05, 0.08, 0.06],
};
// ASSUMED share of photo suggestions people accept, per visual question.
const ACCEPT = {
  channelForm: 0.82, bottomChannelType: 0.86, banksChannelType: 0.74, habitats: 0.62, fallenBiomassTypes: 0.7,
  waterFlow: 0.8, waterColor: 0.88, hasDams: 0.9, pipes: 0.72, construction: 0.9,
  imperviousAreasLeft: 0.58, imperviousAreasRight: 0.6, isVegetationCoveredLeft: 0.84, vegetationTypeLeft: 0.71,
  isVegetationCoveredRight: 0.84, vegetationTypeRight: 0.7, recentVegetationCuts: 0.76,
};
const CITY_LANG = { CO: "pt", TO: "fr", GH: "nl", BE: "it", OS: "no" };

function siteAnswers(site) {
  const imp = site.urban?.impervious100m ?? 30;
  const band = (site.lab.macroinvertebrates ?? site.lab.diatoms ?? site.lab.fish)?.value;
  const poorLab = ["Poor", "Bad"].includes(band);
  const goodLab = ["High", "Good"].includes(band);
  const urban = imp > 35 || chance(0.25);
  const a = {};
  a.channelForm = pick(urban ? ["U", "U", "FLAT", "V"] : ["U", "V", "FLAT"]);
  a.bottomChannelType = urban && chance(0.35) ? "ART" : "NAT";
  a.banksChannelType = urban ? pick(["ART", "LAS", "LAS", "NAT"]) : pick(["NAT", "NAT", "LAS"]);
  a.habitats = ["SB", "SI", "SD", "RF", "AV"].filter(() => chance(urban ? 0.25 : 0.45));
  a.fallenBiomassTypes = ["FT", "FB", "FL"].filter(() => chance(urban ? 0.25 : 0.5));
  a.waterFlow = pick(["NOR", "NOR", "FAS", "STA"]);
  a.waterColor = poorLab ? pick(["MU", "CL", "FO", "MU"]) : pick(["CL", "CL", "CL", "MU"]);
  a.waterAbstraction = chance(0.1);
  a.hasDams = chance(0.25);
  if (a.hasDams) a.numberOfDams = 1 + Math.floor(rnd() * 3);
  a.pipes = chance(urban ? 0.35 : 0.1);
  a.waterDischarge = chance(poorLab ? 0.3 : 0.08);
  a.construction = chance(0.08);
  a.waterHeight = Math.round((0.1 + rnd() * 0.9) * 10) / 10;
  a.imperviousAreasLeft = chance(imp / 100 + 0.1);
  a.imperviousAreasRight = chance(imp / 100 + 0.05);
  a.isVegetationCoveredLeft = !a.imperviousAreasLeft || chance(0.4);
  if (a.isVegetationCoveredLeft) a.vegetationTypeLeft = pick(["H", "B", "T", "T"]);
  a.isVegetationCoveredRight = !a.imperviousAreasRight || chance(0.4);
  if (a.isVegetationCoveredRight) a.vegetationTypeRight = pick(["H", "B", "T", "T"]);
  a.hasInvasivePlantSpecies = chance(0.3);
  if (a.hasInvasivePlantSpecies) a.invasivePlantSpecies = pick(["Japanese knotweed", "Giant cane", "Acacia", "Himalayan balsam", "Tree of heaven"]);
  a.recentVegetationCuts = chance(0.2);
  const score = (a.bottomChannelType === "NAT") + (a.banksChannelType === "NAT") + !a.pipes + !a.waterDischarge + (a.waterColor === "CL") + (goodLab ? 1 : 0) - (poorLab ? 1 : 0);
  a.overallAssessment = score >= 5 ? "GOOD" : score >= 3 ? "MODERATE" : "POOR";
  const tone = a.overallAssessment === "GOOD" ? 1 : a.overallAssessment === "MODERATE" ? 0.5 : 0;
  const clamp = (v) => Math.max(0, Math.min(5, Math.round(v)));
  a.feelings = {
    joy: clamp(1.5 + tone * 2.5 + (rnd() - 0.5) * 2),
    serenity: clamp(1.5 + tone * 3 + (rnd() - 0.5) * 2),
    anger: clamp(2.5 - tone * 2.5 + (rnd() - 0.5) * 2),
    fear: clamp(1 - tone + (rnd() - 0.5) * 1.5),
  };
  return a;
}

function simulate(site, i, total) {
  const lang = chance(0.75) ? CITY_LANG[site.city] : "en";
  const mode = pick(["voice", "voice", "voice", "tap", "tap", "mixed", "mixed"]);
  const photos = chance(0.82);
  const answers = siteAnswers(site);
  const provenance = {};
  const events = [];
  let t = 30_000 + rnd() * 40_000;
  for (const [qid, value] of Object.entries(answers)) {
    const [help, notSure, unclear] = DIFFICULTY[qid] ?? [0.05, 0.05, 0.05];
    events.push({ qid, type: "asked", t: Math.round(t) });
    const voice = mode === "voice" || (mode === "mixed" && chance(0.5));
    if (photos && ACCEPT[qid] !== undefined && chance(0.75)) {
      events.push({ qid, type: "suggestionShown", t: Math.round(t + 500) });
      const ok = chance(ACCEPT[qid]);
      events.push({ qid, type: ok ? "suggestionAccepted" : "suggestionRejected", via: voice ? "voice" : "tap", t: Math.round(t + 4000) });
      provenance[qid] = ok ? "photo-confirmed" : "photo-corrected";
    } else {
      provenance[qid] = voice ? (chance(0.12) ? "voice-ai" : "voice") : "tap";
    }
    if (chance(help)) events.push({ qid, type: "help", via: voice ? "voice" : "tap", t: Math.round(t + 3000) });
    if (voice && chance(unclear)) events.push({ qid, type: "unclear", via: "voice", t: Math.round(t + 5000) });
    let finalValue = value;
    if (qid !== "overallAssessment" && chance(notSure)) {
      events.push({ qid, type: "notSure", via: voice ? "voice" : "tap", t: Math.round(t + 6000) });
      finalValue = qid === "feelings" ? {} : null;
    }
    answers[qid] = finalValue;
    const ms = 4000 + rnd() * 14000 * (1 + help * 3);
    t += ms;
    events.push({ qid, type: "answered", via: voice ? "voice" : "tap", ms: Math.round(ms), t: Math.round(t) });
  }
  // OneAquaHealth's submission body.
  const dto = { latitude: site.lat, longitude: site.lon, researchSite: site.code, overallAssessment: answers.overallAssessment };
  for (const [k, v] of Object.entries(answers)) {
    if (k === "overallAssessment" || k === "feelings") continue;
    if (v === null && (k === "habitats" || k === "fallenBiomassTypes")) continue; // "not sure" lists are left out, as Brook does
    dto[k] = v;
  }
  for (const [k, v] of Object.entries(answers.feelings ?? {})) dto[k] = v;
  const daysAgo = Math.floor((i / total) * 42 + rnd() * 3);
  return {
    is_demo: true,
    site_code: site.code,
    site_name: site.name,
    city: site.cityName,
    lat: site.lat,
    lon: site.lon,
    custom_site: false,
    lang,
    mode,
    duration_s: Math.round(t / 1000),
    dto,
    provenance,
    events,
    second_looks: [],
    weather: null,
    client_id: `sim-${Math.floor(rnd() * 40)}`,
    _createdDaysAgo: daysAgo,
  };
}

const count = Number(process.argv[2] ?? 72);
const chosen = Array.from({ length: count }, () => pick(sites));
let ok = 0;
for (let i = 0; i < chosen.length; i++) {
  const row = simulate(chosen[i], i, chosen.length);
  const { _createdDaysAgo, ...p } = row;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/brook_insert_submission`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ p_secret: env.BROOK_SERVER_SECRET, p }),
  });
  if (res.ok) ok++;
  else console.error(res.status, (await res.text()).slice(0, 200));
}
console.log(`seeded ${ok}/${count} simulated checks`);
