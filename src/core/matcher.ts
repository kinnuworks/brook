// Brook's first pair of ears: understands a spoken or typed reply to one
// question using only word lists, on the phone, with no AI and no network.
// Anything it is unsure about comes back "unclear", and only then is the
// optional AI interpreter asked.

import type { AnswerValue, Feelings, QuestionDef } from "./protocol";
import { FEELINGS } from "./protocol";
import type { Strings } from "../i18n/types";

export type LocalIntent =
  | { kind: "answer"; value: AnswerValue }
  | { kind: "notSure" }
  | { kind: "help" }
  | { kind: "repeat" }
  | { kind: "back" }
  | { kind: "unclear" };

/** Lower case, accents and punctuation removed, single spaces. Works for Greek too. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ς/g, "σ")
    .replace(/[’'`]/g, "'")
    .replace(/[^\p{L}\p{N}'.,\- ]+/gu, " ")
    .replace(/[,]/g, " , ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does `phrase` occur in `text` as whole words? Both must already be normalized. */
export function hasPhrase(text: string, phrase: string): boolean {
  const p = normalize(phrase);
  if (!p) return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[\\s,])${escaped}(?=$|[\\s,.])`, "u").test(text);
}

function findPhrase(text: string, phrases: readonly string[]): string | null {
  let best: string | null = null;
  for (const phrase of phrases) {
    if (hasPhrase(text, phrase) && (!best || normalize(phrase).length > normalize(best).length)) best = phrase;
  }
  return best;
}

/**
 * Removes "not X" / "no X" spans so "not concrete, it's natural" does not
 * also match "concrete". Only the word right after the negation is dropped.
 */
function dropNegated(text: string, s: Strings): string {
  const negations = ["not", "no", "isn't", "aren't", "nao", "pas", "non", "niet", "geen", "ikke", "ikkje", "δεν", "οχι", "μη"];
  void s;
  let out = text;
  for (const n of negations) {
    out = out.replace(new RegExp(`(^|\\s)${n}\\s+[\\p{L}\\-]+`, "gu"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Options mentioned in the text, best (longest) match per option. */
function matchOptions(text: string, q: QuestionDef, s: Strings): { code: string; strength: number }[] {
  const options = s.q[q.id].options ?? {};
  const hits: { code: string; strength: number }[] = [];
  for (const code of q.codes ?? []) {
    const opt = options[code];
    if (!opt) continue;
    const phrases = [...opt.say, opt.label];
    const hit = findPhrase(text, phrases);
    if (hit) hits.push({ code, strength: normalize(hit).length });
  }
  // OneAquaHealth's illustrations are lettered A, B, C… so "option B" or just "B" counts.
  if (!hits.length && q.letters) {
    const m = text.match(/(?:^|\s)(?:option|letter|opcao|lettre|opzione|optie|alternativ|επιλογη)?\s*([a-e])(?:$|\s)/u);
    if (m) {
      const i = q.letters.indexOf(m[1].toUpperCase());
      if (i >= 0 && q.codes?.[i]) hits.push({ code: q.codes[i], strength: 1 });
    }
  }
  return hits;
}

/** "0.5", "0,5 m", "30 cm", "half a metre", "knee deep", "two" → a number in metres or a count. */
export function parseNumber(text: string, s: Strings, unit: "metres" | "count"): number | null {
  const t = normalize(text);
  if (unit === "metres") {
    for (const [phrase, value] of Object.entries(s.units.depth)) {
      if (hasPhrase(t, phrase)) return value;
    }
  }
  const digits = t.match(/(\d+(?:[.,]\d+)?)\s*([\p{L}]+)?/u);
  if (digits) {
    let value = Number(digits[1].replace(",", "."));
    const word = digits[2] ?? "";
    if (unit === "metres" && s.units.centimetre.map(normalize).includes(word)) value = value / 100;
    else if (unit === "metres" && !word && value > 10) value = value / 100; // "30" almost certainly means cm
    return Number.isFinite(value) ? value : null;
  }
  if (unit === "metres" && s.units.half.some((h) => hasPhrase(t, h))) return 0.5;
  for (const [word, value] of Object.entries(s.numbers)) {
    if (hasPhrase(t, word)) return value;
  }
  return null;
}

/** "calm and a bit happy" → serenity 4, joy 2, others 0. */
export function parseFeelings(text: string, s: Strings): Feelings | null {
  const t = normalize(text);
  const strong = ["very", "really", "so", "extremely", "muito", "tres", "molto", "heel", "zeer", "veldig", "πολυ"];
  const mild = ["a bit", "a little", "slightly", "somewhat", "um pouco", "un peu", "un po", "een beetje", "litt", "λιγο"];
  const out: Feelings = {};
  let found = false;
  for (const key of FEELINGS) {
    const hit = findPhrase(t, s.feelingWords[key]);
    if (!hit) {
      out[key] = 0;
      continue;
    }
    found = true;
    const at = t.indexOf(normalize(hit));
    const before = t.slice(Math.max(0, at - 18), at);
    out[key] = strong.some((w) => before.includes(w)) ? 5 : mild.some((w) => before.includes(w)) ? 2 : 4;
  }
  return found ? out : null;
}

export function interpretLocally(q: QuestionDef, raw: string, s: Strings): LocalIntent {
  const text = normalize(raw);
  if (!text) return { kind: "unclear" };
  const w = s.words;

  if (findPhrase(text, w.repeat) && text.split(" ").length <= 4) return { kind: "repeat" };
  if (findPhrase(text, w.back) && text.split(" ").length <= 4) return { kind: "back" };

  const positive = dropNegated(text, s);

  switch (q.kind) {
    case "single":
    case "rating": {
      const hits = matchOptions(positive, q, s);
      if (hits.length === 1) return { kind: "answer", value: hits[0].code };
      if (hits.length > 1) {
        const sorted = [...hits].sort((a, b) => b.strength - a.strength);
        if (sorted[0].strength > sorted[1].strength + 2) return { kind: "answer", value: sorted[0].code };
        return { kind: "unclear" };
      }
      break;
    }
    case "multi": {
      const hits = matchOptions(positive, q, s);
      if (hits.length) return { kind: "answer", value: hits.map((h) => h.code) };
      if (findPhrase(text, w.none)) return { kind: "answer", value: [] };
      break;
    }
    case "yesno": {
      if (findPhrase(text, w.notSure)) return { kind: "notSure" };
      const yes = findPhrase(text, w.yes);
      const no = findPhrase(text, w.no);
      if (yes && !no) return { kind: "answer", value: true };
      if (no && !yes) return { kind: "answer", value: false };
      break;
    }
    case "number": {
      const value = parseNumber(raw, s, q.id === "waterHeight" ? "metres" : "count");
      if (value !== null && value >= (q.min ?? -Infinity) && value <= (q.max ?? Infinity)) {
        return { kind: "answer", value: q.id === "numberOfDams" ? Math.round(value) : Math.round(value * 100) / 100 };
      }
      break;
    }
    case "text": {
      if (findPhrase(text, w.notSure)) return { kind: "notSure" };
      if (findPhrase(text, w.help) && text.split(" ").length <= 5) return { kind: "help" };
      const value = raw.trim().slice(0, 300);
      if (value.length >= 2) return { kind: "answer", value };
      break;
    }
    case "feelings": {
      const feelings = parseFeelings(raw, s);
      if (feelings) return { kind: "answer", value: feelings };
      break;
    }
  }

  if (findPhrase(text, w.notSure)) return q.allowNotSure ? { kind: "notSure" } : { kind: "unclear" };
  if (findPhrase(text, w.help)) return { kind: "help" };
  return { kind: "unclear" };
}
