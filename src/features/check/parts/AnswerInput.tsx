import { Camera, Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { FEELINGS, QUESTION_BY_ID, type AnswerValue, type Feelings, type QuestionId } from "@/core/protocol";
import type { Suggestion } from "@/lib/api";
import { DownstreamDiagram, Pictogram, hasPictogram } from "@/components/Pictogram";
import { useStrings } from "@/i18n";
import { describe, useCheck } from "../store";

interface Props {
  qid: QuestionId;
  suggestion?: Suggestion;
  onAnswer: (value: AnswerValue) => void;
  onRejectSuggestion: () => void;
  /** Values heard by voice for questions that need confirming (multi, feelings). */
  draft?: AnswerValue;
}

const same = (a: AnswerValue | undefined, b: AnswerValue | undefined) => (Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x) => b.includes(x)) : a === b);

/** OneAquaHealth's app labels its illustrations A, B, C…; the letter links the two. */
const letterOf = (official?: string) => official?.match(/\(([A-Z])\)\s*$/)?.[1];

const TILE_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

function PhotoMark() {
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-aqua-100 text-aqua-700" title="From your photo">
      <Camera className="size-3" aria-label="suggested from your photo" />
    </span>
  );
}

/** A picture answer: the drawing carries the meaning before the words do. */
function OptionTile({ label, letter, on, suggested, picture, onClick }: { label: string; letter?: string; on?: boolean; suggested?: boolean; picture: React.ReactNode; onClick: () => void }) {
  return (
    <button data-option className={`option-tile ${on ? "option-on" : ""}`} onClick={onClick} aria-pressed={on}>
      {suggested && (
        <span className="absolute left-2 top-2">
          <PhotoMark />
        </span>
      )}
      {letter && (
        <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-ink-faint" aria-hidden>
          {letter}
        </span>
      )}
      <span className="[&>svg]:h-9 [&>svg]:w-[54px]">{picture}</span>
      <span className="text-[15px] font-semibold leading-tight">{label}</span>
    </button>
  );
}

