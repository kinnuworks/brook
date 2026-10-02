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
