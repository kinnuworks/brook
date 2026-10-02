import { CheckCircle2, MapPin } from "lucide-react";
import { activeQuestions, QUESTION_BY_ID, type Section } from "@/core/protocol";
import { useStrings } from "@/i18n";
import { describe, useCheck, type Step } from "../store";
import { SOURCE_ICON } from "./Transcript";

const SECTIONS: Section[] = ["see", "water", "margins", "overall", "feelings"];
const ORDER: Step[] = ["intro", "safety", "site", "photos", "analyzing", "question", "secondLook", "review", "submitting"];
type State = "done" | "now" | "todo";

function Dot({ state }: { state: State }) {
  if (state === "done") return <CheckCircle2 className="size-5 shrink-0 text-leaf-700" aria-hidden />;
  if (state === "now")
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-aqua-100 ring-2 ring-aqua" aria-hidden>
        <span className="size-2 rounded-full bg-deep" />
      </span>
    );
  return <span className="size-5 shrink-0 rounded-full ring-[1.5px] ring-line" aria-hidden />;
}

/** On wide screens: where you are in the check, and everything you've said so far. */
export function SidePanel() {
  const s = useStrings();
  const step = useCheck((st) => st.step);
  const site = useCheck((st) => st.site);
  const photos = useCheck((st) => st.photos);
  const answers = useCheck((st) => st.answers);
  const sources = useCheck((st) => st.sources);
  const current = useCheck((st) => st.current);
  const lang = useCheck((st) => st.lang);
  const list = activeQuestions(answers);
  const at = ORDER.indexOf(step);
  const stages: { key: string; label: string; state: State; count?: string }[] = [
    {
      key: "safety",
      label: s.ui.stageSafety,
      state: at > 1 ? "done" : at === 1 ? "now" : "todo",
    },
    {
      key: "site",
      label: s.ui.stageStream,
      state: site ? "done" : step === "site" ? "now" : "todo",
    },
    {
      key: "photos",
      label: s.ui.stagePhotos,
      state: at > 4 ? "done" : at >= 3 ? "now" : "todo",
    },
    ...SECTIONS.map((sec) => {
      const qs = list.filter((q) => q.section === sec);
      const done = qs.filter((q) => q.id in answers).length;
      const now = step === "question" && current !== null && QUESTION_BY_ID[current].section === sec;
      return {
        key: sec,
        label: s.sections[sec].title,
        count: `${done}/${qs.length}`,
        state: (qs.length && done === qs.length && !now ? "done" : now ? "now" : "todo") as State,
      };
    }),
    { key: "review", label: s.ui.review, state: at >= 6 ? "now" : "todo" },
  ];
  const answered = list.filter((q) => q.id in answers);
  const shots = Object.entries(photos);

  return (
    <aside className="hidden w-[340px] shrink-0 flex-col gap-4 overflow-y-auto pb-1 lg:flex" aria-label={s.ui.yourCheck}>
      <section className="card p-5">
        <p className="eyebrow">{s.ui.yourCheck}</p>
        {site ? (
          <div className="mt-2 flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-5 shrink-0 text-aqua-700" aria-hidden />
            <div className="min-w-0">
              <div className="text-[17px] font-bold leading-snug text-deep-900">{site.name}</div>
              <div className="text-[13.5px] text-ink-soft">{[site.city, site.custom ? null : site.code].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-[15px] text-ink-soft">{s.ui.tagline}</p>
        )}
        {shots.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {shots.map(([slot, p]) => (
              <img key={slot} src={p!.dataUrl} alt="" className="aspect-square w-full rounded-xl object-cover ring-1 ring-line" />
            ))}
          </div>
        )}
        <ol className="mt-4 space-y-1">
          {stages.map((st) => (
            <li key={st.key} className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${st.state === "now" ? "bg-aqua-50" : ""}`}>
              <Dot state={st.state} />
              <span className={`flex-1 text-[15px] ${st.state === "todo" ? "text-ink-soft" : "font-semibold text-deep-900"}`}>{st.label}</span>
              {st.count && <span className="text-[13px] tabular-nums text-ink-faint">{st.count}</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card min-h-0 p-5">
        <p className="eyebrow">{s.ui.answersSoFar}</p>
        {answered.length ? (
          <ul className="mt-2 divide-y divide-line">
            {answered.map((q) => {
              const src = sources[q.id];
              const Icon = src ? SOURCE_ICON[src] : null;
              return (
                <li key={q.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-ink-soft">{s.q[q.id].title}</span>
                    <span className="block truncate text-[15px] font-semibold text-ink">{describe(lang, q.id, answers[q.id]!)}</span>
                  </span>
                  {Icon && <Icon className="size-4 shrink-0 text-ink-faint" aria-label={s.ui.sources[src!]} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-[14.5px] text-ink-soft">{s.ui.nothingYet}</p>
        )}
      </section>
    </aside>
  );
}
