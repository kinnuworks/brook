// One citizen stream check as an HL7 FHIR R4 transaction Bundle, shaped by
// the OneAquaHealth FHIR Implementation Guide (hl7.eu.fhir.oah, github.com/hl7-eu/oah).
//
// • The site is a Location on the OAH Location profile (location-oah).
// • The raw form is a QuestionnaireResponse to Brook's Questionnaire
//   (public/fhir), answers in their native types, subject = the Location.
// • Answers are grouped into Observations under the IG's own indicator codes
//   (morophology, hydrology, foam, LandUse, riparianVegetation,
//   invasiveOrganisms), one component per OneAquaHealth app field. Component
//   values only use the types the IG's indicator profile allows
//   (CodeableConcept, Quantity, string): the app's answer codes, HL7 Y/N for
//   yes/no, UCUM quantities for numbers, one component per ticked option of a
//   multi-select, the IG's own `absent` for "none of these", and
//   data-absent-reason `asked-unknown` for "I'm not sure".
// • A citizen check is `preliminary` and claims no Observation profile: the
//   IG's indicator profile fixes status to `final` and requires a performer,
//   so an unreviewed report cannot conform to it. Once a researcher verifies
//   it (`verifiedBy`), the same content becomes `final`, names the reviewer as
//   a performer, claims observation-indicators-oah, and a second Provenance
//   records the verification. The gap is documented in docs/FHIR.md.
// • Where an answer came from: every component carries Brook's answer-source
//   extension (tap, voice, photo suggestion confirmed or corrected…). A
//   Provenance names the citizen as author, Brook as assembler and, when an
//   AI model took part, the model as informant. Resources holding a value an
//   AI proposed or interpreted (and the citizen accepted) carry the HL7
//   security label AIAST; a value the citizen corrected is theirs, not the AI's.
//
// Brook's definitions (CodeSystems, the extension, the Questionnaire) are
// generated from this file, protocol.ts and the English strings by
// scripts/fhir-definitions.mjs and served from public/fhir.

import en from "../i18n/en";
import type { AnswerValues, FeelingKey, QuestionDef, QuestionId, SiteRef } from "./protocol";
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
export const BROOK_ANSWER_SOURCE_CODES = `${BROOK_FHIR}/CodeSystem/answer-source`;
export const BROOK_ANSWER_SOURCE_VS = `${BROOK_FHIR}/ValueSet/answer-source`;
export const BROOK_QUESTIONNAIRE = `${BROOK_FHIR}/Questionnaire/oah-citizen-check`;
export const BROOK_TAG = { system: `${BROOK_FHIR}/CodeSystem/tags`, code: "brook-citizen-check", display: "Brook citizen stream check" };
export const AIAST = { system: "http://terminology.hl7.org/CodeSystem/v3-ObservationValue", code: "AIAST", display: "Artificial Intelligence asserted" };
/** Version of the Brook app, as recorded on its Device. */
export const BROOK_APP_VERSION = "1.0.0";

const OAH_SITES = "https://api.enora-oah.eu/api/sites";
const YES_NO = "http://terminology.hl7.org/CodeSystem/v2-0532";
const DAR = "http://terminology.hl7.org/CodeSystem/data-absent-reason";
const UCUM = "http://unitsofmeasure.org";
const PARTICIPANT = "http://terminology.hl7.org/CodeSystem/provenance-participant-type";
const DATA_OPERATION = "http://terminology.hl7.org/CodeSystem/v3-DataOperation";

export const ANSWER_SOURCES = ["tap", "voice", "text", "voice-ai", "text-ai", "photo-confirmed", "photo-corrected"] as const;
export type AnswerSource = (typeof ANSWER_SOURCES)[number];

/** The stored value is what an AI proposed (from a photo) or how it read free speech or text, accepted by the citizen. */
export const aiAsserted = (s?: AnswerSource | null): boolean => s === "photo-confirmed" || s === "voice-ai" || s === "text-ai";
/** An AI model took part in reaching the answer, even when the citizen overruled it. */
export const aiInvolved = (s?: AnswerSource | null): boolean => aiAsserted(s) || s === "photo-corrected";

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
  /** When the reviewer verified the check; defaults to `submittedAt`. */
  verifiedAt?: string | null;
}

type Json = Record<string, unknown>;
type Resource = Json & { resourceType: string; id: string };

