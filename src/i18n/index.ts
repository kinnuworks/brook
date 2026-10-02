import { useSettings } from "@/lib/settings";
import type { Lang } from "@/core/protocol";
import en from "./en";
import type { Strings } from "./types";

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };

const loaded: Partial<Record<Lang, Strings>> = { en };
const loaders: Record<Exclude<Lang, "en">, () => Promise<{ default: DeepPartial<Strings> }>> = {
  pt: () => import("./pt"),
  fr: () => import("./fr"),
  it: () => import("./it"),
  nl: () => import("./nl"),
  no: () => import("./no"),
  el: () => import("./el"),
};

function merge<T>(base: T, over: DeepPartial<T> | undefined): T {
  if (!over) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) return (over as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" ? merge(b, v as never) : v ?? b;
  }
  return out as T;
}

export async function loadLang(lang: Lang): Promise<Strings> {
  if (loaded[lang]) return loaded[lang]!;
  if (lang === "en") return en;
  const mod = await loaders[lang]();
  loaded[lang] = merge(en, mod.default);
  return loaded[lang]!;
}

export function stringsFor(lang: Lang): Strings {
  return loaded[lang] ?? en;
}

/** The current language's strings; re-renders when the language changes or finishes loading. */
export function useStrings(): Strings {
  const lang = useSettings((s) => s.lang);
  useSettings((s) => s.langLoaded);
  return stringsFor(lang);
}

/** "Hello {name}" + { name: "Ana" } → "Hello Ana". */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Strings };
