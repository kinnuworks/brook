import { Loader2, Mic, Send, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { useStrings } from "@/i18n";

export interface QuickAction {
  label: string;
  icon?: LucideIcon;
  /** Shown as a round icon button; the label becomes its accessible name. */
  iconOnly?: boolean;
  onClick: () => void;
}

interface Props {
  /** Voice works here (or the demo film is driving it). */
  canTalk: boolean;
  listening: boolean;
  thinking: boolean;
  onMic: () => void;
  onSend: (text: string) => void;
  quick: QuickAction[];
}

/** One bar to answer in: type, or tap the microphone and talk. Quick replies sit above it. */
export function Composer({ canTalk, listening, thinking, onMic, onSend, quick }: Props) {
  const s = useStrings();
  const [typed, setTyped] = useState("");
  const showSend = Boolean(typed.trim()) || !canTalk;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {quick.map(({ label, icon: Icon, iconOnly, onClick }) =>
          iconOnly && Icon ? (
            <button
              key={label}
              onClick={onClick}
              aria-label={label}
              title={label}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-deep ring-1 ring-line transition hover:bg-aqua-50 hover:ring-aqua"
            >
              <Icon className="size-4.5" aria-hidden />
            </button>
          ) : (
            <button
              key={label}
              onClick={onClick}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-[14px] font-semibold text-deep ring-1 ring-line transition hover:bg-aqua-50 hover:ring-aqua"
            >
              {Icon && <Icon className="size-4 shrink-0" aria-hidden />} {label}
            </button>
          ),
        )}
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!typed.trim()) return;
          onSend(typed.trim());
          setTyped("");
        }}
      >
        <div
          className={`flex h-[52px] min-w-0 flex-1 items-center rounded-full ring-[1.5px] transition ${listening ? "bg-leaf-100 ring-leaf" : "bg-mist ring-line focus-within:bg-white focus-within:ring-aqua"}`}
        >
          {listening ? (
            <span className="flex min-w-0 flex-1 items-center gap-2 px-4 text-[16px] font-semibold text-leaf-700" aria-hidden>
              <span className="flex items-end gap-[3px]">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-[3px] animate-bounce rounded-full bg-leaf-700"
                    style={{
                      height: 8 + (i % 2) * 6,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </span>
              {s.ui.listening}
            </span>
          ) : (
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={canTalk ? s.ui.typeOrTalk : s.ui.typeInstead}
              aria-label={s.ui.typeInstead}
              enterKeyHint="send"
              className="h-full min-w-0 flex-1 text-ellipsis rounded-full bg-transparent px-4 text-[16px] text-ink outline-none placeholder:text-ink-faint"
            />
          )}
        </div>
        {showSend ? (
          <button
            type="submit"
            disabled={!typed.trim()}
            aria-label={s.ui.send}
            className="grid size-[52px] shrink-0 place-items-center rounded-full bg-deep text-white shadow-[0_8px_20px_-8px_rgb(33_107_140/0.6)] transition hover:bg-deep-600 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMic}
            disabled={thinking}
            aria-pressed={listening}
            aria-label={listening ? s.ui.listening : s.ui.listen}
            className={`relative grid size-[52px] shrink-0 place-items-center rounded-full text-white shadow-[0_8px_20px_-8px_rgb(33_107_140/0.6)] transition ${listening ? "bg-leaf-700" : "bg-deep hover:bg-deep-600"}`}
          >
            {listening && <span className="absolute inset-0 animate-ripple rounded-full bg-leaf" />}
            {thinking ? <Loader2 className="relative size-5 animate-spin" /> : <Mic className="relative size-6" />}
          </button>
        )}
      </form>
    </div>
  );
}
