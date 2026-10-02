import { Camera, CheckCircle2, ChevronDown, HelpCircle, Info, Keyboard, Mic, MousePointerClick, PencilLine, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrookAvatar, type AvatarState } from "@/components/BrookAvatar";
import { activeQuestions, QUESTION_BY_ID, type QuestionId } from "@/core/protocol";
import { useStrings } from "@/i18n";
import { describe, useCheck, type Msg } from "../store";

export const SOURCE_ICON = {
  tap: MousePointerClick,
  voice: Mic,
  text: Keyboard,
  "voice-ai": Sparkles,
  "text-ai": Sparkles,
  "photo-confirmed": Camera,
  "photo-corrected": PencilLine,
} as const;

type BrookMsg = Extract<Msg, { from: "brook" }>;

const BUBBLE = "max-w-[min(85%,34rem)] rounded-[20px] rounded-bl-md px-4 py-2.5 text-[17px] leading-snug";

function BrookBubble({ m }: { m: BrookMsg }) {
  const tone =
    m.tone === "help"
      ? "bg-aqua-50 ring-1 ring-aqua-200"
      : m.tone === "safety"
        ? "bg-sun-100 ring-1 ring-sun/40"
        : m.tone === "info"
          ? "bg-aqua-50 ring-1 ring-aqua-200"
          : "bg-white ring-1 ring-line/70 shadow-[0_1px_2px_rgb(16_40_58/0.05)]";
  const Icon = m.tone === "help" ? HelpCircle : m.tone === "safety" ? ShieldAlert : m.tone === "info" ? (m.qid ? Camera : Info) : null;
  return (
    <div className={`${BUBBLE} ${tone}`}>
      {Icon && <Icon className={`mr-1.5 inline size-4 -translate-y-px ${m.tone === "safety" ? "text-clay-700" : "text-aqua-700"}`} aria-hidden />}
      {m.text}
    </div>
  );
}

/** The question Brook is asking right now: the one thing on screen that needs an answer. */
function QuestionCard({ m, qid }: { m: BrookMsg; qid: QuestionId }) {
  const s = useStrings();
  const answers = useCheck((st) => st.answers);
  const [official, setOfficial] = useState(false);
  const list = activeQuestions(answers);
  const position = list.findIndex((q) => q.id === qid) + 1;
  return (
    <div className="max-w-[min(88%,36rem)] rounded-[22px] rounded-bl-md bg-white px-4 pb-3 pt-3 shadow-[var(--shadow-card)] ring-2 ring-aqua/50">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-aqua-700">
        {s.ui.question} {position} {s.ui.of} {list.length} · {s.sections[QUESTION_BY_ID[qid].section].title}
      </p>
      <p className="mt-1 text-[18px] font-semibold leading-snug text-deep-900">{m.text}</p>
      <button className="mt-1.5 inline-flex min-h-8 items-center gap-1 text-[13.5px] font-semibold text-ink-soft hover:text-deep" onClick={() => setOfficial((o) => !o)} aria-expanded={official}>
        {s.ui.officialQuestion}
        <ChevronDown className={`size-4 transition ${official ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {official && <p className="mt-1 rounded-xl bg-mist px-3 py-2 text-[14px] leading-snug text-ink-soft">{s.q[qid].official}</p>}
    </div>
  );
}

function SectionMark({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pb-1 pt-3 text-[12px] font-bold uppercase tracking-[0.1em] text-aqua-700" aria-hidden>
      <span className="h-px flex-1 bg-aqua-200" />
      {title}
      <span className="h-px flex-1 bg-aqua-200" />
    </div>
  );
}

function Typing() {
  return (
    <span className="flex items-center gap-1 px-1 py-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2 animate-bounce rounded-full bg-aqua-600" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

export function Transcript({ avatar, interim }: { avatar: AvatarState; interim: string }) {
  const messages = useCheck((st) => st.messages);
  const lang = useCheck((st) => st.lang);
  const current = useCheck((st) => st.current);
  const step = useCheck((st) => st.step);
  const s = useStrings();
  const end = useRef<HTMLDivElement>(null);
  const thinking = avatar === "thinking";
  useEffect(() => {
    const scroller = end.current?.closest("[data-scroller]") as HTMLElement | null;
    if (!scroller) return;
    const id = requestAnimationFrame(() => scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [messages.length, interim, thinking]);

  // The question card is the newest asking of the current question.
  let questionIndex = -1;
  if (step === "question" && current) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.from === "brook" && m.qid === current && !m.tone) {
        questionIndex = i;
        break;
      }
    }
  }
  const lastBrook = messages.map((m) => m.from).lastIndexOf("brook");

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 pt-5 sm:px-5" role="log" aria-live="polite" aria-label="Conversation with Brook">
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const gap = !prev ? "" : prev.from === m.from ? "mt-1.5" : "mt-4";
        if (m.from === "brook") {
          // The avatar sits beside the last bubble of each run of Brook's messages, as in any chat.
          const lastOfRun = !next || next.from !== "brook";
          return (
            <div key={m.id} className={gap}>
              {m.tone === "section" && m.section && <SectionMark title={s.sections[m.section].title} />}
              <div className="flex items-end gap-2.5 animate-rise">
                <div className="w-8 shrink-0">{lastOfRun && !(thinking && i === messages.length - 1) && <BrookAvatar size={32} state={i === lastBrook ? avatar : "idle"} />}</div>
                {i === questionIndex && current ? <QuestionCard m={m} qid={current} /> : <BrookBubble m={m} />}
              </div>
            </div>
          );
        }
        if (m.from === "user") {
          return (
            <div key={m.id} className={`flex justify-end animate-rise ${gap}`}>
              <div className="max-w-[min(80%,30rem)] rounded-[20px] rounded-br-md bg-deep px-4 py-2.5 text-[17px] leading-snug text-white">
                {m.via === "voice" && <Mic className="mr-1.5 inline size-3.5 -translate-y-px opacity-70" aria-label="spoken" />}
                {m.text}
              </div>
            </div>
          );
        }
        const Icon = SOURCE_ICON[m.source] ?? CheckCircle2;
        return (
          <div key={m.id} className="mt-2.5 flex justify-center animate-rise">
            <div className="flex max-w-full items-center gap-2 rounded-full bg-leaf-100 px-3 py-1.5 text-[13.5px] font-semibold text-leaf-700" title={s.ui.sources[m.source]}>
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                {s.q[m.qid].title} · {describe(lang, m.qid, m.value)}
              </span>
              <Icon className="size-3.5 shrink-0 opacity-70" aria-label={s.ui.sources[m.source]} />
            </div>
          </div>
        );
      })}
      {thinking && (
        <div className="mt-1.5 flex items-end gap-2.5">
          <div className="w-8 shrink-0">
            <BrookAvatar size={32} state="thinking" />
          </div>
          <div className="rounded-[20px] rounded-bl-md bg-white px-4 py-2 ring-1 ring-line/70">
            <Typing />
          </div>
        </div>
      )}
      {interim && (
        <div className="mt-4 flex justify-end">
          <div className="max-w-[min(80%,30rem)] rounded-[20px] rounded-br-md bg-deep/10 px-4 py-2.5 text-[17px] italic text-deep-900 border border-dashed border-deep/30">
            <Mic className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
            {interim}…
          </div>
        </div>
      )}
      <div ref={end} className="h-1" />
    </div>
  );
}
