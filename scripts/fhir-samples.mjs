// Sample FHIR bundles for the conformance evidence, built by the app's own
// bundle builder (src/core/fhir.ts) from realistic, synthetic checks.
//
//   npx --yes tsx scripts/fhir-samples.mjs     → writes docs/evidence/bundles/
//
// a  a citizen's check at OneAquaHealth site O17 (Oslo), as submitted:
//    preliminary, with photo suggestions confirmed and corrected, an AI-read
//    reply and one "not sure"
// b  the same check after a researcher verified it: final, OAH profiles claimed
// c  a check at a stream the volunteer added themselves, tap and voice only
// broken-*  copies of a/b with one deliberate fault each; the validator must reject them
//           (an unknown answer code, a final Observation without performer, a
//           preliminary one claiming the OAH profile, a form answer of the wrong type)
// gap-*     probes of the IG itself (see docs/FHIR.md)
//
// manifest.json records what each file is expected to do, for scripts/fhir-validate.mjs.

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BROOK_QUESTIONNAIRE, buildBundle, OAH_INDICATOR_PROFILE } from "../src/core/fhir.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const BUNDLES_DIR = join(ROOT, "docs", "evidence", "bundles");

const pseudonym = (clientId) => createHash("sha256").update(`brook:${clientId}`).digest("hex").slice(0, 16);

const { sites } = JSON.parse(await readFile(join(ROOT, "src", "data", "oah", "sites-compact.json"), "utf8"));
const o17 = sites.find((s) => s.code === "O17");
if (!o17) throw new Error("Site O17 missing from the OneAquaHealth snapshot");

/** (a) A citizen's check at O17 "Alna – Bryn stasjon", as submitted. */
export const CHECK_A = {
  id: "5b0e8c1e-2f4a-4c7e-9d3b-6a1f0c2e7d41",
  site: { code: o17.code, name: o17.name, lat: o17.lat, lon: o17.lon, city: o17.cityName },
  answers: {
    channelForm: "U",
    bottomChannelType: "NAT",
    banksChannelType: "LAS",
    habitats: ["SD", "RF"],
    fallenBiomassTypes: ["FB", "FL"],
    waterFlow: "NOR",
    waterColor: "MU",
    waterAbstraction: false,
    hasDams: true,
    numberOfDams: 1,
    pipes: true,
    waterDischarge: null,
    construction: false,
    waterHeight: 0.4,
    imperviousAreasLeft: true,
    imperviousAreasRight: false,
    isVegetationCoveredLeft: true,
    vegetationTypeLeft: "B",
    isVegetationCoveredRight: true,
    vegetationTypeRight: "T",
    hasInvasivePlantSpecies: true,
    invasivePlantSpecies: "Japanese knotweed by the footbridge",
    recentVegetationCuts: false,
    overallAssessment: "MODERATE",
    feelings: { joy: 3, serenity: 3, anger: 1, fear: 0 },
  },
  sources: {
    channelForm: "photo-confirmed",
    bottomChannelType: "photo-confirmed",
    banksChannelType: "photo-corrected",
    habitats: "photo-confirmed",
    fallenBiomassTypes: "tap",
    waterFlow: "photo-confirmed",
    waterColor: "photo-corrected",
    waterAbstraction: "voice",
    hasDams: "photo-confirmed",
    numberOfDams: "voice",
    pipes: "tap",
    waterDischarge: "voice",
    construction: "photo-confirmed",
    waterHeight: "voice",
    imperviousAreasLeft: "photo-corrected",
    imperviousAreasRight: "photo-confirmed",
    isVegetationCoveredLeft: "photo-confirmed",
    vegetationTypeLeft: "tap",
    isVegetationCoveredRight: "photo-confirmed",
    vegetationTypeRight: "photo-confirmed",
    hasInvasivePlantSpecies: "voice",
    invasivePlantSpecies: "voice",
    recentVegetationCuts: "tap",
    overallAssessment: "tap",
    feelings: "voice-ai",
  },
  startedAt: "2026-10-01T07:42:10.000Z",
  submittedAt: "2026-10-01T07:49:55.000Z",
  lang: "en",
  citizenRef: pseudonym("demo-volunteer-oslo"),
  aiModel: "gpt-6-luna",
};

/** (b) The same check, verified by a researcher the next morning. */
export const CHECK_B = { ...CHECK_A, verifiedBy: "OneAquaHealth reviewer (demo)", verifiedAt: "2026-10-02T09:15:00.000Z" };

