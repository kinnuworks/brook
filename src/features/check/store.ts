// The stream check as a conversation. The order of questions, what counts as
// an answer and what gets stored are fixed by OneAquaHealth's protocol
// (core/protocol). This store decides what Brook says next and keeps the
// record of where every answer came from.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  activeQuestions,
  isValidAnswer,
  QUESTION_BY_ID,
  type AnswerValue,
  type AnswerValues,
  type Lang,
  type PhotoSlot,
  type QuestionId,
  type Section,
  type SiteRef,
} from "@/core/protocol";
import type { AnswerSource } from "@/core/fhir";
import { secondLooks, type SecondLook } from "@/core/rules";
import type { RecentWeather } from "@/core/weather";
import type { Suggestion } from "@/lib/api";
import { fmt, stringsFor } from "@/i18n";

export type Step = "intro" | "safety" | "site" | "photos" | "analyzing" | "question" | "secondLook" | "review" | "submitting";
export type Via = "voice" | "tap" | "text";

export type Msg =
  | { id: string; from: "brook"; text: string; tone?: "help" | "safety" | "section" | "info" | "warm"; qid?: QuestionId; section?: Section }
  | { id: string; from: "user"; text: string; via: Via }
  | { id: string; from: "receipt"; qid: QuestionId; value: AnswerValue; source: AnswerSource };

export interface QEvent {
  qid: QuestionId;
  type: "asked" | "help" | "repeat" | "notSure" | "unclear" | "aiInterpret" | "answered" | "changed" | "suggestionShown" | "suggestionAccepted" | "suggestionRejected";
  via?: Via;
  ms?: number;
  t: number;
}

export interface Photo {
  dataUrl: string;
  b64: string;
  sample?: boolean;
}

interface CheckState {
  id: string;
  lang: Lang;
  step: Step;
  startedAt: string | null;
  site: SiteRef | null;
  weather: RecentWeather | null;
  photos: Partial<Record<PhotoSlot, Photo>>;
  suggestions: Partial<Record<QuestionId, Suggestion>>;
  aiModel: string | null;
  biodiversity: string | null;
  answers: AnswerValues;
  sources: Partial<Record<QuestionId, AnswerSource>>;
  current: QuestionId | null;
  questionShownAt: number;
  editing: boolean;
  looks: SecondLook[];
  lookIndex: number;
  lookDecisions: { id: string; decision: "keep" | "change" }[];
  messages: Msg[];
  events: QEvent[];
  /** What Brook should say aloud right now; the page speaks it when it changes. */
  say: { id: string; text: string } | null;
  usedVoice: boolean;
  usedTap: boolean;
  aiAvailable: boolean;

