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
    .replace(/(\d),(\d)/g, "$1.$2") // European decimal comma: "0,8" is 0.8
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

// Words that negate what follows, in the seven languages (accents already stripped).
const NEGATIONS = new Set([
  "not", "no", "isn't", "aren't", "without", "never", "none", "can't", "cant", "cannot", "don't", "dont", "doesn't", "didn't", "wasn't", "weren't",
  "nao", "nem", "sem", "nenhum", "nenhuma",
  "pas", "aucun", "aucune", "sans", "ni", "jamais",
  "non", "senza", "nessun", "nessuno", "nessuna",
  "niet", "geen", "zonder", "nooit",
  "ikke", "ikkje", "ingen", "uten", "aldri",
  "δεν", "οχι", "μη", "χωρισ", "κανενα", "καμια",
]);
// Small words that may sit between a negation and the thing it negates ("pas DE bancs", "ikke NOEN").
const FILLERS = new Set([
  "a", "an", "the", "any", "some", "of", "there", "is", "are",
  "de", "des", "du", "d'", "l'", "la", "le", "les", "un", "une", "y", "a",
  "di", "da", "del", "della", "dei", "delle", "il", "lo", "gli", "i", "uno", "una", "c'e", "ci",
  "do", "dos", "das", "o", "os", "as", "um", "uma", "ha",
  "het", "een", "er", "zijn", "is",
  "noe", "noen", "en", "et", "ei", "det", "er",
  "το", "τα", "η", "ο", "οι", "ενα", "μια", "εχει", "υπαρχει", "υπαρχουν",
  // Verbs that sit between a negation and the answer: "não É boa", "non È buono", "δεν ΕΙΝΑΙ καλή",
  // "I can't SEE any". Not English "it's": in "no it's a U" the "no" is an interjection.
  "look", "looks", "see", "spot", "notice",
  "e", "esta", "sao", "estao", "vejo", "parece", "ve",
  "sono", "sta", "vedo", "sembra",
  "voir", "vois", "semble",
  "zie", "lijkt", "ziet",
  "ser", "ser ut", "ar",
  "ειναι", "βλεπω", "φαινεται",
  // intensifiers: "not VERY good", "não MUITO boa"
  "very", "really", "so", "too", "that", "quite", "particularly",
  "muito", "tao", "bem", "molto", "cosi", "troppo", "tres", "vraiment", "si", "heel", "zeer", "erg", "echt", "veldig", "sa", "spesielt", "πολυ", "τοσο",
]);

/**
 * Drops what a negation negates, so "not concrete, it's gravel" or "il n'y a
 * pas de bancs de sable" don't select the very thing being denied. After a
 * negation word, fillers are skipped and words belonging to this question's
 * answers are dropped; the first other word ends the negation, so "no, it's a
 * U" still keeps its U.
 */
function dropNegated(text: string, vocabulary: Set<string>): string {
  const tokens = text.split(" ");
  const keep: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const bare = tok.replace(/^(?:n'|l'|d'|c')/, "");
    if (!NEGATIONS.has(tok) && !NEGATIONS.has(bare)) {
      keep.push(tok);
      continue;
    }
    let j = i + 1;
    while (j < tokens.length) {
      const w = tokens[j];
      const wb = w.replace(/^(?:l'|d'|qu')/, "");
      if (FILLERS.has(w) || FILLERS.has(wb)) {
        j++;
        continue;
      }
      if (vocabulary.has(w) || vocabulary.has(wb)) {
        j++;
        continue;
      }
      break;
    }
    i = j - 1;
  }
  return keep.join(" ").replace(/\s+/g, " ").trim();
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
  // OneAquaHealth's illustrations are lettered A, B, C… so "option B" or just "B" counts, but only as the
  // whole reply: French "a", Italian "e" and Norwegian "å" are ordinary words inside a sentence.
  if (!hits.length && q.letters) {
    const m = text.match(/^(?:(?:option|letter|opcao|opcion|lettre|opzione|lettera|optie|letter|alternativ|bokstav|επιλογη|γραμμα)\s+)?([a-e])$/u);
    if (m) {
      const i = q.letters.indexOf(m[1].toUpperCase());
      if (i >= 0 && q.codes?.[i]) hits.push({ code: q.codes[i], strength: 1 });
    }
  }
  return hits;
}

// Tens and approximate numbers across the seven languages ("vinte e cinco", "une quarantaine",
// "een centimeter of dertig"). Language-agnostic: these words don't collide between languages.
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
  vingt: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  dizaine: 10, vingtaine: 20, trentaine: 30, quarantaine: 40, cinquantaine: 50, soixantaine: 60,
  venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90,
  decina: 10, ventina: 20, trentina: 30, quarantina: 40, cinquantina: 50,
  twintig: 20, dertig: 30, veertig: 40, vijftig: 50, zestig: 60, zeventig: 70, tachtig: 80, negentig: 90,
  tjue: 20, tjueen: 21, tretti: 30, forti: 40, forty_no: 40, femti: 50, seksti: 60, sytti: 70, atti: 80, nitti: 90,
  εικοσι: 20, τριαντα: 30, σαραντα: 40, πενηντα: 50, εξηντα: 60, εβδομηντα: 70, ογδοντα: 80, ενενηντα: 90,
};
const TENS_PREFIXES = Object.entries(TENS).filter(([w]) => w.length >= 5).sort((a, b) => b[0].length - a[0].length);

