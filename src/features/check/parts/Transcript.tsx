import { Camera, CheckCircle2, HelpCircle, Info, Keyboard, Mic, MousePointerClick, PencilLine, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { BrookAvatar, type AvatarState } from "@/components/BrookAvatar";
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

function BrookBubble({ m, first, avatar }: { m: Extract<Msg, { from: "brook" }>; first: boolean; avatar: AvatarState }) {
  const tone =
    m.tone === "help"
      ? "bg-aqua-50 ring-1 ring-aqua-200"
      : m.tone === "safety"
        ? "bg-sun-100 ring-1 ring-sun/40"
        : m.tone === "section"
          ? "bg-deep-900 text-white"
          : m.tone === "info"
            ? "bg-white ring-1 ring-aqua-200"
            : "bg-white";
  const Icon = m.tone === "help" ? HelpCircle : m.tone === "safety" ? ShieldAlert : m.tone === "info" ? Info : null;
  return (
    <div className="flex items-end gap-2.5 animate-rise">
      <div className="w-9 shrink-0">{first && <BrookAvatar size={36} state={avatar} />}</div>
      <div className={`max-w-[85%] rounded-[22px] rounded-bl-md px-4 py-3 text-[17px] leading-snug shadow-[0_1px_2px_rgb(16_40_58/0.06)] ${tone}`}>
        {Icon && <Icon className={`mb-1 size-4 ${m.tone === "safety" ? "text-clay" : "text-aqua-600"}`} aria-hidden />}
        {m.text}
      </div>
    </div>
  );
}

export function Transcript({ avatar, interim }: { avatar: AvatarState; interim: string }) {
  const messages = useCheck((s) => s.messages);
  const lang = useCheck((s) => s.lang);
  const s = useStrings();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = end.current?.closest("[data-scroller]") as HTMLElement | null;
    if (!scroller) return;
    const id = requestAnimationFrame(() => scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [messages.length, interim]);

  const lastBrookIndex = messages.map((m) => m.from).lastIndexOf("brook");
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 px-3 py-4" role="log" aria-live="polite" aria-label="Conversation with Brook">
      {messages.map((m, i) => {
        if (m.from === "brook") {
          const first = i === 0 || messages[i - 1].from !== "brook";
          return <BrookBubble key={m.id} m={m} first={first} avatar={i === lastBrookIndex ? avatar : "idle"} />;
        }
        if (m.from === "user") {
          return (
            <div key={m.id} className="flex justify-end animate-rise">
              <div className="max-w-[80%] rounded-[22px] rounded-br-md bg-deep px-4 py-2.5 text-[17px] text-white">
                {m.via === "voice" && <Mic className="mr-1.5 inline size-3.5 -translate-y-px opacity-70" aria-label="spoken" />}
                {m.text}
              </div>
            </div>
          );
        }
        const Icon = SOURCE_ICON[m.source] ?? CheckCircle2;
        return (
          <div key={m.id} className="flex justify-center animate-rise">
            <div className="flex max-w-full items-center gap-2 rounded-full bg-leaf-100 px-3 py-1.5 text-[13.5px] font-semibold text-leaf-700">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                {s.q[m.qid].title} · {describe(lang, m.qid, m.value)}
              </span>
              <Icon className="size-3.5 shrink-0 opacity-70" aria-label={s.ui.sources[m.source]} />
            </div>
          </div>
        );
      })}
      {interim && (
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-[22px] rounded-br-md bg-deep/60 px-4 py-2.5 text-[17px] italic text-white">{interim}…</div>
        </div>
      )}
      <div ref={end} className="h-2" />
    </div>
  );
}
