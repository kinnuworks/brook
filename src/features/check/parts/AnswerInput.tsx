import { Check, Image as ImageIcon, Minus, Plus, X } from "lucide-react";
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

const same = (a: AnswerValue | undefined, b: AnswerValue | undefined) =>
  Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x) => b.includes(x)) : a === b;

function OptionChip({ label, official, on, onClick, suggested, picture }: { label: string; official?: string; on?: boolean; onClick: () => void; suggested?: boolean; picture?: React.ReactNode }) {
  return (
    <button className={`chip ${on ? "chip-on" : ""}`} onClick={onClick} aria-pressed={on}>
      {picture ? (
        <span className="relative shrink-0">
          {picture}
          {on && (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-aqua text-white ring-2 ring-white">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
          )}
        </span>
      ) : (
        <span className={`grid size-6 shrink-0 place-items-center rounded-full ring-[1.5px] ${on ? "bg-aqua ring-aqua text-white" : "ring-line"}`}>
          {on && <Check className="size-4" strokeWidth={3} />}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold leading-tight">{label}</span>
        {official && official !== label && <span className="mt-0.5 block text-[12.5px] text-ink-soft">{official}</span>}
      </span>
      {suggested && <ImageIcon className="size-4 shrink-0 text-aqua-700" aria-label="suggested from your photo" />}
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
  const [feelings, setFeelings] = useState<Feelings>({ joy: 0, serenity: 0, anger: 0, fear: 0 });

  // Reset local state for each new question, seeded by a photo suggestion or what was heard.
  useEffect(() => {
    const seed = draft ?? suggestion?.value;
    setMulti(q.kind === "multi" && Array.isArray(seed) ? (seed as string[]) : []);
    setNum(q.kind === "number" && typeof seed === "number" ? String(seed) : q.id === "numberOfDams" ? "1" : "");
    setFree(q.kind === "text" && typeof seed === "string" ? seed : "");
    setFeelings(q.kind === "feelings" && seed && typeof seed === "object" && !Array.isArray(seed) ? { joy: 0, serenity: 0, anger: 0, fear: 0, ...(seed as Feelings) } : { joy: 0, serenity: 0, anger: 0, fear: 0 });
  }, [qid, draft, suggestion, q.kind, q.id]);

  const offeredBox = suggestion && q.kind !== "multi" && q.kind !== "yesno" && (
    <div className="mb-3 rounded-2xl bg-aqua-50 p-3.5 ring-1 ring-aqua-200">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-aqua-700">
        <ImageIcon className="size-4" aria-hidden /> {s.ui.fromYourPhoto}
      </div>
      <div className="mt-1 text-[17px] font-bold text-deep-900">{describe(lang, qid, suggestion.value)}</div>
      {suggestion.evidence && <p className="mt-0.5 text-[14px] text-ink-soft">“{suggestion.evidence}”</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-primary !min-h-12" onClick={() => onAnswer(suggestion.value)}>
          <Check className="size-5" /> {s.ui.confirm}
        </button>
        <button className="btn-secondary !min-h-12" onClick={onRejectSuggestion}>
          <X className="size-5" /> {s.ui.change}
        </button>
      </div>
    </div>
  );

  const side = /Left$/.test(qid) ? "left" : /Right$/.test(qid) ? "right" : undefined;
  const marginDiagram = q.section === "margins" && side && (
    <div className="mb-3 flex items-center gap-3 rounded-2xl bg-aqua-50 p-2 pr-3">
      <DownstreamDiagram side={side} leftLabel={s.ui.left} rightLabel={s.ui.right} />
      <p className="text-[13.5px] font-medium leading-snug text-deep-900">{s.ui.facingDownstream}</p>
    </div>
  );

  switch (q.kind) {
    case "single":
    case "rating":
      return (
        <div>
          {marginDiagram}
          {offeredBox}
          <div className={`grid gap-2 ${q.kind === "rating" ? "" : (q.codes?.length ?? 0) > 3 ? "sm:grid-cols-2" : ""}`}>
            {q.codes!.map((code) => (
              <OptionChip
                key={code}
                label={text.options?.[code]?.label ?? code}
                official={q.kind === "rating" ? undefined : text.options?.[code]?.official}
                suggested={same(suggestion?.value, code)}
                picture={hasPictogram(qid, code) ? <Pictogram qid={qid} code={code} /> : undefined}
                onClick={() => onAnswer(code)}
              />
            ))}
          </div>
        </div>
      );
    case "multi":
      return (
        <div>
          {suggestion && (
            <p className="mb-2 flex items-center gap-1.5 text-[13.5px] text-aqua-700">
              <ImageIcon className="size-4" aria-hidden /> {s.ui.fromYourPhoto}: {describe(lang, qid, suggestion.value)}
              {suggestion.evidence ? ` — “${suggestion.evidence}”` : ""}
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {q.codes!.map((code) => (
              <OptionChip
                key={code}
                label={text.options?.[code]?.label ?? code}
                official={text.options?.[code]?.official}
                on={multi.includes(code)}
                suggested={Array.isArray(suggestion?.value) && (suggestion!.value as string[]).includes(code)}
                onClick={() => setMulti((m) => (m.includes(code) ? m.filter((c) => c !== code) : [...m, code]))}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => onAnswer([])}>
              {s.ui.none}
            </button>
            <button className="btn-primary" disabled={!multi.length} onClick={() => onAnswer(multi)}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
    case "yesno":
      return (
        <div>
          {marginDiagram}
          {suggestion && (
            <p className="mb-2 flex items-center gap-1.5 text-[13.5px] text-aqua-700">
              <ImageIcon className="size-4" aria-hidden /> {s.ui.fromYourPhoto}: {describe(lang, qid, suggestion.value)}
              {suggestion.evidence ? ` — “${suggestion.evidence}”` : ""}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <OptionChip label={s.ui.yes} suggested={suggestion?.value === true} onClick={() => onAnswer(true)} />
            <OptionChip label={s.ui.no} suggested={suggestion?.value === false} onClick={() => onAnswer(false)} />
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
                <button key={p.label} className="chip !min-h-12 justify-center !py-2.5 text-center" onClick={() => onAnswer(p.value)}>
                  <span>
                    <span className="block text-[15px] font-semibold">{p.label}</span>
                    <span className="block text-[12.5px] text-ink-soft">≈ {p.value} m</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            {!isDepth && (
              <button className="btn-secondary !px-4" aria-label="minus" onClick={() => setNum(String(Math.max(q.min ?? 0, (Number(num) || 0) - 1)))}>
                <Minus className="size-5" />
              </button>
            )}
            <label className="relative flex-1">
              <span className="sr-only">{text.title}</span>
              <input
                inputMode="decimal"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-center text-[20px] font-bold ring-[1.5px] ring-line outline-none focus:ring-aqua"
                placeholder={isDepth ? "0.5" : "1"}
              />
              {isDepth && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-soft">m</span>}
            </label>
            {!isDepth && (
              <button className="btn-secondary !px-4" aria-label="plus" onClick={() => setNum(String(Math.min(q.max ?? 99, (Number(num) || 0) + 1)))}>
                <Plus className="size-5" />
              </button>
            )}
          </div>
          <button className="btn-primary w-full" disabled={!valid} onClick={() => onAnswer(isDepth ? Math.round(value * 100) / 100 : Math.round(value))}>
            {s.ui.done}
          </button>
        </div>
      );
    }
    case "text":
      return (
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {s.ui.invasiveExamples.map((ex) => (
              <button
                key={ex}
                className="rounded-full bg-white px-3 py-2 text-[14px] font-semibold text-deep ring-1 ring-line hover:ring-aqua"
                onClick={() => setFree((f) => (f ? `${f}, ${ex}` : ex))}
              >
                + {ex}
              </button>
            ))}
          </div>
          <input
            value={free}
            onChange={(e) => setFree(e.target.value)}
            className="w-full rounded-2xl bg-white px-4 py-3.5 text-[17px] ring-[1.5px] ring-line outline-none focus:ring-aqua"
            placeholder={text.official}
            maxLength={300}
          />
          <button className="btn-primary w-full" disabled={free.trim().length < 2} onClick={() => onAnswer(free.trim())}>
            {s.ui.done}
          </button>
        </div>
      );
    case "feelings":
      return (
        <div className="space-y-3">
          {FEELINGS.map((k) => (
            <label key={k} className="block rounded-2xl bg-white p-3 ring-1 ring-line">
              <span className="flex items-center justify-between text-[16px] font-semibold">
                {s.feelings[k]} <span className="text-[15px] tabular-nums text-deep">{feelings[k] ?? 0}/5</span>
              </span>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={feelings[k] ?? 0}
                onChange={(e) => setFeelings((f) => ({ ...f, [k]: Number(e.target.value) }))}
                className="mt-2 w-full accent-[#3fa9b9]"
              />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-secondary" onClick={() => onAnswer({})}>
              {s.ui.feelingsNotApplicable}
            </button>
            <button className="btn-primary" onClick={() => onAnswer(feelings)}>
              {s.ui.done}
            </button>
          </div>
        </div>
      );
  }
}