function tensValue(t: string, s: Strings): number | null {
  const tokens = t.split(" ");
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    let tens = TENS[tok];
    let rest = "";
    if (tens === undefined) {
      // One-word compounds: "venticinque", "vingt-cinq", "tjuefem", "vijfentwintig".
      const pre = TENS_PREFIXES.find(([w]) => tok.startsWith(w));
      const suf = TENS_PREFIXES.find(([w]) => tok.endsWith(w) && tok.length > w.length);
      if (pre) [tens, rest] = [pre[1], tok.slice(pre[0].length).replace(/^[-e]+/, "")];
      else if (suf) [tens, rest] = [suf[1], tok.slice(0, tok.length - suf[0].length).replace(/en$/, "")];
    }
    if (tens === undefined) continue;
    const units = Object.entries(s.numbers).filter(([, v]) => v >= 1 && v <= 9);
    const unitWord = rest || tokens.slice(i + 1, i + 3).filter((w) => !s.words.and.map(normalize).includes(w) && w !== "e" && w !== "et" && w !== "og" && w !== "και")[0];
    const unit = units.find(([w]) => normalize(w) === unitWord)?.[1] ?? 0;
    return tens + unit;
  }
  return null;
}

/** "0.5", "0,5 m", "30 cm", "half a metre", "knee deep", "two" → a number in metres or a count. */
export function parseNumber(text: string, s: Strings, unit: "metres" | "count"): number | null {
  const t = normalize(text.replace(/(\d),(\d)/g, "$1.$2"));
  if (unit === "metres") {
    for (const [phrase, value] of Object.entries(s.units.depth).sort((a, b) => b[0].length - a[0].length)) {
      if (hasPhrase(t, phrase)) return value;
    }
  }
  const inCentimetres = unit === "metres" && s.units.centimetre.some((c) => hasPhrase(t, c));
  const digits = t.match(/(\d+(?:\.\d+)?)\s*([\p{L}]+)?/u);
  if (digits) {
    let value = Number(digits[1].replace(",", "."));
    const word = digits[2] ?? "";
    if (unit === "metres" && (inCentimetres || s.units.centimetre.map(normalize).includes(word))) value = value / 100;
    else if (unit === "metres" && !word && value > 10) value = value / 100; // "30" almost certainly means cm
    return Number.isFinite(value) ? value : null;
  }
  const tens = tensValue(t, s);
  if (tens !== null) return unit === "metres" ? (inCentimetres || tens > 10 ? tens / 100 : tens) : tens;
  if (unit === "metres" && s.units.half.some((h) => hasPhrase(t, h))) return 0.5;
  // Longest phrase first, so "a couple" is 2 and not the 1 of "a".
  for (const [word, value] of Object.entries(s.numbers).sort((a, b) => b[0].length - a[0].length)) {
    if (!hasPhrase(t, word)) continue;
    if (!inCentimetres) return value;
    // "one centimetre of water" is not a stream depth anyone measures: ask again rather than guess.
    return value >= 3 ? value / 100 : null;
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

  // "Not (quite) sure", "não tenho bem a certeza", "je ne suis pas sûr", "vet ikke helt": uncertainty, not "no".
  const tokens = text.split(" ");
  const negated = tokens.some((tk) => NEGATIONS.has(tk) || NEGATIONS.has(tk.replace(/^(?:n'|l'|d'|c')/, "")));
  if (negated && /(sure|certain|certez|cert[oa]\b|\bsur\b|\bsure\b|sicur|zeker|sikker|σιγουρ|\bidea\b|\bidee\b|\bknow\b|\bsei\b|\bsais\b|\bsabe\b|\bweet\b|\bvet\b|ξερω)/u.test(text)) {
    if (q.allowNotSure) return { kind: "notSure" };
  }
  // A question about a term ("what's a riffle?", "hva er et stryk?") is a request for help, not an answer.
  const helpAtStart = w.help.some((h) => {
    const nh = normalize(h);
    return text.startsWith(nh + " ") || text === nh || text.startsWith(nh + "?");
  });
  if (helpAtStart && (raw.trim().endsWith("?") || tokens.length <= 6)) return { kind: "help" };

  const vocabulary = new Set(
    Object.values(s.q[q.id].options ?? {}).flatMap((o) => [...o.say, o.label].flatMap((p) => normalize(p).split(" "))),
  );
  const positive = dropNegated(text, vocabulary);

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
      if (findPhrase(text, w.help)) return { kind: "help" };
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
