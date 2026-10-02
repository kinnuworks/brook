import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStrings } from "@/i18n";
import { useSettings } from "@/lib/settings";

/** The System Usability Scale (Brooke, 1986): ten statements, 1–5 agreement. */
export function SusCard({ submissionId, trial }: { submissionId?: string; trial: boolean }) {
  const s = useStrings();
  const lang = useSettings((st) => st.lang);
  const clientId = useSettings((st) => st.clientId);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const complete = answers.every((a) => a !== null);
  const score = complete ? answers.reduce<number>((sum, a, i) => sum + (i % 2 === 0 ? a! - 1 : 5 - a!), 0) * 2.5 : null;

  const send = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId, lang, answers, trial, comment, clientId: clientId.slice(0, 12) }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <section className="card flex items-start gap-3 p-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-700">
          <Check className="size-5" />
        </span>
        <div>
          <p className="font-semibold text-deep-900">{s.sus.thanks}</p>
          {score !== null && (
            <p className="mt-1 text-[14px] text-ink-soft">
              {s.sus.score}: <b className="text-deep-900">{score}</b>/100
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="text-[20px] font-bold text-deep-900">{s.sus.title}</h2>
      <p className="mt-1 text-[14.5px] text-ink-soft">{s.sus.intro}</p>
      <div className="mt-4 hidden justify-end md:flex" aria-hidden>
        <div className="flex w-[260px] justify-between px-1 text-[11.5px] text-ink-faint">
          <span>{s.sus.disagree}</span>
          <span>{s.sus.agree}</span>
        </div>
      </div>
      <ol className="mt-4 space-y-2.5 md:mt-1.5 md:space-y-1.5">
        {s.sus.items.map((item, i) => (
          <li key={i} className="rounded-2xl bg-mist p-3 ring-1 ring-line md:flex md:items-center md:gap-4 md:py-2">
            <p className="text-[15px] font-medium md:flex-1">{item}</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5 md:mt-0 md:w-[260px] md:shrink-0" role="radiogroup" aria-label={item}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={answers[i] === v}
                  aria-label={`${v} — ${v === 1 ? s.sus.disagree : v === 5 ? s.sus.agree : v}`}
                  onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                  className={`min-h-11 rounded-xl text-[15px] font-bold ring-1 transition md:min-h-10 ${answers[i] === v ? "bg-deep text-white ring-deep" : "bg-white text-deep ring-line hover:ring-aqua"}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11.5px] text-ink-faint md:hidden">
              <span>{s.sus.disagree}</span>
              <span>{s.sus.agree}</span>
            </div>
          </li>
        ))}
      </ol>
      <label className="mt-4 block">
        <span className="text-[14px] text-ink-soft">{s.sus.comment}</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-2xl bg-white p-3 text-[16px] ring-[1.5px] ring-line outline-none focus:ring-aqua" />
      </label>
      <button className="btn-primary mt-3 w-full" disabled={!complete || state === "sending"} onClick={() => void send()}>
        {state === "sending" && <Loader2 className="size-5 animate-spin" />} {s.sus.send}
      </button>
      {state === "error" && <p className="mt-2 text-center text-[14px] text-clay-700">{s.ui.sendFailed}</p>}
    </section>
  );
}