/** Brook's mapping of OneAquaHealth app fields onto the IG's indicator codes. */
export const INDICATOR_GROUPS: readonly { code: string; display: string; fields: readonly QuestionId[] }[] = [
  { code: "morophology", display: "Morphology of the streams", fields: ["channelForm", "bottomChannelType", "banksChannelType", "habitats", "fallenBiomassTypes"] },
  { code: "hydrology", display: "Hydrology of the stream", fields: ["waterFlow", "waterHeight", "hasDams", "numberOfDams", "waterAbstraction"] },
  { code: "foam", display: "Foam/colour/smell", fields: ["waterColor", "pipes", "waterDischarge", "construction"] },
  { code: "LandUse", display: "Land use in the margins", fields: ["imperviousAreasLeft", "imperviousAreasRight", "recentVegetationCuts"] },
  { code: "riparianVegetation", display: "Riparian vegetation", fields: ["isVegetationCoveredLeft", "vegetationTypeLeft", "isVegetationCoveredRight", "vegetationTypeRight"] },
  { code: "invasiveOrganisms", display: "Invasive invertebrate, plants and fish", fields: ["hasInvasivePlantSpecies", "invasivePlantSpecies"] },
];

/** Numeric fields: their Questionnaire item type and UCUM unit. */
export const NUMBER_FIELDS: Partial<Record<QuestionId, { type: "integer" | "decimal"; unit: string; code: string }>> = {
  numberOfDams: { type: "integer", unit: "dams", code: "1" },
  waterHeight: { type: "decimal", unit: "m", code: "m" },
};

/** A field code: a OneAquaHealth app field, or one of the four feelings. */
export type FieldCode = QuestionId | `feelings.${FeelingKey}`;

/** Display of a field code: Brook's short English name of the OneAquaHealth question. */
export function fieldDisplay(code: FieldCode): string {
  if (code.startsWith("feelings.")) return en.feelings[code.slice(9) as FeelingKey];
  return en.q[code as QuestionId].title;
}

/** Display of an answer code: OneAquaHealth's own English label for it. */
export function answerDisplay(qid: QuestionId, code: string): string {
  return en.q[qid].options?.[code]?.official ?? code;
}

export const answerCoding = (qid: QuestionId, code: string) => ({ system: BROOK_ANSWERS, code: `${qid}.${code}`, display: answerDisplay(qid, code) });
export const fieldCoding = (code: FieldCode) => ({ system: BROOK_FIELDS, code, display: fieldDisplay(code) });
/** "None of these" for a multi-select: the IG's own coded result. */
export const NONE_CODING = { system: OAH_CODES, code: "absent", display: "Absent" };
const NOT_SURE = { coding: [{ system: DAR, code: "asked-unknown", display: "Asked But Unknown" }], text: "Not sure" };
const yesNo = (v: boolean) => ({ coding: [{ system: YES_NO, code: v ? "Y" : "N", display: v ? "Yes" : "No" }], text: v ? "Yes" : "No" });
const chosen = (qid: QuestionId, code: string) => ({ coding: [answerCoding(qid, code)], text: en.q[qid].options?.[code]?.label ?? code });