  begin: (lang: Lang) => void;
  reset: () => void;
  setLang: (lang: Lang) => void;
  setAiAvailable: (on: boolean) => void;
  confirmSafety: () => void;
  chooseSite: (site: SiteRef, cityName?: string) => void;
  setWeather: (w: RecentWeather | null) => void;
  setPhoto: (slot: PhotoSlot, photo: Photo | null) => void;
  startAnalyzing: () => void;
  finishPhotos: (r: { suggestions?: Partial<Record<QuestionId, Suggestion>>; isStream?: boolean; model?: string | null; biodiversity?: string | null } | null) => void;
  answer: (value: AnswerValue, source: AnswerSource, via: Via, utterance?: string) => void;
  notSure: (via: Via, utterance?: string) => void;
  help: (via: Via) => void;
  repeat: (via: Via) => void;
  back: () => void;
  unclear: (via: Via, utterance: string, reply?: string) => void;
  rejectSuggestion: () => void;
  note: (qid: QuestionId, type: QEvent["type"], via?: Via) => void;
  decideLook: (decision: "keep" | "change") => void;
  edit: (qid: QuestionId) => void;
  toReview: () => void;
  setSubmitting: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const brook = (text: string, tone?: Extract<Msg, { from: "brook" }>["tone"], qid?: QuestionId): Msg => ({ id: uid(), from: "brook", text, tone, qid });

/** Only suggestions the model was reasonably sure of are offered. */
export const offered = (s?: Suggestion) => Boolean(s && s.confidence !== "low");

/** A readable version of an answer, in the current language. */
export function describe(lang: Lang, qid: QuestionId, value: AnswerValue): string {
  const s = stringsFor(lang);
  const q = QUESTION_BY_ID[qid];
  if (value === null) return s.ui.notSure;
  if (q.kind === "yesno") return value ? s.ui.yes : s.ui.no;
  if (q.kind === "number") return qid === "waterHeight" ? `${value} m` : String(value);
  if (q.kind === "multi") {
    const codes = value as string[];
    if (!codes.length) return s.ui.none;
    return codes.map((c) => s.q[qid].options?.[c]?.label ?? c).join(", ");
  }
  if (q.kind === "feelings") {
    const f = value as Record<string, number>;
    return Object.entries(f)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${s.feelings[k as keyof typeof s.feelings]} ${v}/5`)
      .join(" · ") || "—";
  }
  if (q.kind === "text") return String(value);
  return s.q[qid].options?.[value as string]?.label ?? String(value);
}

const initial = {
  id: "",
  lang: "en" as Lang,
  step: "intro" as Step,
  startedAt: null,
  site: null,
  weather: null,
  photos: {},
  suggestions: {},
  aiModel: null,
  biodiversity: null,
  answers: {},
  sources: {},
  current: null,
  questionShownAt: 0,
  editing: false,
  looks: [],
  lookIndex: 0,
  lookDecisions: [],
  messages: [],
  events: [],
  say: null,
  usedVoice: false,
  usedTap: false,
  aiAvailable: false,
};

export const useCheck = create<CheckState>()(
  persist(
    (set, get) => {
      /** Moves to the next unanswered question, or on to the second look / review. */
      function advance(prefix: string[] = []) {
        const st = get();
        const s = stringsFor(st.lang);
        if (st.editing) {
          set({ editing: false });
          return toReviewOrLooks(prefix);
        }
        const list = activeQuestions(st.answers);
        const next = list.find((q) => !(q.id in st.answers));
        if (!next) return toReviewOrLooks(prefix);
        ask(next.id, prefix, st.current ? QUESTION_BY_ID[st.current].section : null);
        void s;
      }

      function ask(qid: QuestionId, prefix: string[] = [], previousSection: Section | null = null) {
        const st = get();
        const s = stringsFor(st.lang);
        const q = QUESTION_BY_ID[qid];
        const msgs: Msg[] = [];
        const spoken: string[] = [...prefix];
        if (q.section !== previousSection && s.sections[q.section].intro) {
          msgs.push({ ...brook(s.sections[q.section].intro, "section"), section: q.section } as Msg);
          spoken.push(s.sections[q.section].intro);
        }
        msgs.push(brook(s.q[qid].ask, undefined, qid));
        spoken.push(s.q[qid].ask);
        const sug = st.suggestions[qid];
        const events: QEvent[] = [{ qid, type: "asked", t: Date.now() }];
        if (offered(sug)) {
          const template = q.kind === "yesno" ? s.brook.suggestionYesNo : s.brook.suggestion;
          const line = fmt(template, { answer: describe(st.lang, qid, sug!.value).toLowerCase() });
          msgs.push(brook(line, "info", qid));
          spoken.push(line);
          events.push({ qid, type: "suggestionShown", t: Date.now() });
        }
        set({
          step: "question",
          current: qid,
          questionShownAt: Date.now(),
          messages: [...st.messages, ...msgs],
          events: [...st.events, ...events],
          say: { id: uid(), text: spoken.join(" ") },
        });
      }

      function toReviewOrLooks(prefix: string[] = []) {
        const st = get();
        const s = stringsFor(st.lang);
        const looks = secondLooks(st.answers, st.weather);
        const pending = looks.filter((l) => !st.lookDecisions.some((d) => d.id === l.id));
        if (pending.length) {
          const first = pending[0];
          const text = lookText(st.lang, first);
          set({
            step: "secondLook",
            current: null,
            looks: pending,
            lookIndex: 0,
            messages: [...st.messages, brook(s.brook.secondLookIntro, "section"), brook(text, first.severity === "safety" ? "safety" : "info")],
            say: { id: uid(), text: [...prefix, s.brook.secondLookIntro, text].join(" ") },
          });
          return;
        }
        set({
          step: "review",
          current: null,
          messages: [...st.messages, brook(s.brook.reviewPrompt, "warm")],
          say: { id: uid(), text: [...prefix, s.brook.reviewPrompt].join(" ") },
        });
      }

      function record(value: AnswerValue, source: AnswerSource, via: Via, utterance?: string) {
        const st = get();
        const qid = st.current;
        if (!qid) return;
        const q = QUESTION_BY_ID[qid];
        if (!isValidAnswer(q, value)) return;
        const s = stringsFor(st.lang);
        const was = qid in st.answers;
        const answers: AnswerValues = { ...st.answers, [qid]: value };
        // Dependent questions whose condition no longer holds are dropped.
        for (const dep of Object.keys(answers) as QuestionId[]) {
          const d = QUESTION_BY_ID[dep];
          if (d.showIf && !d.showIf(answers)) delete answers[dep];
        }
        const sources = { ...st.sources, [qid]: source };
        const label = describe(st.lang, qid, value);
        const userMsg: Msg[] = utterance ? [{ id: uid(), from: "user", text: utterance, via }] : [];
        const receipt: Msg = { id: uid(), from: "receipt", qid, value, source };
        const ack =
          value === null
            ? s.brook.notSureOk
            : Array.isArray(value) && !value.length
              ? s.brook.gotItNone
              : q.kind === "feelings"
                ? s.brook.feelingsHeard
                : fmt(s.brook.gotIt, { answer: label });
        set({
          answers,
          sources,
          usedVoice: st.usedVoice || via === "voice",
          usedTap: st.usedTap || via === "tap",
          messages: [...st.messages, ...userMsg, receipt],
          events: [...st.events, { qid, type: was ? "changed" : "answered", via, ms: Date.now() - st.questionShownAt, t: Date.now() }],
        });
        advance([ack]);
      }

      return {
        ...initial,

        begin: (lang) => {
          const s = stringsFor(lang);
          set({
            ...initial,
            id: crypto.randomUUID(),
            lang,
            step: "safety",
            startedAt: new Date().toISOString(),
            aiAvailable: get().aiAvailable,
            messages: [brook(s.brook.hello, "warm"), brook(s.brook.safety, "safety")],
            say: { id: uid(), text: `${s.brook.hello} ${s.brook.safety}` },
          });
        },
        reset: () => set({ ...initial, aiAvailable: get().aiAvailable }),
        setLang: (lang) => set({ lang }),
        setAiAvailable: (aiAvailable) => set({ aiAvailable }),

        confirmSafety: () => {
          const s = stringsFor(get().lang);
          set((st) => ({
            step: "site",
            messages: [...st.messages, { id: uid(), from: "user", text: s.brook.safetyReady, via: "tap" }, brook(s.brook.sitePrompt)],
            say: { id: uid(), text: s.brook.sitePrompt },
          }));
        },

        chooseSite: (site) => {
          const s = stringsFor(get().lang);
          const line = site.custom ? s.brook.siteCustom : fmt(s.brook.siteFound, { site: site.name, city: site.city ?? "" });
          set((st) => ({
            site,
            step: "photos",
            messages: [...st.messages, { id: uid(), from: "user", text: site.name, via: "tap" }, brook(line, "warm"), brook(s.brook.photosPrompt)],
            say: { id: uid(), text: `${line} ${s.brook.photosPrompt}` },
          }));
        },

        setWeather: (weather) => set({ weather }),
        setPhoto: (slot, photo) =>
          set((st) => {
            const photos = { ...st.photos };
            if (photo) photos[slot] = photo;
            else delete photos[slot];
            return { photos };
          }),

        startAnalyzing: () => {
          const s = stringsFor(get().lang);
          set((st) => ({ step: "analyzing", messages: [...st.messages, brook(s.brook.photosLooking)], say: { id: uid(), text: s.brook.photosLooking } }));
        },

        finishPhotos: (r) => {
          const st = get();
          const s = stringsFor(st.lang);
          const suggestions = r?.suggestions ?? {};
          const n = Object.values(suggestions).filter(offered).length;
          const hadPhotos = Object.keys(st.photos).length > 0;
          const line = !hadPhotos
            ? ""
            : r && r.isStream === false
              ? s.brook.photosNotStream
              : n
                ? fmt(s.brook.photosSuggested, { n })
                : r === null && !st.aiAvailable
                  ? s.brook.aiResting
                  : s.brook.photosNone;
          set({
            suggestions,
            aiModel: r?.model ?? null,
            biodiversity: r?.biodiversity ?? null,
            messages: line ? [...st.messages, brook(line, "warm")] : st.messages,
          });
          advance(line ? [line] : []);
        },

        answer: (value, source, via, utterance) => record(value, source, via, utterance),

        notSure: (via, utterance) => {
          const st = get();
          if (!st.current) return;
          const q = QUESTION_BY_ID[st.current];
          set({ events: [...st.events, { qid: st.current, type: "notSure", via, t: Date.now() }] });
          if (q.kind === "feelings") return record({}, via, via, utterance);
          if (!q.allowNotSure) {
            const s = stringsFor(st.lang);
            const text = s.brook.bestGuess;
            set({ messages: [...get().messages, brook(text, "info", st.current)], say: { id: uid(), text } });
            return;
          }
          record(null, via, via, utterance);
        },

        help: (via) => {
          const st = get();
          if (!st.current) return;
          const s = stringsFor(st.lang);
          const text = s.q[st.current].help;
          set({
            messages: [...st.messages, brook(text, "help", st.current)],
            events: [...st.events, { qid: st.current, type: "help", via, t: Date.now() }],
            say: { id: uid(), text },
          });
        },

        repeat: (via) => {
          const st = get();
          if (!st.current) return;
          const s = stringsFor(st.lang);
          const text = s.q[st.current].ask;
          set({ events: [...st.events, { qid: st.current, type: "repeat", via, t: Date.now() }], say: { id: uid(), text } });
        },

        back: () => {
          const st = get();
          const list = activeQuestions(st.answers);
          const idx = st.current ? list.findIndex((q) => q.id === st.current) : list.length;
          const prev = [...list.slice(0, Math.max(0, idx))].reverse().find((q) => q.id in st.answers);
          if (!prev) return;
          const answers = { ...st.answers };
          delete answers[prev.id];
          set({ answers, editing: false });
          ask(prev.id, [], null);
        },

        unclear: (via, utterance, reply) => {
          const st = get();
          if (!st.current) return;
          const s = stringsFor(st.lang);
          const text = reply || s.brook.didntCatch;
          set({
            messages: [...st.messages, { id: uid(), from: "user", text: utterance, via }, brook(text, "info", st.current)],
            events: [...st.events, { qid: st.current, type: "unclear", via, t: Date.now() }],
            say: { id: uid(), text },
          });
        },

        rejectSuggestion: () => {
          const st = get();
          if (!st.current) return;
          const suggestions = { ...st.suggestions };
          delete suggestions[st.current];
          const s = stringsFor(st.lang);
          set({
            suggestions,
            events: [...st.events, { qid: st.current, type: "suggestionRejected", t: Date.now() }],
            messages: [...st.messages, brook(s.brook.tapInstead, "info", st.current)],
            say: { id: uid(), text: s.brook.tapInstead },
          });
        },

        note: (qid, type, via) => set((st) => ({ events: [...st.events, { qid, type, via, t: Date.now() }] })),

        decideLook: (decision) => {
          const st = get();
          const look = st.looks[st.lookIndex];
          if (!look) return;
          const s = stringsFor(st.lang);
          const lookDecisions = [...st.lookDecisions, { id: look.id, decision }];
          if (decision === "change" && look.revisit.length) {
            set({ lookDecisions, editing: true, messages: [...st.messages, { id: uid(), from: "user", text: s.secondLook.change, via: "tap" }] });
            const target = look.revisit.find((q) => activeQuestions(st.answers).some((a) => a.id === q)) ?? look.revisit[0];
            ask(target, [], null);
            return;
          }
          const nextIndex = st.lookIndex + 1;
          const userText = look.severity === "safety" ? s.ui.continue : s.secondLook.keep;
          if (nextIndex < st.looks.length) {
            const nextLook = st.looks[nextIndex];
            const text = lookText(st.lang, nextLook);
            set({
              lookDecisions,
              lookIndex: nextIndex,
              messages: [...st.messages, { id: uid(), from: "user", text: userText, via: "tap" }, brook(text, nextLook.severity === "safety" ? "safety" : "info")],
              say: { id: uid(), text },
            });
            return;
          }
          set({
            lookDecisions,
            step: "review",
            messages: [...st.messages, { id: uid(), from: "user", text: userText, via: "tap" }, brook(s.brook.reviewPrompt, "warm")],
            say: { id: uid(), text: `${s.brook.secondLookDone} ${s.brook.reviewPrompt}` },
          });
        },

        edit: (qid) => {
          set({ editing: true });
          ask(qid, [], null);
        },

        toReview: () => toReviewOrLooks(),
        setSubmitting: () => set({ step: "submitting" }),
      };
    },
    {
      name: "brook-check",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (st) => {
        // Photos stay out of storage (too big); everything else survives a reload mid-check.
        const { photos: _photos, say: _say, ...rest } = st;
        void _photos;
        void _say;
        return rest as unknown as CheckState;
      },
    },
  ),
);

export function lookText(lang: Lang, look: SecondLook): string {
  const s = stringsFor(lang);
  const issue = typeof look.params.issue === "string" ? s.pollution[look.params.issue as keyof typeof s.pollution] : "";
  return fmt(s.secondLook[look.id], { ...look.params, issue });
}
