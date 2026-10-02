import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../src/core/protocol";
import el from "../src/i18n/el";
import en from "../src/i18n/en";
import fr from "../src/i18n/fr";
import it_ from "../src/i18n/it";
import nl from "../src/i18n/nl";
import no from "../src/i18n/no";
import pt from "../src/i18n/pt";

import { ownOnly } from "../src/i18n/compose";

const LANGS = Object.fromEntries(Object.entries({ pt, fr, it: it_, nl, no, el }).map(([k, v]) => [k, ownOnly(k, v)])) as Record<string, unknown>;

/** Every leaf path in an object, arrays treated as leaves. */
// Word dictionaries are keyed by words of each language, so only their presence is checked.
const DICTIONARIES = new Set(["numbers", "units.depth"]);

function paths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj) || DICTIONARIES.has(prefix)) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => paths(v, prefix ? `${prefix}.${k}` : k));
}
function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");

const enPaths = paths(en);

describe.each(Object.entries(LANGS))("%s translation", (lang, strings) => {
  it("translates every key", () => {
    const missing = enPaths.filter((p) => get(strings, p) === undefined);
    expect(missing, `${lang} is missing:\n${missing.join("\n")}`).toEqual([]);
  });

  it("keeps every {placeholder}", () => {
    const broken = enPaths.filter((p) => {
      const a = get(en, p);
      const b = get(strings, p);
      return typeof a === "string" && typeof b === "string" && placeholders(a) !== placeholders(b);
    });
    expect(broken).toEqual([]);
  });

  it("never lets one phrase mean two answers of the same question", () => {
    const clashes: string[] = [];
    const q = (strings as { q?: Record<string, { options?: Record<string, { say?: string[] }> }> }).q ?? {};
    for (const def of QUESTIONS) {
      const opts = q[def.id]?.options;
      if (!opts) continue;
      const owner = new Map<string, string>();
      for (const [code, o] of Object.entries(opts)) {
        for (const phrase of o.say ?? []) {
          const key = phrase.toLowerCase().trim();
          if (owner.has(key) && owner.get(key) !== code) clashes.push(`${def.id}: "${phrase}" in ${owner.get(key)} and ${code}`);
          owner.set(key, code);
        }
      }
    }
    expect(clashes).toEqual([]);
  });
});
