// One citizen stream check as an HL7 FHIR R4 transaction Bundle, shaped by
// the OneAquaHealth FHIR Implementation Guide (hl7.eu.fhir.oah, github.com/hl7-eu/oah).
//
// • The site is a Location on the OAH Location profile, linked to the raw
//   form (QuestionnaireResponse) through the IG's referenceForm extension.
// • Answers are grouped into Observations under the IG's own indicator
//   codes (morophology, hydrology, LandUse, riparianVegetation, foam,
//   invasiveOrganisms), one component per OneAquaHealth app field, valued
//   with the app's own answer codes.
// • A citizen check is `preliminary`. The IG's indicator profile requires
//   `final` and a performer, so a check only claims that profile once a
//   researcher has verified it (see `verify`). That gap in the IG is real and
//   documented in docs/FHIR.md.
// • Where an answer came from: every component carries an answer-source
//   extension (tap, voice, photo suggestion confirmed or corrected…), and a
//   Provenance names the citizen as author, Brook as assembler and, when a
//   photo suggestion was used, the AI model as informant. Resources whose
//   values an AI proposed carry the HL7 security label AIAST.

import type { AnswerValues, FeelingKey, QuestionId, SiteRef } from "./protocol";
import { activeQuestions, FEELINGS, QUESTION_BY_ID } from "./protocol";

export const OAH_IG = "http://hl7.eu/fhir/ig/oah";
export const OAH_CODES = `${OAH_IG}/CodeSystem/temporarySystem-oah-eu`;
export const OAH_LOCATION_PROFILE = `${OAH_IG}/StructureDefinition/location-oah`;
export const OAH_INDICATOR_PROFILE = `${OAH_IG}/StructureDefinition/observation-indicators-oah`;

/** Canonical base for the few definitions Brook adds (served from /fhir in this app). */
export const BROOK_FHIR = "https://brook-oah.vercel.app/fhir";
export const BROOK_FIELDS = `${BROOK_FHIR}/CodeSystem/oah-citizen-fields`;
export const BROOK_ANSWERS = `${BROOK_FHIR}/CodeSystem/oah-citizen-answers`;
export const BROOK_ANSWER_SOURCE = `${BROOK_FHIR}/StructureDefinition/answer-source`;
export const BROOK_TAG = { system: `${BROOK_FHIR}/CodeSystem/tags`, code: "brook-citizen-check", display: "Brook citizen stream check" };
const AIAST = { system: "http://terminology.hl7.org/CodeSystem/v3-ObservationValue", code: "AIAST", display: "Artificial Intelligence asserted" };
const OAH_SITES = "https://api.enora-oah.eu/api/sites";

export type AnswerSource = "tap" | "voice" | "text" | "voice-ai" | "text-ai" | "photo-confirmed" | "photo-corrected";

export interface CheckForFhir {
  id: string;
  site: SiteRef;
  answers: AnswerValues;
  sources: Partial<Record<QuestionId, AnswerSource>>;
  startedAt: string;
  submittedAt: string;
  lang: string;
  citizenRef: string;
  aiModel?: string | null;
  verifiedBy?: string | null;
}

type Resource = Record<string, unknown> & { resourceType: string; id: string };

const GROUPS: { code: string; display: string; fields: QuestionId[] }[] = [
  { code: "morophology", display: "Morphology of the streams", fields: ["channelForm", "bottomChannelType", "banksChannelType", "habitats", "fallenBiomassTypes"] },
  { code: "hydrology", display: "Hydrology of the stream", fields: ["waterFlow", "waterHeight", "hasDams", "numberOfDams", "waterAbstraction"] },
  { code: "foam", display: "Foam/colour/smell", fields: ["waterColor", "pipes", "waterDischarge", "construction"] },
  { code: "LandUse", display: "Land use in the margins", fields: ["imperviousAreasLeft", "imperviousAreasRight", "recentVegetationCuts"] },
  { code: "riparianVegetation", display: "Riparian vegetation", fields: ["isVegetationCoveredLeft", "vegetationTypeLeft", "isVegetationCoveredRight", "vegetationTypeRight"] },
  { code: "invasiveOrganisms", display: "Invasive invertebrate, plants and fish", fields: ["hasInvasivePlantSpecies", "invasivePlantSpecies"] },
];

