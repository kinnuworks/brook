import { Loader2, PencilLine, Send } from "lucide-react";
import { activeQuestions, type Section } from "@/core/protocol";
import { useStrings } from "@/i18n";
import { describe, useCheck } from "../store";
import { SOURCE_ICON } from "./Transcript";

const ORDER: Section[] = ["see", "water", "margins", "overall", "feelings"];

export function Review({ onSubmit, busy }: { onSubmit: () => void; busy: boolean }) {
  const s = useStrings();
  const answers = useCheck((st) => st.answers);
  const sources = useCheck((st) => st.sources);
  const lang = useCheck((st) => st.lang);
  const edit = useCheck((st) => st.edit);
  const site = useCheck((st) => st.site);
  const list = activeQuestions(answers);
  return (
    <div className="space-y-3">
      {site && (
        <div className="rounded-2xl bg-aqua-50 px-4 py-2.5 text-[15px]">
          <span className="font-semibold text-deep-900">{site.name}</span>
          {site.city && <span className="text-ink-soft"> · {site.city}</span>}
        </div>
      )}
      {/* Scrolls on its own above the send button, fading at its foot so the list reads as continuing. */}
      <div className="fade-bottom grid max-h-[min(28rem,calc(62vh-8.5rem))] items-start gap-2.5 overflow-y-auto overscroll-contain pb-6 lg:grid-cols-2">
        {ORDER.map((section) => {
          const qs = list.filter((q) => q.section === section);
          if (!qs.length) return null;
          return (
            <section key={section} className="rounded-2xl border-[1.5px] border-line bg-white">
              <h3 className="border-b border-line px-4 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-aqua-700">{s.sections[section].title}</h3>
              <ul className="divide-y divide-line">
                {qs.map((q) => {
                  const answered = q.id in answers;
                  const src = sources[q.id];
                  const Icon = src ? SOURCE_ICON[src] : null;
                  return (
                    <li key={q.id} className="flex items-center gap-3 py-1.5 pl-4 pr-1.5">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] text-ink-soft">{s.q[q.id].title}</span>
                        <span className={`block text-[16px] font-semibold ${answered ? "text-ink" : "text-ink-faint"}`}>
                          {answered ? describe(lang, q.id, answers[q.id]!) : s.ui.notAnswered}
                        </span>
                      </span>
                      {Icon && <Icon className="size-4 shrink-0 text-ink-faint" aria-label={s.ui.sources[src!]} />}
                      <button className="grid size-11 shrink-0 place-items-center rounded-full text-deep hover:bg-aqua-100" onClick={() => edit(q.id)} aria-label={`${s.ui.edit}: ${s.q[q.id].title}`}>
                        <PencilLine className="size-4.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <button className="btn-primary w-full" onClick={onSubmit} disabled={busy || !answers.overallAssessment}>
        {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />} {busy ? s.ui.submitting : s.ui.submit}
      </button>
    </div>
  );
}
