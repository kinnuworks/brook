// Brook's own FHIR R4 definitions, generated from the same code that builds
// the bundles (src/core/fhir.ts), the question list (src/core/protocol.ts)
// and OneAquaHealth's English labels (src/i18n/en.ts), so the published
// CodeSystems and Questionnaire can never disagree with what Brook sends.
//
//   npx --yes tsx scripts/fhir-definitions.mjs    → writes public/fhir/
//
// Each resource is written twice from one object: public/fhir/<Type>-<id>.json
// (the IG-publisher file name) and public/fhir/<Type>/<id>, the path of its
// canonical URL, so https://brook-oah.vercel.app/fhir/CodeSystem/oah-citizen-fields
// resolves on a plain static host. public/fhir/index.json lists them in the
// FHIR package .index.json shape. tests/fhir.test.ts fails if the files on
// disk drift from what this script would write.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ANSWER_SOURCES,
  BROOK_ANSWER_SOURCE,
  BROOK_ANSWER_SOURCE_CODES,
  BROOK_ANSWER_SOURCE_VS,
  BROOK_ANSWERS,
  BROOK_FHIR,
  BROOK_FIELDS,
  BROOK_QUESTIONNAIRE,
  BROOK_TAG,
  INDICATOR_GROUPS,
  NONE_CODING,
  NUMBER_FIELDS,
  OAH_CODES,
  answerCoding,
  answerDisplay,
  fieldCoding,
  fieldDisplay,
} from "../src/core/fhir.ts";
import { FEELINGS, QUESTIONS } from "../src/core/protocol.ts";
import en from "../src/i18n/en.ts";

export const DEFINITIONS_VERSION = "0.1.0";
const DATE = "2026-10-02";
const PUBLISHER = "Brook (hackathon prototype)";
const UCUM = "http://unitsofmeasure.org";
const EXT = "http://hl7.org/fhir/StructureDefinition";
/** The IG's value set of all its indicator codes (OahIndicatorsVs). */
const OAH_INDICATORS_VS = "http://hl7.eu/fhir/ig/oah/ValueSet/temporarySystem-oah-eu";

const header = (resourceType, id, name, title, description) => ({
  resourceType,
  id,
  url: `${BROOK_FHIR}/${resourceType}/${id}`,
  version: DEFINITIONS_VERSION,
  name,
  title,
  status: "draft",
  experimental: true,
  date: DATE,
  publisher: PUBLISHER,
  contact: [{ name: PUBLISHER, telecom: [{ system: "url", value: "https://brook-oah.vercel.app" }] }],
  description,
});

const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const table = (head, rows) =>
  `<table><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`;
const flatConcepts = (concepts) => concepts.flatMap((c) => [c, ...flatConcepts(c.concept ?? [])]);
const itemList = (items) => `<ol>${items.map((i) => `<li>${esc(i.linkId)} (${esc(i.type)}): ${esc(i.text)}${i.item ? itemList(i.item) : ""}</li>`).join("")}</ol>`;