const uuid = (seed: string, n: number) => {
  // Deterministic per check so re-sending never duplicates on the server.
  let h = 2166136261;
  for (const c of `${seed}:${n}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  const base = seed.replace(/[^0-9a-f]/gi, "").padEnd(24, "0").slice(0, 24);
  return `${hex}-${base.slice(0, 4)}-4${base.slice(5, 8)}-a${base.slice(9, 12)}-${base.slice(12, 24)}`;
};

function valueOf(qid: QuestionId, value: unknown): Record<string, unknown> {
  const q = QUESTION_BY_ID[qid];
  if (value === null) {
    return { dataAbsentReason: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/data-absent-reason", code: "asked-unknown", display: "Asked But Unknown" }] } };
  }
  switch (q.kind) {
    case "single":
    case "rating":
      return { valueCodeableConcept: { coding: [{ system: BROOK_ANSWERS, code: `${qid}.${value}` }], text: String(value) } };
    case "multi": {
      const codes = value as string[];
      if (!codes.length) return { valueCodeableConcept: { coding: [{ system: OAH_CODES, code: "absent", display: "Absent" }], text: "none" } };
      return { valueCodeableConcept: { coding: codes.map((c) => ({ system: BROOK_ANSWERS, code: `${qid}.${c}` })), text: codes.join(", ") } };
    }
    case "yesno":
      return { valueBoolean: value };
    case "number":
      return qid === "waterHeight"
        ? { valueQuantity: { value, unit: "m", system: "http://unitsofmeasure.org", code: "m" } }
        : { valueInteger: value };
    case "text":
      return { valueString: value };
    default:
      return { valueString: JSON.stringify(value) };
  }
}

const sourceExt = (source?: AnswerSource) => (source ? [{ url: BROOK_ANSWER_SOURCE, valueCode: source }] : []);
const aiTouched = (s?: AnswerSource) => s === "photo-confirmed" || s === "photo-corrected" || s === "voice-ai" || s === "text-ai";

export function buildBundle(check: CheckForFhir): Record<string, unknown> {
  const { site, answers, sources } = check;
  const verified = !!check.verifiedBy;
  const ids = {
    location: site.custom ? uuid(check.id, 1) : `oah-site-${site.code.toLowerCase()}`,
    form: uuid(check.id, 2),
    device: "brook-app",
    model: "brook-ai-model",
    provenance: uuid(check.id, 3),
  };
  const meta = (extraProfile?: string, ai = false): Record<string, unknown> => ({
    ...(extraProfile ? { profile: [extraProfile] } : {}),
    tag: [BROOK_TAG],
    ...(ai ? { security: [AIAST] } : {}),
  });

  const location: Resource = {
    resourceType: "Location",
    id: ids.location,
    meta: meta(OAH_LOCATION_PROFILE),
    extension: [
      {
        url: "http://hl7.org/fhir/StructureDefinition/artifact-relatedArtifact",
        valueRelatedArtifact: { type: "documentation", display: "OneAquaHealth citizen stream check", resource: `${BROOK_FHIR}/Questionnaire/oah-citizen-check` },
      },
    ],
    identifier: [site.custom ? { system: `${BROOK_FHIR}/user-sites`, value: ids.location } : { system: OAH_SITES, value: site.code }],
    name: site.name,
    mode: "instance",
    ...(site.city ? { address: { city: site.city } } : {}),
    position: { latitude: site.lat, longitude: site.lon },
  };

  const asked = activeQuestions(answers).filter((q) => q.id in answers);
  const form: Resource = {
    resourceType: "QuestionnaireResponse",
    id: ids.form,
    meta: meta(),
    questionnaire: `${BROOK_FHIR}/Questionnaire/oah-citizen-check`,
    status: "completed",
    subject: { reference: `Location/${ids.location}` },
    authored: check.submittedAt,
    author: { identifier: { system: `${BROOK_FHIR}/citizens`, value: check.citizenRef }, display: "Citizen scientist (pseudonymous)" },
    item: asked
      .filter((q) => q.id !== "feelings")
      .map((q) => {
        const v = answers[q.id];
        const answer =
          v === null
            ? []
            : Array.isArray(v)
              ? v.map((c) => ({ valueCoding: { system: BROOK_ANSWERS, code: `${q.id}.${c}` } }))
              : q.kind === "yesno"
                ? [{ valueBoolean: v }]
                : q.kind === "number"
                  ? [{ valueDecimal: v }]
                  : q.kind === "text"
                    ? [{ valueString: v }]
                    : [{ valueCoding: { system: BROOK_ANSWERS, code: `${q.id}.${v}` } }];
        return { linkId: q.id, ...(answer.length ? { answer } : {}) };
      }),
  };

  const performer = [
    { identifier: { system: `${BROOK_FHIR}/citizens`, value: check.citizenRef }, display: "Citizen scientist (pseudonymous)" },
    ...(verified ? [{ display: check.verifiedBy }] : []),
  ];

  const observations: Resource[] = GROUPS.map((g, i) => {
    const fields = g.fields.filter((f) => f in answers && QUESTION_BY_ID[f] && asked.some((q) => q.id === f));
    if (!fields.length) return null;
    const ai = fields.some((f) => aiTouched(sources[f]));
    return {
      resourceType: "Observation",
      id: uuid(check.id, 10 + i),
      meta: meta(verified ? OAH_INDICATOR_PROFILE : undefined, ai),
      status: verified ? "final" : "preliminary",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }],
      code: { coding: [{ system: OAH_CODES, code: g.code, display: g.display }] },
      subject: { reference: `Location/${ids.location}` },
      effectiveDateTime: check.startedAt,
      issued: check.submittedAt,
      performer,
      derivedFrom: [{ reference: `QuestionnaireResponse/${ids.form}` }],
      component: fields.map((f) => ({
        extension: sourceExt(sources[f]),
        code: { coding: [{ system: BROOK_FIELDS, code: f }], text: f },
        ...valueOf(f, answers[f]),
      })),
    } as Resource;
  }).filter((r): r is Resource => r !== null);

  if (answers.overallAssessment) {
    observations.push({
      resourceType: "Observation",
      id: uuid(check.id, 30),
      meta: meta(verified ? OAH_INDICATOR_PROFILE : undefined),
      status: verified ? "final" : "preliminary",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }],
      code: { coding: [{ system: BROOK_FIELDS, code: "overallAssessment", display: "Citizen overall assessment of stream ecosystem health" }] },
      subject: { reference: `Location/${ids.location}` },
      effectiveDateTime: check.startedAt,
      performer,
      derivedFrom: [{ reference: `QuestionnaireResponse/${ids.form}` }],
      valueCodeableConcept: { coding: [{ system: BROOK_ANSWERS, code: `overallAssessment.${answers.overallAssessment}` }], text: String(answers.overallAssessment) },
    });
  }

  const feelings = answers.feelings;
  if (feelings && typeof feelings === "object" && !Array.isArray(feelings) && Object.keys(feelings).length) {
    observations.push({
      resourceType: "Observation",
      id: uuid(check.id, 31),
      meta: meta(),
      status: verified ? "final" : "preliminary",
      category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }],
      code: { coding: [{ system: BROOK_FIELDS, code: "feelings", display: "Emotional response to the stream (0–5)" }] },
      subject: { reference: `Location/${ids.location}` },
      effectiveDateTime: check.startedAt,
      performer: performer.slice(0, 1),
      derivedFrom: [{ reference: `QuestionnaireResponse/${ids.form}` }],
      component: FEELINGS.filter((k) => typeof (feelings as Record<FeelingKey, number>)[k] === "number").map((k) => ({
        code: { coding: [{ system: BROOK_FIELDS, code: `feelings.${k}` }], text: k },
        valueInteger: (feelings as Record<FeelingKey, number>)[k],
      })),
    });
  }

  const usedAi = Object.values(sources).some(aiTouched);
  const device: Resource = {
    resourceType: "Device",
    id: ids.device,
    meta: meta(),
    deviceName: [{ name: "Brook — talking field coach for the OneAquaHealth citizen stream check", type: "user-friendly-name" }],
    version: [{ value: "1.0.0" }],
  };
  const model: Resource | null =
    usedAi && check.aiModel
      ? {
          resourceType: "Device",
          id: ids.model,
          meta: meta(),
          deviceName: [{ name: check.aiModel, type: "model-name" }],
          type: { text: "AI model that suggested answers from photos or free speech, for the citizen to confirm" },
        }
      : null;

  const provenance: Resource = {
    resourceType: "Provenance",
    id: ids.provenance,
    meta: meta(),
    target: [{ reference: `QuestionnaireResponse/${ids.form}` }, ...observations.map((o) => ({ reference: `Observation/${o.id}` }))],
    recorded: check.submittedAt,
    activity: { text: "Citizen stream check guided by Brook; every answer given or confirmed by the citizen" },
    agent: [
      { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "author" }] }, who: performer[0] },
      { type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "assembler" }] }, who: { reference: `Device/${ids.device}` } },
      ...(model ? [{ type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "informant" }] }, who: { reference: `Device/${ids.model}` } }] : []),
      ...(verified ? [{ type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/provenance-participant-type", code: "verifier" }] }, who: { display: check.verifiedBy } }] : []),
    ],
  };

  const resources: Resource[] = [location, form, ...observations, device, ...(model ? [model] : []), provenance];
  return {
    resourceType: "Bundle",
    type: "transaction",
    meta: { tag: [BROOK_TAG] },
    entry: resources.map((r) => ({
      fullUrl: `${BROOK_FHIR}/${r.resourceType}/${r.id}`,
      resource: r,
      request: { method: "PUT", url: `${r.resourceType}/${r.id}` },
    })),
  };
}