/** (c) A stream the volunteer added themselves, in Coimbra, answered by tap and voice only. */
export const CHECK_C = {
  id: "9e4d7a20-61b3-4f58-8c0a-2d5e9b1f3c77",
  site: { code: "user-7c2d9e10", name: "Ribeira de Coselhas, behind the school", lat: 40.2229, lon: -8.4167, custom: true },
  answers: {
    channelForm: "V",
    bottomChannelType: "NAT",
    banksChannelType: "NAT",
    habitats: [],
    fallenBiomassTypes: ["FT", "FL"],
    waterFlow: "FAS",
    waterColor: "CL",
    waterAbstraction: null,
    hasDams: false,
    pipes: false,
    waterDischarge: false,
    construction: false,
    waterHeight: 0.2,
    imperviousAreasLeft: false,
    imperviousAreasRight: null,
    isVegetationCoveredLeft: true,
    vegetationTypeLeft: "T",
    isVegetationCoveredRight: false,
    hasInvasivePlantSpecies: null,
    recentVegetationCuts: false,
    overallAssessment: "GOOD",
    feelings: { joy: 4, serenity: 5, anger: 0, fear: 0 },
  },
  sources: {
    channelForm: "tap",
    bottomChannelType: "voice",
    banksChannelType: "voice",
    habitats: "voice",
    fallenBiomassTypes: "tap",
    waterFlow: "voice",
    waterColor: "voice",
    waterAbstraction: "voice",
    hasDams: "tap",
    pipes: "tap",
    waterDischarge: "tap",
    construction: "tap",
    waterHeight: "tap",
    imperviousAreasLeft: "voice",
    imperviousAreasRight: "voice",
    isVegetationCoveredLeft: "tap",
    vegetationTypeLeft: "voice",
    isVegetationCoveredRight: "tap",
    hasInvasivePlantSpecies: "voice",
    recentVegetationCuts: "tap",
    overallAssessment: "voice",
    feelings: "tap",
  },
  startedAt: "2026-09-30T16:05:00.000Z",
  submittedAt: "2026-09-30T16:11:42.000Z",
  lang: "pt",
  citizenRef: pseudonym("demo-volunteer-coimbra"),
  aiModel: null,
};

const clone = (v) => structuredClone(v);
const resources = (bundle) => bundle.entry.map((e) => e.resource);
const firstObservation = (bundle, code) => resources(bundle).find((r) => r.resourceType === "Observation" && r.code.coding[0].code === code);

export function buildSamples() {
  const a = buildBundle(CHECK_A);
  const b = buildBundle(CHECK_B);
  const c = buildBundle(CHECK_C);

  const unknownCode = clone(a);
  const morphology = firstObservation(unknownCode, "morophology");
  morphology.component.find((c) => c.code.coding[0].code === "channelForm").valueCodeableConcept.coding[0].code = "channelForm.W";

  const noPerformer = clone(b);
  delete firstObservation(noPerformer, "hydrology").performer;

  const preliminaryClaim = clone(a);
  const claimed = firstObservation(preliminaryClaim, "hydrology");
  claimed.meta.profile = [OAH_INDICATOR_PROFILE];

  const wrongFormType = clone(a);
  const form = resources(wrongFormType).find((r) => r.resourceType === "QuestionnaireResponse");
  form.item.find((i) => i.linkId === "waterHeight").answer = [{ valueString: "knee deep" }];

  const referenceForm = clone(a);
  const location = resources(referenceForm).find((r) => r.resourceType === "Location");
  location.extension = [
    {
      url: "http://hl7.org/fhir/StructureDefinition/artifact-relatedArtifact",
      valueRelatedArtifact: { type: "documentation", display: "OneAquaHealth citizen stream check", resource: BROOK_QUESTIONNAIRE },
    },
  ];

  return [
    { file: "a-citizen-check-o17.json", bundle: a, expect: "valid", about: "Citizen check at O17 as submitted: preliminary, no Observation profile claimed" },
    { file: "b-verified-check-o17.json", bundle: b, expect: "valid", about: "The same check after review: final, Observations claim observation-indicators-oah" },
    { file: "c-custom-site.json", bundle: c, expect: "valid", about: "Check at a volunteer-added stream; tap and voice only, so no AI label" },
    { file: "broken-1-unknown-answer-code.json", bundle: unknownCode, expect: "invalid", about: "Copy of a with channelForm.W, a code not in oah-citizen-answers" },
    { file: "broken-2-verified-without-performer.json", bundle: noPerformer, expect: "invalid", about: "Copy of b whose final hydrology Observation has no performer" },
    { file: "broken-3-preliminary-claims-oah-profile.json", bundle: preliminaryClaim, expect: "invalid", about: "Copy of a whose preliminary hydrology Observation claims observation-indicators-oah" },
    { file: "broken-4-form-answer-wrong-type.json", bundle: wrongFormType, expect: "invalid", about: "Copy of a whose QuestionnaireResponse answers the decimal waterHeight item with a string" },
    { file: "gap-location-referenceForm.json", bundle: referenceForm, expect: "probe", about: "Copy of a using the IG's referenceForm slice (artifact-relatedArtifact) on the Location" },
  ];
}

async function main() {
  await mkdir(BUNDLES_DIR, { recursive: true });
  const samples = buildSamples();
  for (const s of samples) await writeFile(join(BUNDLES_DIR, s.file), `${JSON.stringify(s.bundle, null, 2)}\n`);
  const manifest = samples.map(({ file, expect, about }) => ({ file, expect, about }));
  await writeFile(join(BUNDLES_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${samples.length} bundles to ${BUNDLES_DIR}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
