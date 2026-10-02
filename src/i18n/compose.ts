// Builds a language's full string set: English as the base, the language's
// own file over it, then the later additions in extra.ts. Pure, so tests use it too.

import en from "./en";
import { EXTRA } from "./extra";
import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) return (over as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" ? merge(b, v as never) : (v ?? b);
  }
  return out as T;
}

export function compose(lang: string, own: DeepPartial<Strings>): Strings {
  return merge(merge(en, own), EXTRA[lang]);
}

/** Only the language's own strings plus extras, with no English fallback (for completeness checks). */
export function ownOnly(lang: string, own: DeepPartial<Strings>): DeepPartial<Strings> {
  return merge(own as Strings, EXTRA[lang] as DeepPartial<Strings>);
}
