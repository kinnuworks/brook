import { describe, expect, it } from "vitest";
import { interpretLocally, normalize, parseFeelings, parseNumber } from "../src/core/matcher";
import { QUESTION_BY_ID } from "../src/core/protocol";
import en from "../src/i18n/en";

const ask = (qid: keyof typeof QUESTION_BY_ID, text: string) => interpretLocally(QUESTION_BY_ID[qid], text, en);

describe("Brook understands everyday replies without AI", () => {
  it.each([
    ["channelForm", "it's kind of a U with steep sides", "U"],
    ["channelForm", "pretty flat and wide", "FLAT"],
    ["channelForm", "a narrow V", "V"],
    ["bottomChannelType", "concrete I think", "ART"],
    ["bottomChannelType", "not concrete, it's gravel", "NAT"],
    ["banksChannelType", "loose stones piled up", "LAS"],
    ["waterFlow", "it's flowing quite fast", "FAS"],
    ["waterColor", "there's foam on top", "FO"],
    ["vegetationTypeLeft", "mostly bushes", "B"],
    ["overallAssessment", "I'd say it's okay, moderate", "MODERATE"],
  ] as const)("%s ← “%s”", (qid, text, code) => {
    expect(ask(qid, text)).toEqual({ kind: "answer", value: code });
  });

  it("hears several habitats at once", () => {
    const r = ask("habitats", "some riffles and a few stones, and weeds in the water");
    expect(r.kind).toBe("answer");
    expect(new Set((r as { value: string[] }).value)).toEqual(new Set(["RF", "SD", "AV"]));
  });

  it("understands 'none' for lists", () => {
    expect(ask("fallenBiomassTypes", "none")).toEqual({ kind: "answer", value: [] });
  });

  it("reads yes and no", () => {
    expect(ask("pipes", "yes there are two pipes")).toEqual({ kind: "answer", value: true });
    expect(ask("pipes", "no, I don't think so")).toEqual({ kind: "answer", value: false });
  });

  it("knows when someone isn't sure, needs help, or wants it again", () => {
    expect(ask("waterDischarge", "I'm not sure")).toEqual({ kind: "notSure" });
    expect(ask("channelForm", "what does that mean?")).toEqual({ kind: "help" });
    expect(ask("channelForm", "say that again")).toEqual({ kind: "repeat" });
  });

  it("says unclear rather than guessing", () => {
    expect(ask("channelForm", "the weather is nice today")).toEqual({ kind: "unclear" });
    expect(ask("waterFlow", "fast but also dry")).toEqual({ kind: "unclear" });
  });

  it("reads OneAquaHealth's illustration letters", () => {
    expect(ask("waterColor", "option b")).toEqual({ kind: "answer", value: "MU" });
  });
});

describe("numbers and feelings", () => {
  it.each([
    ["about half a metre", 0.5],
    ["knee deep", 0.5],
    ["30 cm", 0.3],
    ["0,8 m", 0.8],
    ["1.5", 1.5],
  ] as const)("depth “%s” → %s m", (text, value) => {
    expect(parseNumber(text, en, "metres")).toBe(value);
  });

  it("counts barriers", () => {
    expect(parseNumber("two of them", en, "count")).toBe(2);
  });

  it("turns words into the four feelings", () => {
    expect(parseFeelings("very calm and a bit happy", en)).toEqual({ joy: 2, serenity: 5, anger: 0, fear: 0 });
    expect(parseFeelings("nothing in particular", en)).toBeNull();
  });

  it("normalizes accents, including Greek", () => {
    expect(normalize("Ναί, Σίγουρα!")).toBe("ναι , σιγουρα");
    expect(normalize("0,8 m")).toBe("0.8 m");
  });
});