/** A generated narrative (text.div) for a definition, so it reads without tooling. */
function withNarrative(r) {
  let body;
  switch (r.resourceType) {
    case "CodeSystem":
      body = table(["Code", "Display"], flatConcepts(r.concept).map((c) => [c.code, c.display]));
      break;
    case "ValueSet":
      body = `<p>All codes from ${r.compose.include.map((i) => `<code>${esc(i.system)}</code> version ${esc(i.version)}`).join(", ")}.</p>`;
      break;
    case "StructureDefinition": {
      const value = r.differential.element.find((e) => e.path === "Extension.value[x]");
      body = `<p>Extension <code>${esc(r.url)}</code>: a code from <code>${esc(value.binding.valueSet)}</code> (${esc(value.binding.strength)}), on ${r.context.map((c) => esc(c.expression)).join(" and ")}.</p>`;
      break;
    }
    case "Questionnaire":
      body = itemList(r.item);
      break;
    case "ConceptMap":
      body = table(["Field", "OAH indicator", "Relationship"], r.group[0].element.map((e) => [e.code, `${e.target[0].code} (${e.target[0].display})`, e.target[0].equivalence]));
      break;
    default:
      throw new Error(`No narrative for ${r.resourceType}`);
  }
  const { resourceType, id, ...rest } = r;
  return { resourceType, id, text: { status: "generated", div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><b>${esc(r.title)}</b></p><p>${esc(r.description)}</p>${body}</div>` }, ...rest };
}

const countConcepts = (concepts) => concepts.reduce((n, c) => n + 1 + countConcepts(c.concept ?? []), 0);
const codeSystem = (cs) => ({ ...cs, count: countConcepts(cs.concept) });

const SOURCE_TEXT = {
  tap: ["Tapped", "The citizen chose the answer on screen."],
  voice: ["Spoken", "The citizen said the answer; the browser's speech recognition produced text that Brook's on-phone word matcher recognised. No AI model interpreted it."],
  text: ["Typed", "The citizen typed the answer and Brook's on-phone word matcher recognised it. No AI model interpreted it."],
  "voice-ai": ["Spoken, interpreted by AI", "The citizen answered in their own words; the word matcher could not place it, so an AI model mapped the reply to one of the question's own answer codes, which the citizen was then shown."],
  "text-ai": ["Typed, interpreted by AI", "The citizen typed a reply in their own words; the word matcher could not place it, so an AI model mapped it to one of the question's own answer codes, which the citizen was then shown."],
  "photo-confirmed": ["Photo suggestion, confirmed", "An AI model suggested this answer from the citizen's photo and the citizen gave the same answer."],
  "photo-corrected": ["Photo suggestion, corrected", "An AI model suggested an answer from the citizen's photo and the citizen gave a different one; the citizen's answer is the one recorded."],
};

/** Which yes/no question opens a follow-up question, read from protocol.ts's own showIf. */
function enableWhenFor(q) {
  if (!q.showIf) return undefined;
  const parent = QUESTIONS.find((p) => p.kind === "yesno" && q.showIf({ [p.id]: true }) && !q.showIf({ [p.id]: false }));
  if (!parent) throw new Error(`Cannot express the showIf of ${q.id} as an enableWhen`);
  return [{ question: parent.id, operator: "=", answerBoolean: true }];
}

function questionnaireItem(q) {
  const t = en.q[q.id];
  const item = { linkId: q.id, code: [fieldCoding(q.id)], text: t.official };
  const enableWhen = enableWhenFor(q);
  const tail = { ...(enableWhen ? { enableWhen } : {}), required: !q.allowNotSure };
  switch (q.kind) {
    case "single":
    case "rating":
      return { ...item, type: "choice", ...tail, answerOption: q.codes.map((c) => ({ valueCoding: answerCoding(q.id, c) })) };
    case "multi":
      return {
        ...item,
        type: "choice",
        ...tail,
        repeats: true,
        answerOption: [
          ...q.codes.map((c) => ({ valueCoding: answerCoding(q.id, c) })),
          { extension: [{ url: `${EXT}/questionnaire-optionExclusive`, valueBoolean: true }], valueCoding: NONE_CODING },
        ],
      };
    case "yesno":
      return { ...item, type: "boolean", ...tail };
    case "number": {
      const n = NUMBER_FIELDS[q.id];
      if (!n) throw new Error(`No FHIR type for number field ${q.id}`);
      const bound = (v) => (n.type === "integer" ? { valueInteger: v } : { valueDecimal: v });
      return {
        extension: [
          ...(n.code !== "1" ? [{ url: `${EXT}/questionnaire-unit`, valueCoding: { system: UCUM, code: n.code, display: n.unit } }] : []),
          ...(q.min !== undefined ? [{ url: `${EXT}/minValue`, ...bound(q.min) }] : []),
          ...(q.max !== undefined ? [{ url: `${EXT}/maxValue`, ...bound(q.max) }] : []),
        ],
        ...item,
        type: n.type,
        ...tail,
      };
    }
    case "text":
      return { ...item, type: "string", ...tail, maxLength: 300 };
    case "feelings":
      return {
        ...item,
        type: "group",
        ...tail,
        item: FEELINGS.map((k) => ({
          extension: [
            { url: `${EXT}/minValue`, valueInteger: 0 },
            { url: `${EXT}/maxValue`, valueInteger: 5 },
          ],
          linkId: `feelings.${k}`,
          code: [fieldCoding(`feelings.${k}`)],
          text: en.feelings[k],
          type: "integer",
          required: false,
        })),
      };
    default:
      throw new Error(`Unhandled question kind ${q.kind}`);
  }
}

export function buildDefinitions() {
  const fields = codeSystem({
    ...header(
      "CodeSystem",
      "oah-citizen-fields",
      "OahCitizenFields",
      "OneAquaHealth citizen stream check: fields",
      "The fields of the OneAquaHealth Citizen Science App's stream check, as Brook asks them, plus the citizen's overall assessment and the four feelings. Each code is the app's own field name (CitizenSubmissionPutDTO). Brook uses them as Observation.component and Questionnaire item codes. Not an official OneAquaHealth artefact.",
    ),
    caseSensitive: true,
    hierarchyMeaning: "part-of",
    content: "complete",
    concept: QUESTIONS.map((q) => ({
      code: q.id,
      display: fieldDisplay(q.id),
      definition: `OneAquaHealth app field '${q.id}'. Official question: "${en.q[q.id].official}"`,
      ...(q.kind === "feelings"
        ? {
            concept: FEELINGS.map((k) => ({
              code: `feelings.${k}`,
              display: fieldDisplay(`feelings.${k}`),
              definition: `${en.feelings[k]} felt at the stream, rated from 0 to 5 (OneAquaHealth app field '${k}').`,
            })),
          }
        : {}),
    })),
  });

  const answers = codeSystem({
    ...header(
      "CodeSystem",
      "oah-citizen-answers",
      "OahCitizenAnswers",
      "OneAquaHealth citizen stream check: answers",
      "The coded answers of the OneAquaHealth Citizen Science App's stream check. Each code is the field name and the value the app stores, joined by a dot (e.g. channelForm.FLAT); each display is OneAquaHealth's own English label, including the letter of its illustration. Not an official OneAquaHealth artefact.",
    ),
    caseSensitive: true,
    content: "complete",
    property: [
      { code: "field", uri: `${BROOK_ANSWERS}#field`, description: "The OneAquaHealth app field this answer belongs to (a code in oah-citizen-fields).", type: "Coding" },
      { code: "appValue", uri: `${BROOK_ANSWERS}#appValue`, description: "The value exactly as the OneAquaHealth app stores it.", type: "string" },
    ],
    concept: QUESTIONS.filter((q) => q.codes?.length).flatMap((q) =>
      q.codes.map((c) => ({
        code: `${q.id}.${c}`,
        display: answerDisplay(q.id, c),
        definition: `Answer ${c} to "${en.q[q.id].official}" (OneAquaHealth app field '${q.id}').`,
        property: [
          { code: "field", valueCoding: fieldCoding(q.id) },
          { code: "appValue", valueString: c },
        ],
      })),
    ),
  });

  const tags = codeSystem({
    ...header("CodeSystem", "tags", "BrookTags", "Brook resource tags", "Tags Brook puts in meta.tag of every resource it creates."),
    caseSensitive: true,
    content: "complete",
    concept: [
      {
        code: BROOK_TAG.code,
        display: BROOK_TAG.display,
        definition: "Created by Brook from a citizen stream check that follows the OneAquaHealth citizen science protocol. Brook only forwards a bundle when every resource in it carries this tag.",
      },
    ],
  });

  const sourceCodes = codeSystem({
    ...header(
      "CodeSystem",
      "answer-source",
      "AnswerSourceCodes",
      "Answer source codes",
      "How a citizen's answer reached the record: tapped, spoken or typed and matched by word lists, interpreted by an AI model from free speech or text, or suggested by an AI model from a photo and then confirmed or corrected by the citizen.",
    ),
    caseSensitive: true,
    content: "complete",
    concept: ANSWER_SOURCES.map((code) => ({ code, display: SOURCE_TEXT[code][0], definition: SOURCE_TEXT[code][1] })),
  });

  const sourceValueSet = {
    ...header("ValueSet", "answer-source", "AnswerSourceValueSet", "Answer sources", "All answer source codes."),
    immutable: false,
    compose: { include: [{ system: BROOK_ANSWER_SOURCE_CODES, version: DEFINITIONS_VERSION }] },
  };

  const extension = {
    ...header(
      "StructureDefinition",
      "answer-source",
      "AnswerSource",
      "Answer source",
      "How the citizen's answer behind an Observation component (or, for a single-valued Observation, the Observation itself) reached the record. Lets a researcher separate answers a person gave unaided from those an AI model suggested or interpreted.",
    ),
    fhirVersion: "4.0.1",
    kind: "complex-type",
    abstract: false,
    context: [
      { type: "element", expression: "Observation.component" },
      { type: "element", expression: "Observation" },
    ],
    type: "Extension",
    baseDefinition: `${EXT}/Extension`,
    derivation: "constraint",
    differential: {
      element: [
        { id: "Extension", path: "Extension", short: "How the answer reached the record", definition: "How the citizen's answer reached the record.", max: "1" },
        { id: "Extension.extension", path: "Extension.extension", max: "0" },
        { id: "Extension.url", path: "Extension.url", fixedUri: BROOK_ANSWER_SOURCE },
        {
          id: "Extension.value[x]",
          path: "Extension.value[x]",
          min: 1,
          type: [{ code: "code" }],
          binding: { strength: "required", valueSet: BROOK_ANSWER_SOURCE_VS },
        },
      ],
    },
  };

  const questionnaire = {
    ...header(
      "Questionnaire",
      "oah-citizen-check",
      "OahCitizenCheck",
      "OneAquaHealth citizen stream check (as asked by Brook)",
      "The OneAquaHealth Citizen Science App's stream check, field for field and in the app's order: item linkIds are the app's field names, item texts OneAquaHealth's official English questions, answer options the app's own codes. 'I'm not sure' is a valid answer to every question but the overall assessment, and leaves the item unanswered, as the app stores null. Brook's QuestionnaireResponses answer this form. Not an official OneAquaHealth artefact.",
    ),
    subjectType: ["Location"],
    item: QUESTIONS.map(questionnaireItem),
  };

  const conceptMap = {
    ...header(
      "ConceptMap",
      "oah-citizen-fields-to-oah-indicators",
      "OahCitizenFieldsToOahIndicators",
      "Citizen check fields to OneAquaHealth indicators",
      "Brook's grouping of the OneAquaHealth app fields under the indicator codes of the OneAquaHealth FHIR IG (hl7.eu.fhir.oah): the code of the Observation each field becomes a component of. 'wider' means the indicator includes what the field records; 'relatedto' marks a field the IG has no closer indicator for.",
    ),
    sourceCanonical: `${BROOK_FHIR}/ValueSet/oah-citizen-fields`,
    targetCanonical: OAH_INDICATORS_VS,
    group: [
      {
        source: BROOK_FIELDS,
        sourceVersion: DEFINITIONS_VERSION,
        target: OAH_CODES,
        element: INDICATOR_GROUPS.flatMap((g) =>
          g.fields.map((f) => {
            const loose = RELATED_ONLY.has(f);
            return {
              code: f,
              display: fieldDisplay(f),
              target: [
                {
                  code: g.code,
                  display: g.display,
                  equivalence: loose ? "relatedto" : "wider",
                  ...(loose ? { comment: RELATED_ONLY.get(f) } : {}),
                },
              ],
            };
          }),
        ),
      },
    ],
  };
  // The ConceptMap's source is a value set; the implicit one of the fields CodeSystem.
  const fieldsValueSet = {
    ...header("ValueSet", "oah-citizen-fields", "OahCitizenFieldsValueSet", "Citizen check fields", "All codes of the oah-citizen-fields CodeSystem."),
    immutable: false,
    compose: { include: [{ system: BROOK_FIELDS, version: DEFINITIONS_VERSION }] },
  };

  // Every canonical the bundle builder points at must be the one published here.
  for (const [r, url] of [
    [fields, BROOK_FIELDS],
    [answers, BROOK_ANSWERS],
    [tags, BROOK_TAG.system],
    [sourceCodes, BROOK_ANSWER_SOURCE_CODES],
    [sourceValueSet, BROOK_ANSWER_SOURCE_VS],
    [extension, BROOK_ANSWER_SOURCE],
    [questionnaire, BROOK_QUESTIONNAIRE],
  ]) {
    if (r.url !== url) throw new Error(`${r.resourceType}/${r.id} is published at ${r.url}, but bundles reference ${url}`);
  }
  return [fields, answers, tags, sourceCodes, sourceValueSet, fieldsValueSet, extension, questionnaire, conceptMap].map(withNarrative);
}

