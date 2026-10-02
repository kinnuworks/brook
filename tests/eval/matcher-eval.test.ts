// Held-out evaluation of Brook's offline matcher: realistic spoken replies in
// seven languages, written independently of Brook's word lists
// (tests/eval/utterances.json). Writes docs/evidence/matcher-eval.json.
//
// Outcomes: "correct" (understood right), "deferred" (Brook says it didn't
// catch that, so the AI helper or a tap takes over), "wrong" (a wrong answer
// would be recorded: the outcome that matters most, and the one the matcher
// is designed to avoid).

import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { interpretLocally, type LocalIntent } from "../../src/core/matcher";
import { QUESTION_BY_ID, type QuestionId } from "../../src/core/protocol";
import { compose } from "../../src/i18n/compose";
import el from "../../src/i18n/el";
import en from "../../src/i18n/en";
import fr from "../../src/i18n/fr";
import it_ from "../../src/i18n/it";
import nl from "../../src/i18n/nl";
import no from "../../src/i18n/no";
import pt from "../../src/i18n/pt";

interface Utterance {
  lang: string;
  qid: QuestionId;
  text: string;
  expect: LocalIntent;
}

const FILE = new URL("./utterances.json", import.meta.url);
const STRINGS = { en, pt: compose("pt", pt), fr: compose("fr", fr), it: compose("it", it_), nl: compose("nl", nl), no: compose("no", no), el: compose("el", el) };

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x) => b.includes(x));
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 0.051;
  return a === b;
}

function score(u: Utterance, got: LocalIntent): "correct" | "deferred" | "wrong" {
  if (got.kind === "unclear") return u.expect.kind === "unclear" ? "correct" : "deferred";
  if (got.kind !== u.expect.kind) return u.expect.kind === "unclear" || got.kind === "answer" ? "wrong" : "deferred";
  if (got.kind === "answer") return same(got.value, (u.expect as { value: unknown }).value) ? "correct" : "wrong";
  return "correct";
}

describe.runIf(existsSync(FILE))("held-out matcher evaluation", () => {
  it("reports how often replies are understood without AI", () => {
    const items = JSON.parse(readFileSync(FILE, "utf8")) as Utterance[];
    const rows: Record<string, { n: number; correct: number; deferred: number; wrong: number; wrongExamples: string[] }> = {};
    for (const u of items) {
      const s = STRINGS[u.lang as keyof typeof STRINGS];
      const q = QUESTION_BY_ID[u.qid];
      if (!s || !q) continue;
      const got = interpretLocally(q, u.text, s);
      const r = (rows[u.lang] ??= { n: 0, correct: 0, deferred: 0, wrong: 0, wrongExamples: [] });
      const outcome = score(u, got);
      r.n++;
      r[outcome]++;
      if (outcome === "wrong") r.wrongExamples.push(`${u.qid}: "${u.text}" → ${JSON.stringify(got)} (expected ${JSON.stringify(u.expect)})`);
    }
    const total = Object.values(rows).reduce((a, r) => ({ n: a.n + r.n, correct: a.correct + r.correct, deferred: a.deferred + r.deferred, wrong: a.wrong + r.wrong }), { n: 0, correct: 0, deferred: 0, wrong: 0 });
    mkdirSync(new URL("../../docs/evidence/", import.meta.url), { recursive: true });
    writeFileSync(new URL("../../docs/evidence/matcher-eval.json", import.meta.url), JSON.stringify({ at: new Date().toISOString(), total, byLanguage: rows }, null, 2));
    const pct = (x: number, n: number) => `${Math.round((x / Math.max(1, n)) * 100)}%`;
    console.table(Object.fromEntries(Object.entries(rows).map(([l, r]) => [l, { n: r.n, correct: pct(r.correct, r.n), deferred: pct(r.deferred, r.n), wrong: pct(r.wrong, r.n) }])));
    console.log(`ALL: n=${total.n} correct=${pct(total.correct, total.n)} deferred=${pct(total.deferred, total.n)} wrong=${pct(total.wrong, total.n)}`);
    expect(total.n).toBeGreaterThan(0);
  });
});