/** A word answer: a radio or checkbox row. */
function OptionRow({ label, on, suggested, multi, onClick }: { label: string; on?: boolean; suggested?: boolean; multi?: boolean; onClick: () => void }) {
  return (
    <button data-option className={`option-row ${on ? "option-on" : ""}`} onClick={onClick} aria-pressed={on}>
      <span className={`grid size-[22px] shrink-0 place-items-center ring-[1.5px] ${multi ? "rounded-md" : "rounded-full"} ${on ? "bg-aqua ring-aqua text-white" : "ring-line"}`}>
        {on && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1 text-[15.5px] font-semibold leading-tight">{label}</span>
      {suggested && <PhotoMark />}
    </button>
  );
}

export function AnswerInput({ qid, suggestion, onAnswer, onRejectSuggestion, draft }: Props) {
  const s = useStrings();
  const lang = useCheck((st) => st.lang);
  const q = QUESTION_BY_ID[qid];
  const text = s.q[qid];
  const [multi, setMulti] = useState<string[]>([]);
  const [num, setNum] = useState<string>("");
  const [free, setFree] = useState("");
  const [feelings, setFeelings] = useState<Feelings>({
    joy: 0,
    serenity: 0,
    anger: 0,
    fear: 0,
  });

  // Reset local state for each new question, seeded by a photo suggestion or what was heard.
  useEffect(() => {
    const seed = draft ?? suggestion?.value;
    setMulti(q.kind === "multi" && Array.isArray(seed) ? (seed as string[]) : []);
    setNum(q.kind === "number" && typeof seed === "number" ? String(seed) : q.id === "numberOfDams" ? "1" : "");
    setFree(q.kind === "text" && typeof seed === "string" ? seed : "");
    setFeelings(
      q.kind === "feelings" && seed && typeof seed === "object" && !Array.isArray(seed)
        ? { joy: 0, serenity: 0, anger: 0, fear: 0, ...(seed as Feelings) }
        : { joy: 0, serenity: 0, anger: 0, fear: 0 },
    );
  }, [qid, draft, suggestion, q.kind, q.id]);

  // A photo suggestion for a one-answer question: confirm it in one tap, or pick another below.
  const offeredBox = suggestion && q.kind !== "multi" && q.kind !== "yesno" && (
    <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl bg-gradient-to-br from-aqua-50 to-white p-3 ring-1 ring-aqua-200">
      <div className="min-w-0 flex-[1_1_14rem]">
        <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-aqua-700">
          <Camera className="size-3.5" aria-hidden /> {s.ui.fromYourPhoto}
        </div>
        <div className="mt-0.5 text-[17px] font-bold leading-snug text-deep-900">{describe(lang, qid, suggestion.value)}</div>
        {suggestion.evidence && <p className="text-[13.5px] leading-snug text-ink-soft">“{suggestion.evidence}”</p>}
      </div>
      <div className="flex flex-[1_1_16rem] gap-2">
        <button className="btn-primary !min-h-11 flex-1 !gap-1.5 !px-2.5 !text-[15px]" onClick={() => onAnswer(suggestion.value)}>
          <Check className="hidden size-4.5 shrink-0 min-[400px]:block" aria-hidden /> {s.ui.confirm}
        </button>
        <button className="btn-secondary !min-h-11 flex-1 !gap-1.5 !px-2.5 !text-[15px]" onClick={onRejectSuggestion}>
          <X className="hidden size-4.5 shrink-0 min-[400px]:block" aria-hidden /> {s.ui.change}
        </button>
      </div>
    </div>
  );

  // For yes/no and several-answer questions the suggestion is shown, and its answers marked.
  const offeredLine = suggestion && (q.kind === "multi" || q.kind === "yesno") && (
    <p className="mb-2.5 flex items-start gap-2 rounded-2xl bg-aqua-50 px-3 py-2 text-[14px] leading-snug text-deep-900 ring-1 ring-aqua-200">
      <Camera className="mt-0.5 size-4 shrink-0 text-aqua-700" aria-hidden />
      <span>
        <b>{s.ui.fromYourPhoto}:</b> {describe(lang, qid, suggestion.value)}
        {suggestion.evidence ? <span className="text-ink-soft"> — “{suggestion.evidence}”</span> : null}
      </span>
    </p>
  );

  const side = /Left$/.test(qid) ? "left" : /Right$/.test(qid) ? "right" : undefined;
  const marginDiagram = q.section === "margins" && side && (
    <div className="mb-2.5 flex items-center gap-3 rounded-2xl bg-aqua-50 p-2 pr-3">
      <DownstreamDiagram side={side} leftLabel={s.ui.left} rightLabel={s.ui.right} />
      <p className="text-[14px] font-semibold leading-snug text-deep-900">{s.ui.facingDownstream}</p>
    </div>
  );

  switch (q.kind) {
    case "single":
    case "rating": {
      const codes = q.codes!;
      const pictures = codes.every((c) => hasPictogram(qid, c));
      return (
        <div>
          {marginDiagram}
          {offeredBox}
          {pictures ? (
            <div className={`grid gap-2 ${TILE_COLS[codes.length] ?? "grid-cols-2 sm:grid-cols-3"}`}>
              {codes.map((code) => (
                <OptionTile
                  key={code}
                  label={text.options?.[code]?.label ?? code}
                  letter={q.kind === "rating" ? undefined : letterOf(text.options?.[code]?.official)}
                  suggested={same(suggestion?.value, code)}
                  picture={<Pictogram qid={qid} code={code} />}
                  onClick={() => onAnswer(code)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {codes.map((code) => (
                <OptionRow key={code} label={text.options?.[code]?.label ?? code} suggested={same(suggestion?.value, code)} onClick={() => onAnswer(code)} />
              ))}
            </div>
          )}
        </div>
      );
    }
    case "multi":
      return (
        <div>
          {offeredLine}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {q.codes!.map((code) => (
              <OptionRow
                key={code}
                multi
                label={text.options?.[code]?.label ?? code}
                on={multi.includes(code)}
                suggested={Array.isArray(suggestion?.value) && (suggestion!.value as string[]).includes(code)}
                onClick={() => setMulti((m) => (m.includes(code) ? m.filter((c) => c !== code) : [...m, code]))}
              />
            ))}
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button className="btn-secondary !min-h-12" onClick={() => onAnswer([])}>
              {s.ui.none}
            </button>
            <button className="btn-primary !min-h-12" disabled={!multi.length} onClick={() => onAnswer(multi)}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
    case "yesno":
      return (
        <div>
          {marginDiagram}
          {offeredLine}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: s.ui.yes, value: true },
              { label: s.ui.no, value: false },
            ].map((o) => (
              <button key={o.label} data-option className="option-row min-h-14 justify-center text-center" onClick={() => onAnswer(o.value)}>
                <span className="text-[18px] font-semibold">{o.label}</span>
                {suggestion?.value === o.value && <PhotoMark />}
              </button>
            ))}
          </div>
        </div>
      );
    case "number": {
      const isDepth = q.id === "waterHeight";
      const value = Number(num.replace(",", "."));
      const valid = num !== "" && Number.isFinite(value) && value >= (q.min ?? 0) && value <= (q.max ?? 100);
      return (
        <div className="space-y-2.5">
          {isDepth && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {s.ui.depthPicks.map((p) => (
                <button key={p.label} data-option className="option-row min-h-12 flex-col !items-center !gap-0 !py-2 text-center" onClick={() => onAnswer(p.value)}>
                  <span className="text-[15.5px] font-semibold">{p.label}</span>
                  <span className="text-[12.5px] text-ink-soft">≈ {p.value} m</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isDepth && (
              <button className="btn-secondary !min-h-12 !px-4" aria-label="minus" onClick={() => setNum(String(Math.max(q.min ?? 0, (Number(num) || 0) - 1)))}>
                <Minus className="size-5" />
              </button>
            )}
            <label className="relative flex-1">
              <span className="sr-only">{text.title}</span>
              <input
                inputMode="decimal"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                className="h-12 w-full rounded-2xl bg-white px-4 text-center text-[19px] font-bold ring-[1.5px] ring-line outline-none focus:ring-aqua"
                placeholder={isDepth ? "0.5" : "1"}
              />
              {isDepth && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-soft">m</span>}
            </label>
            {!isDepth && (
              <button className="btn-secondary !min-h-12 !px-4" aria-label="plus" onClick={() => setNum(String(Math.min(q.max ?? 99, (Number(num) || 0) + 1)))}>
                <Plus className="size-5" />
              </button>
            )}
            <button className="btn-primary !min-h-12 !px-5" disabled={!valid} onClick={() => onAnswer(isDepth ? Math.round(value * 100) / 100 : Math.round(value))}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
    }
    case "text":
      return (
        <div className="space-y-2.5">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
            {s.ui.invasiveExamples.map((ex) => (
              <button
                key={ex}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[14px] font-semibold text-deep ring-1 ring-line hover:ring-aqua"
                onClick={() => setFree((f) => (f ? `${f}, ${ex}` : ex))}
              >
                + {ex}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={free}
              onChange={(e) => setFree(e.target.value)}
              className="h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 text-[16px] ring-[1.5px] ring-line outline-none focus:ring-aqua"
              placeholder={text.official}
              aria-label={text.title}
              maxLength={300}
            />
            <button className="btn-primary !min-h-12 !px-5" disabled={free.trim().length < 2} onClick={() => onAnswer(free.trim())}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
    case "feelings":
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {FEELINGS.map((k) => (
              <label key={k} className="block rounded-2xl bg-white px-3 py-2 ring-1 ring-line">
                <span className="flex items-center justify-between text-[15.5px] font-semibold">
                  {s.feelings[k]} <span className="text-[14.5px] tabular-nums text-deep">{feelings[k] ?? 0}/5</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={feelings[k] ?? 0}
                  onChange={(e) => setFeelings((f) => ({ ...f, [k]: Number(e.target.value) }))}
                  className="mt-1 w-full accent-[#3fa9b9]"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary !min-h-12" onClick={() => onAnswer({})}>
              {s.ui.feelingsNotApplicable}
            </button>
            <button className="btn-primary !min-h-12" onClick={() => onAnswer(feelings)}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
  }
}
