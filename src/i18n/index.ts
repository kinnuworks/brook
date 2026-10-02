import { useSettings } from "@/lib/settings";
import type { Lang } from "@/core/protocol";
import { compose } from "./compose";
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

export async function loadLang(lang: Lang): Promise<Strings> {
  if (loaded[lang]) return loaded[lang]!;
  if (lang === "en") return en;
  const mod = await loaders[lang]();
  loaded[lang] = compose(lang, mod.default);
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