/** Fields that sit under an indicator only because the IG has no closer one. */
const RELATED_ONLY = new Map([
  ["pipes", "Polluting pipes are a pressure on water quality; the IG has no pollution-source indicator, so Brook files them with foam/colour/smell."],
  ["waterDischarge", "Sewage inflow is a pressure on water quality; the IG has no pollution-source indicator, so Brook files it with foam/colour/smell."],
  ["construction", "Works in the stream; the IG has no pressure indicator for them, so Brook files them with foam/colour/smell."],
]);

export const fileName = (r) => `${r.resourceType}-${r.id}.json`;
export const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function buildIndex(resources) {
  return {
    "index-version": 1,
    canonical: BROOK_FHIR,
    note: "Brook's FHIR R4 definitions. Each file is also served at its canonical URL, e.g. /fhir/CodeSystem/oah-citizen-fields.",
    files: resources.map((r) => ({
      filename: fileName(r),
      resourceType: r.resourceType,
      id: r.id,
      url: r.url,
      version: r.version,
      ...(r.kind ? { kind: r.kind } : {}),
      ...(r.type ? { type: r.type } : {}),
    })),
  };
}

export const DEFINITIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "fhir");

async function main() {
  const resources = buildDefinitions();
  await mkdir(DEFINITIONS_DIR, { recursive: true });
  for (const r of resources) {
    await writeFile(join(DEFINITIONS_DIR, fileName(r)), json(r));
    await mkdir(join(DEFINITIONS_DIR, r.resourceType), { recursive: true });
    await writeFile(join(DEFINITIONS_DIR, r.resourceType, r.id), json(r));
  }
  await writeFile(join(DEFINITIONS_DIR, "index.json"), json(buildIndex(resources)));
  console.log(`Wrote ${resources.length} definitions to ${DEFINITIONS_DIR}`);
  for (const r of resources) console.log(`  ${r.url}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
