import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LANGS, type Lang } from "@/core/protocol";

interface Settings {
  lang: Lang;
  langLoaded: number;
  voiceOn: boolean;
  handsFree: boolean;
  sharePhotos: boolean;
  clientId: string;
  setLang: (lang: Lang) => void;
  setVoiceOn: (on: boolean) => void;
  setHandsFree: (on: boolean) => void;
  setSharePhotos: (on: boolean) => void;
}

function guessLang(): Lang {
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().split("-")[0];
    const mapped = base === "nb" || base === "nn" ? "no" : base;
    if ((LANGS as readonly string[]).includes(mapped)) return mapped as Lang;
  }
  return "en";
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      lang: guessLang(),
      langLoaded: 0,
      voiceOn: true,
      handsFree: false,
      sharePhotos: true,
      clientId: crypto.randomUUID(),
      setLang: (lang) => {
        set({ lang });
        void import("@/i18n").then(({ loadLang }) => loadLang(lang)).then(() => set((s) => ({ langLoaded: s.langLoaded + 1 })));
        document.documentElement.lang = lang;
      },
      setVoiceOn: (voiceOn) => set({ voiceOn }),
      setHandsFree: (handsFree) => set({ handsFree }),
      setSharePhotos: (sharePhotos) => set({ sharePhotos }),
    }),
    {
      name: "brook-settings",
      partialize: (s) => ({ lang: s.lang, voiceOn: s.voiceOn, handsFree: s.handsFree, sharePhotos: s.sharePhotos, clientId: s.clientId }),
    },
  ),
);
