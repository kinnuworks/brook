import { describe, expect, it } from "vitest";
import answerLists from "../src/data/oah/answer-lists.json";
import { activeQuestions, isValidAnswer, QUESTION_BY_ID, QUESTIONS, toCitizenSubmission } from "../src/core/protocol";

describe("the protocol matches OneAquaHealth's own app", () => {
  // Codes from api.enora-oah.eu/api/citizens/* (snapshot in src/data/oah).
  const lists = answerLists.data as Record<string, { code: string }[]>;
  const official: Record<string, string> = {
    channelForm: "channel_forms",
    bottomChannelType: "channel_types",
    banksChannelType: "bank_types",
    habitats: "habitats",
    fallenBiomassTypes: "fallen_biomass",
    waterFlow: "water_flows",
    waterColor: "water_colors",
    vegetationTypeLeft: "vegetation_types",
    vegetationTypeRight: "vegetation_types",
    overallAssessment: "stream_assessments",
  };
  for (const [qid, list] of Object.entries(official)) {
    it(`${qid} uses exactly the codes of /api/citizens/${list}`, () => {
      const ours = [...(QUESTION_BY_ID[qid as keyof typeof QUESTION_BY_ID].codes ?? [])].sort();
      const theirs = lists[list].map((o) => o.code).sort();
      expect(ours).toEqual(theirs);
    });
  }

  it("asks about the number of dams only when there are dams", () => {
    expect(activeQuestions({}).some((q) => q.id === "numberOfDams")).toBe(false);
    expect(activeQuestions({ hasDams: true }).some((q) => q.id === "numberOfDams")).toBe(true);
  });

  it("asks which invasive plants only when some were seen", () => {
    expect(activeQuestions({ hasInvasivePlantSpecies: false }).some((q) => q.id === "invasivePlantSpecies")).toBe(false);
    expect(activeQuestions({ hasInvasivePlantSpecies: true }).some((q) => q.id === "invasivePlantSpecies")).toBe(true);
  });
});

describe("toCitizenSubmission", () => {
  const site = { code: "O17", name: "Alna – Bryn stasjon", lat: 59.9078, lon: 10.8128 };

  it("produces OneAquaHealth's CitizenSubmissionPutDTO fields only", () => {
    const dto = toCitizenSubmission(site, {
      channelForm: "U",
      habitats: ["RF", "SD"],
      waterFlow: "FAS",
      hasDams: true,
      numberOfDams: 2,
      waterHeight: 0.4,
      overallAssessment: "MODERATE",
      feelings: { joy: 2, serenity: 3, anger: 1, fear: 0 },
    });
    expect(dto).toEqual({
      latitude: 59.9078,
      longitude: 10.8128,
      researchSite: "O17",
      overallAssessment: "MODERATE",
      channelForm: "U",
      habitats: ["RF", "SD"],
      waterFlow: "FAS",
      hasDams: true,
      numberOfDams: 2,
      waterHeight: 0.4,
      joy: 2,
      serenity: 3,
      anger: 1,
      fear: 0,
    });
  });

  it("stores 'not sure' as null, as the official app does, and leaves unsure lists out", () => {
    const dto = toCitizenSubmission(site, { pipes: null, habitats: null, overallAssessment: "GOOD" });
    expect(dto.pipes).toBeNull();
    expect("habitats" in dto).toBe(false);
  });

  it("drops a dependent answer whose condition no longer holds", () => {
    const dto = toCitizenSubmission(site, { hasDams: false, numberOfDams: 3, overallAssessment: "GOOD" });
    expect("numberOfDams" in dto).toBe(false);
  });
});

describe("isValidAnswer guards everything that came from speech or AI", () => {
  it("rejects codes from another question", () => {
    expect(isValidAnswer(QUESTION_BY_ID.channelForm, "NAT")).toBe(false);
    expect(isValidAnswer(QUESTION_BY_ID.channelForm, "U")).toBe(true);
  });
  it("rejects duplicates and unknown codes in lists", () => {
    expect(isValidAnswer(QUESTION_BY_ID.habitats, ["RF", "RF"])).toBe(false);
    expect(isValidAnswer(QUESTION_BY_ID.habitats, ["XX"])).toBe(false);
    expect(isValidAnswer(QUESTION_BY_ID.habitats, [])).toBe(true);
  });
  it("keeps numbers in range", () => {
    expect(isValidAnswer(QUESTION_BY_ID.waterHeight, 0.5)).toBe(true);
    expect(isValidAnswer(QUESTION_BY_ID.waterHeight, 50)).toBe(false);
  });
  it("never lets the overall rating be 'not sure'", () => {
    expect(isValidAnswer(QUESTION_BY_ID.overallAssessment, null)).toBe(false);
  });
  it("accepts feelings only on the 0–5 scale", () => {
    expect(isValidAnswer(QUESTION_BY_ID.feelings, { joy: 5, fear: 0 })).toBe(true);
    expect(isValidAnswer(QUESTION_BY_ID.feelings, { joy: 6 })).toBe(false);
    expect(isValidAnswer(QUESTION_BY_ID.feelings, { happiness: 3 })).toBe(false);
  });
  it("covers every question", () => {
    expect(QUESTIONS.length).toBe(25);
  });
});
