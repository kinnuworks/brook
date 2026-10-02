import { describe, expect, it } from "vitest";
import { interpretLocally, parseNumber } from "../src/core/matcher";
import { QUESTION_BY_ID, type QuestionId } from "../src/core/protocol";
import { compose } from "../src/i18n/compose";
import en from "../src/i18n/en";
import fr from "../src/i18n/fr";
import nl from "../src/i18n/nl";
import no from "../src/i18n/no";

const S = { en, fr: compose("fr", fr), nl: compose("nl", nl), no: compose("no", no) };
const ask = (lang: keyof typeof S, qid: QuestionId, text: string) => interpretLocally(QUESTION_BY_ID[qid], text, S[lang]);
const picks = (r: ReturnType<typeof ask>, code: string) =>
  r.kind === "answer" && (Array.isArray(r.value) ? (r.value as string[]).includes(code) : r.value === code);

describe("ordinary words are not option letters", () => {
  it("French 'a' in a sentence is not option A", () => {
    expect(picks(ask("fr", "waterColor", "il y a de l'eau partout"), "CL")).toBe(false);
  });
  it("Norwegian 'å' is not option A", () => {
    expect(picks(ask("no", "channelForm", "det er vanskelig å si"), "FLAT")).toBe(false);
    expect(picks(ask("no", "waterFlow", "vanskelig å se herfra"), "FAS")).toBe(false);
  });
  it("a letter alone still works", () => {
    expect(ask("en", "waterColor", "b")).toEqual({ kind: "answer", value: "MU" });
  });
});

describe("negations drop what they negate", () => {
  it.each([
    ["fr", "habitats", "il n'y a pas de bancs de sable", "SB"],
    ["fr", "habitats", "aucun banc de sable", "SB"],
    ["no", "habitats", "det er ingen sandbanker", "SB"],
    ["no", "habitats", "ikke noen sandbanker", "SB"],
    ["nl", "fallenBiomassTypes", "zonder takken", "FB"],
    ["en", "habitats", "no sand banks", "SB"],
  ] as const)("%s %s “%s” does not pick %s", (lang, qid, text, code) => {
    expect(picks(ask(lang, qid, text), code)).toBe(false);
  });

  it("keeps what follows a negated word", () => {
    expect(ask("en", "bottomChannelType", "not concrete, it's gravel")).toEqual({ kind: "answer", value: "NAT" });
    expect(ask("en", "habitats", "no sand banks but lots of stones")).toEqual({ kind: "answer", value: ["SD"] });
  });

  it("a leading 'no' does not swallow the answer", () => {
    expect(ask("en", "channelForm", "no, it's a U")).toEqual({ kind: "answer", value: "U" });
    expect(ask("en", "channelForm", "no it's a U")).toEqual({ kind: "answer", value: "U" });
  });
});

describe("numbers", () => {
  it("'a couple' is two", () => {
    expect(parseNumber("a couple of them", en, "count")).toBe(2);
  });
});

import it_ from "../src/i18n/it";
import el from "../src/i18n/el";
import pt from "../src/i18n/pt";

describe("negation across a verb (pt, it, el) and in English", () => {
  const T = { pt: compose("pt", pt), it: compose("it", it_), el: compose("el", el) };
  it.each([
    ["pt", "não é boa", "GOOD"],
    ["it", "non è buono", "GOOD"],
    ["el", "δεν είναι καλή", "GOOD"],
  ] as const)("%s “%s” is not %s", (lang, text, code) => {
    const r = interpretLocally(QUESTION_BY_ID.overallAssessment, text, T[lang]);
    expect(r.kind === "answer" && r.value === code).toBe(false);
  });
  it("English 'not very good' is not GOOD, and 'I can't see any riffles' is not RF", () => {
    expect(picks(ask("en", "overallAssessment", "not very good"), "GOOD")).toBe(false);
    expect(picks(ask("en", "habitats", "I can't see any riffles"), "RF")).toBe(false);
  });
  it("number words in centimetres", () => {
    expect(parseNumber("about ten centimetres", en, "metres")).toBe(0.1);
  });
});

describe("questions about a word are help requests", () => {
  it.each(["what does U shape mean?", "what's a riffle?", "what is a weir?"])("“%s”", (text) => {
    expect(ask("en", "channelForm", text)).toEqual({ kind: "help" });
  });
});
