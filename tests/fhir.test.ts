// The FHIR bundle builder (src/core/fhir.ts) and Brook's published definitions
// (public/fhir). The HL7 validator run is in scripts/fhir-validate.mjs; these
// tests pin the same rules offline so a change cannot quietly break them.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AIAST,
  ANSWER_SOURCES,
  BROOK_ANSWER_SOURCE,
  BROOK_ANSWERS,
  BROOK_FIELDS,
  BROOK_TAG,
  OAH_CODES,
  OAH_INDICATOR_PROFILE,
  OAH_LOCATION_PROFILE,
  buildBundle,
  type CheckForFhir,
} from "../src/core/fhir";
// @ts-ignore: plain ESM script without type declarations
import { buildDefinitions, buildIndex, DEFINITIONS_DIR, fileName, json } from "../scripts/fhir-definitions.mjs";
// @ts-ignore: plain ESM script without type declarations
import { CHECK_A, CHECK_B, CHECK_C } from "../scripts/fhir-samples.mjs";

type R = Record<string, any>;
const A = CHECK_A as CheckForFhir;
const B = CHECK_B as CheckForFhir;
const C = CHECK_C as CheckForFhir;
const resources = (b: R): R[] => b.entry.map((e: R) => e.resource);
const ofType = (b: R, type: string) => resources(b).filter((r) => r.resourceType === type);
const indicator = (b: R, code: string) => ofType(b, "Observation").find((o) => o.code.coding[0].code === code)!;
const hasAiLabel = (r: R) => (r.meta.security ?? []).some((s: R) => s.system === AIAST.system && s.code === AIAST.code);
const VALUE_KEYS = ["valueCodeableConcept", "valueQuantity", "valueString", "valueInteger", "valueBoolean"];
const valueKeys = (x: R) => Object.keys(x).filter((k) => k.startsWith("value"));
const codings = (node: unknown): R[] =>
  Array.isArray(node)
    ? node.flatMap(codings)
    : node && typeof node === "object"
      ? [...("system" in node && "code" in node ? [node as R] : []), ...Object.values(node).flatMap(codings)]
      : [];

describe("transaction bundle", () => {
  it.each([["a", A], ["b", B], ["c", C]])("check %s is a transaction of PUTs whose fullUrl, request and id agree", (_, check) => {
    const bundle = buildBundle(check) as R;
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("transaction");
    for (const e of bundle.entry) {
      expect(e.request).toEqual({ method: "PUT", url: `${e.resource.resourceType}/${e.resource.id}` });
      expect(e.fullUrl.endsWith(`/${e.resource.resourceType}/${e.resource.id}`)).toBe(true);
      expect(e.resource.id).toMatch(/^[A-Za-z0-9\-.]{1,64}$/);
    }
  });

  it("tags the bundle and every resource in it as a Brook citizen check", () => {
    for (const check of [A, B, C]) {
      const bundle = buildBundle(check) as R;
      expect(bundle.meta.tag).toContainEqual(BROOK_TAG);
      for (const r of resources(bundle)) expect(r.meta.tag).toContainEqual(BROOK_TAG);
    }
  });

  it("never writes an empty array, object or string (FHIR JSON forbids them)", () => {
    const walk = (node: unknown, path: string) => {
      if (Array.isArray(node)) {
        expect(node.length, path).toBeGreaterThan(0);
        node.forEach((n, i) => walk(n, `${path}[${i}]`));
      } else if (node && typeof node === "object") {
        expect(Object.keys(node).length, path).toBeGreaterThan(0);
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
      } else {
        expect(node === "" || node === null || node === undefined, path).toBe(false);
      }
    };
    for (const check of [A, B, C]) walk(buildBundle(check), "Bundle");
  });

  it("is deterministic: the same check always builds the same bundle", () => {
    expect(JSON.stringify(buildBundle(structuredClone(A)))).toBe(JSON.stringify(buildBundle(A)));
    expect(JSON.stringify(buildBundle(structuredClone(B)))).toBe(JSON.stringify(buildBundle(B)));
    const ids = (check: CheckForFhir) => resources(buildBundle(check)).filter((r) => r.resourceType !== "Device").map((r) => r.id);
    const other = ids({ ...C, id: "0f1e2d3c-4b5a-4968-8776-655443322110" });
    expect(ids(C).filter((id) => other.includes(id))).toEqual([]);
  });
});