const uuid = (seed: string, n: number) => {
  // Deterministic per check so re-sending never duplicates on the server.
  let h = 2166136261;
  for (const c of `${seed}:${n}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  const base = seed.replace(/[^0-9a-f]/gi, "").padEnd(24, "0").slice(0, 24);
  return `${hex}-${base.slice(0, 4)}-4${base.slice(5, 8)}-a${base.slice(9, 12)}-${base.slice(12, 24)}`;
};

/** One field's value as Observation component value(s): one per ticked option of a multi-select. */
function componentValues(q: QuestionDef, value: unknown): Json[] {
  if (value === null) return [{ valueCodeableConcept: NOT_SURE }];
  switch (q.kind) {
    case "single":
    case "rating":
      return [{ valueCodeableConcept: chosen(q.id, String(value)) }];
    case "multi": {
      const codes = value as string[];
      if (!codes.length) return [{ valueCodeableConcept: { coding: [NONE_CODING], text: "None" } }];
      return codes.map((c) => ({ valueCodeableConcept: chosen(q.id, c) }));
    }
    case "yesno":
      return [{ valueCodeableConcept: yesNo(Boolean(value)) }];
    case "number": {
      const unit = NUMBER_FIELDS[q.id] ?? { unit: "1", code: "1" };
      return [{ valueQuantity: { value, unit: unit.unit, system: UCUM, code: unit.code } }];
    }
    case "text":
      return [{ valueString: String(value) }];
    default:
      return [{ valueString: JSON.stringify(value) }];
  }
}

/** One field's answer(s) in the QuestionnaireResponse; "not sure" leaves the item unanswered, as the app stores null. */
function formAnswers(q: QuestionDef, value: unknown): Json[] {
  if (value === null || value === undefined) return [];
  switch (q.kind) {
    case "single":
    case "rating":
      return [{ valueCoding: answerCoding(q.id, String(value)) }];
    case "multi": {
      const codes = value as string[];
      return codes.length ? codes.map((c) => ({ valueCoding: answerCoding(q.id, c) })) : [{ valueCoding: NONE_CODING }];
    }
    case "yesno":
      return [{ valueBoolean: Boolean(value) }];
    case "number":
      return [NUMBER_FIELDS[q.id]?.type === "integer" && Number.isInteger(value) ? { valueInteger: value } : { valueDecimal: value }];
    case "text":
      return [{ valueString: String(value) }];
    default:
      return [];
  }
}

const sourceExt = (source?: AnswerSource): Json => (source ? { extension: [{ url: BROOK_ANSWER_SOURCE, valueCode: source }] } : {});
const SURVEY = [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }];
const role = (code: "author" | "assembler" | "informant" | "verifier") => ({
  coding: [{ system: PARTICIPANT, code, display: code[0].toUpperCase() + code.slice(1) }],
});
const modelDeviceId = (model: string) => {
  const slug = model.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 52);
  return slug ? `brook-ai-${slug}` : "brook-ai-model";
};

export function buildBundle(check: CheckForFhir): Record<string, unknown> {
  const { site, answers, sources } = check;
  const verified = !!check.verifiedBy;
  const ids = {
    location: site.custom ? uuid(check.id, 1) : `oah-site-${site.code.toLowerCase()}`,
    form: uuid(check.id, 2),
    device: "brook-app",
    provenance: uuid(check.id, 3),
    verification: uuid(check.id, 4),
  };
  const meta = (profile?: string, ai = false): Json => ({
    ...(profile ? { profile: [profile] } : {}),
    tag: [BROOK_TAG],
    ...(ai ? { security: [AIAST] } : {}),
  });
  const asked = activeQuestions(answers).filter((q) => q.id in answers);
  const askedIds = new Set(asked.map((q) => q.id));
  const citizen = { identifier: { system: `${BROOK_FHIR}/citizens`, value: check.citizenRef }, display: "Citizen scientist (pseudonymous)" };
  const performer = [citizen, ...(verified ? [{ display: check.verifiedBy }] : [])];
  const status = verified ? "final" : "preliminary";

  const location: Resource = {
    resourceType: "Location",
    id: ids.location,
    meta: meta(OAH_LOCATION_PROFILE),
    identifier: [site.custom ? { system: `${BROOK_FHIR}/user-sites`, value: ids.location } : { system: OAH_SITES, value: site.code }],
    name: site.name,
    description: site.custom ? "Stream site added by a Brook volunteer" : `OneAquaHealth research site ${site.code}${site.city ? `, ${site.city}` : ""}`,
    mode: "instance",
    ...(site.city ? { address: { city: site.city } } : {}),
    position: { longitude: site.lon, latitude: site.lat },
  };

  const items: Json[] = asked
    .filter((q) => q.id !== "feelings")
    .map((q) => {
      const answer = formAnswers(q, answers[q.id]);
      return { linkId: q.id, ...(answer.length ? { answer } : {}) };
    });
  const feelings = answers.feelings;
  const feelingScores =
    feelings && typeof feelings === "object" && !Array.isArray(feelings)
      ? FEELINGS.filter((k) => typeof (feelings as Record<FeelingKey, number>)[k] === "number").map((k) => [k, (feelings as Record<FeelingKey, number>)[k]] as const)
      : [];
  if (askedIds.has("feelings") && feelingScores.length) {
    items.push({ linkId: "feelings", item: feelingScores.map(([k, v]) => ({ linkId: `feelings.${k}`, answer: [{ valueInteger: v }] })) });
  }
  const form: Resource = {
    resourceType: "QuestionnaireResponse",
    id: ids.form,
    meta: meta(undefined, asked.some((q) => aiAsserted(sources[q.id]))),
    language: check.lang,
    identifier: { system: `${BROOK_FHIR}/checks`, value: check.id },
    questionnaire: BROOK_QUESTIONNAIRE,
    status: "completed",
    subject: { reference: `Location/${ids.location}` },
    authored: check.submittedAt,
    author: citizen,
    item: items,
  };

  type ObservationBody = { extension?: Json[]; value?: Json; component?: Json[] };
  const observation = (n: number, code: Json, ai: boolean, rest: ObservationBody, profile = verified, who: Json[] = performer): Resource => ({
    resourceType: "Observation",
    id: uuid(check.id, n),
    meta: meta(profile ? OAH_INDICATOR_PROFILE : undefined, ai),
    ...(rest.extension ? { extension: rest.extension } : {}),
    status,
    category: SURVEY,
    code,
    subject: { reference: `Location/${ids.location}` },
    effectiveDateTime: check.startedAt,
    issued: check.submittedAt,
    performer: who,
    ...(rest.value ?? {}),
    derivedFrom: [{ reference: `QuestionnaireResponse/${ids.form}` }],
    ...(rest.component ? { component: rest.component } : {}),
  });

  const observations: Resource[] = [];
  INDICATOR_GROUPS.forEach((g, i) => {
    const fields = g.fields.filter((f) => askedIds.has(f));
    if (!fields.length) return;
    const component = fields.flatMap((f) =>
      componentValues(QUESTION_BY_ID[f], answers[f]).map((value) => ({
        ...sourceExt(sources[f]),
        code: { coding: [fieldCoding(f)], text: en.q[f].official },
        ...value,
      })),
    );
    observations.push(observation(10 + i, { coding: [{ system: OAH_CODES, code: g.code, display: g.display }] }, fields.some((f) => aiAsserted(sources[f])), { component }));
  });

  if (askedIds.has("overallAssessment") && typeof answers.overallAssessment === "string") {
    observations.push(
      observation(30, { coding: [fieldCoding("overallAssessment")], text: en.q.overallAssessment.official }, aiAsserted(sources.overallAssessment), {
        ...sourceExt(sources.overallAssessment),
        value: { valueCodeableConcept: chosen("overallAssessment", answers.overallAssessment) },
      }),
    );
  }

  if (askedIds.has("feelings") && feelingScores.length) {
    observations.push(
      observation(
        31,
        { coding: [fieldCoding("feelings")], text: en.q.feelings.official },
        aiAsserted(sources.feelings),
        {
          component: feelingScores.map(([k, v]) => ({
            ...sourceExt(sources.feelings),
            code: { coding: [fieldCoding(`feelings.${k}`)] },
            valueInteger: v,
          })),
        },
        false,
        performer.slice(0, 1),
      ),
    );
  }

  const model = asked.some((q) => aiInvolved(sources[q.id])) && check.aiModel ? check.aiModel : null;
  const device: Resource = {
    resourceType: "Device",
    id: ids.device,
    meta: meta(),
    deviceName: [{ name: "Brook — talking field coach for the OneAquaHealth citizen stream check", type: "user-friendly-name" }],
    type: { text: "Progressive web app (citizen science field guide)" },
    version: [{ value: BROOK_APP_VERSION }],
  };
  const modelDevice: Resource | null = model
    ? {
        resourceType: "Device",
        id: modelDeviceId(model),
        meta: meta(),
        deviceName: [{ name: model, type: "model-name" }],
        type: { text: "AI model that suggested answers from photos or read free speech, for the citizen to confirm" },
      }
    : null;

  const provenance: Resource = {
    resourceType: "Provenance",
    id: ids.provenance,
    meta: meta(),
    target: [{ reference: `QuestionnaireResponse/${ids.form}` }, ...observations.map((o) => ({ reference: `Observation/${o.id}` }))],
    occurredPeriod: { start: check.startedAt, end: check.submittedAt },
    recorded: check.submittedAt,
    activity: {
      coding: [{ system: DATA_OPERATION, code: "CREATE", display: "create" }],
      text: "Citizen stream check guided by Brook; every answer given or confirmed by the citizen",
    },
    agent: [
      { type: role("author"), who: citizen },
      { type: role("assembler"), who: { reference: `Device/${ids.device}` } },
      ...(modelDevice ? [{ type: role("informant"), who: { reference: `Device/${modelDevice.id}` } }] : []),
    ],
  };
  const verification: Resource | null = verified
    ? {
        resourceType: "Provenance",
        id: ids.verification,
        meta: meta(),
        target: observations.map((o) => ({ reference: `Observation/${o.id}` })),
        recorded: check.verifiedAt ?? check.submittedAt,
        activity: {
          coding: [{ system: DATA_OPERATION, code: "UPDATE", display: "revise" }],
          text: "Reviewed and verified by a OneAquaHealth researcher; observations set to final",
        },
        agent: [{ type: role("verifier"), who: { display: check.verifiedBy } }],
      }
    : null;

  const resources: Resource[] = [location, form, ...observations, device, ...(modelDevice ? [modelDevice] : []), provenance, ...(verification ? [verification] : [])];
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
