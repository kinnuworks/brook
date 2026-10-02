import { Globe } from "lucide-react";
import { LANGS, type Lang } from "@/core/protocol";
import { useSettings } from "@/lib/settings";
import { useStrings } from "@/i18n";

const NAMES: Record<Lang, string> = { en: "English", pt: "Português", fr: "Français", it: "Italiano", nl: "Nederlands", no: "Norsk", el: "Ελληνικά" };

export function LangPicker({ onChange }: { onChange?: (lang: Lang) => void }) {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const s = useStrings();
  return (
    <label className="relative inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white px-3 ring-1 ring-line hover:ring-aqua">
      <Globe className="size-4 text-deep" aria-hidden />
      <span className="sr-only">{s.ui.chooseLanguage}</span>
      <select
        value={lang}
        onChange={(e) => {
          const l = e.target.value as Lang;
          setLang(l);
          onChange?.(l);
        }}
        className="appearance-none bg-transparent pr-1 text-[15px] font-semibold text-deep-900 outline-none"
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>
            {NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

export { NAMES as LANG_NAMES };