describe("preliminary → final", () => {
  it("keeps an unreviewed check preliminary, claiming no Observation profile", () => {
    const bundle = buildBundle(A) as R;
    for (const o of ofType(bundle, "Observation")) {
      expect(o.status).toBe("preliminary");
      expect(o.meta.profile).toBeUndefined();
    }
    expect(ofType(bundle, "Location")[0].meta.profile).toEqual([OAH_LOCATION_PROFILE]);
    expect(ofType(bundle, "Provenance")).toHaveLength(1);
  });

  it("makes a verified check final, claims the OAH indicator profile and records the verification", () => {
    const bundle = buildBundle(B) as R;
    for (const o of ofType(bundle, "Observation")) {
      expect(o.status).toBe("final");
      const isFeelings = o.code.coding[0].code === "feelings";
      expect(o.meta.profile).toEqual(isFeelings ? undefined : [OAH_INDICATOR_PROFILE]);
      if (!isFeelings) expect(o.performer).toContainEqual({ display: B.verifiedBy });
    }
    const verification = ofType(bundle, "Provenance").find((p) => p.agent.some((a: R) => a.type.coding[0].code === "verifier"));
    expect(verification?.recorded).toBe(B.verifiedAt);
    expect(verification?.agent[0].who).toEqual({ display: B.verifiedBy });
  });

  it("changes status, profile, performer and provenance on verification, never the answers", () => {
    const before = buildBundle(A) as R;
    const after = buildBundle(B) as R;
    const content = (b: R) => ofType(b, "Observation").map((o) => ({ id: o.id, code: o.code, component: o.component, value: o.valueCodeableConcept }));
    expect(content(after)).toEqual(content(before));
    expect(ofType(after, "QuestionnaireResponse")).toEqual(ofType(before, "QuestionnaireResponse"));
  });

  it("gives verified indicator Observations the shape observation-indicators-oah requires", () => {
    for (const o of ofType(buildBundle(B), "Observation").filter((x) => x.meta.profile)) {
      expect(o.status).toBe("final");
      expect(o.subject.reference).toMatch(/^Location\//);
      expect(o.effectiveDateTime).toBeTruthy();
      expect(o.performer.length).toBeGreaterThan(0);
      for (const k of valueKeys(o)) expect(["valueCodeableConcept", "valueQuantity"]).toContain(k);
      for (const c of o.component ?? []) {
        expect(valueKeys(c)).toHaveLength(1);
        expect(["valueCodeableConcept", "valueQuantity", "valueString"]).toContain(valueKeys(c)[0]);
      }
    }
  });
});

describe("AI transparency", () => {
  it("labels AIAST only the resources that hold an AI-asserted value", () => {
    expect(resources(buildBundle(C)).filter(hasAiLabel)).toEqual([]);
    const a = buildBundle(A) as R;
    expect(hasAiLabel(ofType(a, "QuestionnaireResponse")[0])).toBe(true);
    expect(hasAiLabel(indicator(a, "morophology"))).toBe(true); // photo-confirmed channel form
    expect(hasAiLabel(indicator(a, "invasiveOrganisms"))).toBe(false); // spoken, matched by word lists
    expect(hasAiLabel(indicator(a, "feelings"))).toBe(true); // free speech read by the AI
    expect(hasAiLabel(indicator(a, "overallAssessment"))).toBe(false); // tapped
    for (const r of [...ofType(a, "Location"), ...ofType(a, "Device"), ...ofType(a, "Provenance")]) expect(hasAiLabel(r)).toBe(false);
  });

  it("does not label a value the citizen corrected, but still names the model as informant", () => {
    const corrected: CheckForFhir = { ...C, sources: { ...C.sources, waterColor: "photo-corrected" }, aiModel: "gpt-6-luna" };
    const bundle = buildBundle(corrected) as R;
    expect(resources(bundle).filter(hasAiLabel)).toEqual([]);
    const model = ofType(bundle, "Device").find((d) => d.deviceName[0].type === "model-name");
    expect(model?.deviceName[0].name).toBe("gpt-6-luna");
    expect(ofType(bundle, "Provenance")[0].agent).toContainEqual(expect.objectContaining({ who: { reference: `Device/${model?.id}` } }));
  });

  it("gives each AI model its own Device, so old provenance never changes meaning", () => {
    const model = (name: string) => ofType(buildBundle({ ...A, aiModel: name }), "Device").find((d) => d.deviceName[0].type === "model-name")!.id;
    expect(model("gpt-6-luna")).not.toBe(model("another-model-2"));
  });

  it("puts an answer-source extension on every component, carrying the answer's own source", () => {
    const bundle = buildBundle(A) as R;
    for (const o of ofType(bundle, "Observation")) {
      for (const c of o.component ?? []) {
        const field = c.code.coding[0].code.split(".")[0];
        expect(c.extension).toEqual([{ url: BROOK_ANSWER_SOURCE, valueCode: (A.sources as R)[field] }]);
        expect(ANSWER_SOURCES).toContain(c.extension[0].valueCode);
      }
    }
    expect(indicator(bundle, "overallAssessment").extension).toEqual([{ url: BROOK_ANSWER_SOURCE, valueCode: "tap" }]);
  });
});

describe("answer values", () => {
  const component = (b: R, group: string, field: string) => indicator(b, group).component.filter((c: R) => c.code.coding[0].code === field);
  const form = (b: R) => ofType(b, "QuestionnaireResponse")[0];

  it("records 'not sure' as asked-unknown and leaves the form item unanswered", () => {
    const a = buildBundle(A) as R;
    expect(component(a, "foam", "waterDischarge")[0].valueCodeableConcept.coding[0]).toMatchObject({ code: "asked-unknown" });
    expect(form(a).item.find((i: R) => i.linkId === "waterDischarge")).toEqual({ linkId: "waterDischarge" });
  });

  it("writes one component per ticked option, and the IG's own 'absent' for none", () => {
    expect(component(buildBundle(A), "morophology", "habitats").map((c: R) => c.valueCodeableConcept.coding[0].code)).toEqual(["habitats.SD", "habitats.RF"]);
    expect(component(buildBundle(C), "morophology", "habitats")[0].valueCodeableConcept.coding[0]).toMatchObject({ system: OAH_CODES, code: "absent" });
  });

  it("codes yes/no as HL7 Y/N and numbers as UCUM quantities", () => {
    const a = buildBundle(A) as R;
    expect(component(a, "hydrology", "hasDams")[0].valueCodeableConcept.coding[0]).toMatchObject({ system: "http://terminology.hl7.org/CodeSystem/v2-0532", code: "Y" });
    expect(component(a, "hydrology", "waterHeight")[0].valueQuantity).toEqual({ value: 0.4, unit: "m", system: "http://unitsofmeasure.org", code: "m" });
    expect(component(a, "hydrology", "numberOfDams")[0].valueQuantity).toMatchObject({ value: 1, code: "1" });
    for (const k of Object.keys(form(a).item.find((i: R) => i.linkId === "numberOfDams").answer[0])) expect(VALUE_KEYS).toContain(k);
  });
});

describe("Brook's published definitions", () => {
  const definitions: R[] = buildDefinitions();
  const byUrl = new Map(definitions.map((d) => [d.url, d]));
  const concepts = (url: string) => {
    const flat = (list: R[]): R[] => list.flatMap((c) => [c, ...flat(c.concept ?? [])]);
    return new Map(flat(byUrl.get(url)!.concept).map((c) => [c.code, c.display]));
  };

  it("match what scripts/fhir-definitions.mjs generates (run it after changing protocol.ts, fhir.ts or the English labels)", () => {
    for (const d of definitions) {
      expect(readFileSync(join(DEFINITIONS_DIR, fileName(d)), "utf8"), fileName(d)).toBe(json(d));
      expect(readFileSync(join(DEFINITIONS_DIR, d.resourceType, d.id), "utf8"), `${d.resourceType}/${d.id}`).toBe(json(d));
    }
    expect(readFileSync(join(DEFINITIONS_DIR, "index.json"), "utf8")).toBe(json(buildIndex(definitions)));
  });

  it("define every Brook code a bundle uses, with the same display", () => {
    const known = { [BROOK_FIELDS]: concepts(BROOK_FIELDS), [BROOK_ANSWERS]: concepts(BROOK_ANSWERS) };
    for (const check of [A, B, C]) {
      for (const c of codings(buildBundle(check)).filter((x) => x.system in known)) {
        expect(known[c.system].has(c.code), `${c.system}#${c.code}`).toBe(true);
        expect(c.display).toBe(known[c.system].get(c.code));
      }
    }
  });

  it("answer every QuestionnaireResponse item with the type its Questionnaire item asks for", () => {
    const questionnaire = definitions.find((d) => d.resourceType === "Questionnaire")!;
    const items = new Map<string, R>();
    const index = (list: R[]) => list.forEach((i) => (items.set(i.linkId, i), index(i.item ?? [])));
    index(questionnaire.item);
    const expected: Record<string, string> = { choice: "valueCoding", boolean: "valueBoolean", integer: "valueInteger", decimal: "valueDecimal", string: "valueString" };
    const check = (list: R[]) =>
      list.forEach((i) => {
        const def = items.get(i.linkId);
        expect(def, i.linkId).toBeDefined();
        for (const a of i.answer ?? []) {
          expect(Object.keys(a), i.linkId).toEqual([expected[def!.type]]);
          if (def!.type === "choice") expect(def!.answerOption.map((o: R) => o.valueCoding.code)).toContain(a.valueCoding.code);
        }
        check(i.item ?? []);
      });
    for (const bundle of [A, B, C].map(buildBundle) as R[]) check(ofType(bundle, "QuestionnaireResponse")[0].item);
  });
});
