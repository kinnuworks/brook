import { Download, FlaskConical, Info, Loader2, Mic, MousePointerClick, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStrings } from "@/i18n";
import { aiAgreement, feelingsByRating, FIXES, kpis, questionClarity, type HubRow } from "./analytics";
import { HubMap } from "./HubMap";

const RATING_TONE: Record<string, string> = { GOOD: "bg-leaf-100 text-leaf-700", MODERATE: "bg-sun-100 text-[#8a5a00]", POOR: "bg-clay-100 text-clay" };
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[13px] font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 text-[28px] font-bold tabular-nums text-deep-900">{value}</div>
      {hint && <div className="text-[12px] text-ink-faint">{hint}</div>}
    </div>
  );
}

function toCsv(rows: HubRow[]): string {
  const fields = ["created_at", "is_demo", "site_code", "site_name", "city", "lang", "mode", "duration_s"];
  const dtoFields = Array.from(new Set(rows.flatMap((r) => Object.keys(r.dto ?? {}))));
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("|") : v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    [...fields, ...dtoFields].join(","),
    ...rows.map((r) => [...fields.map((f) => esc((r as unknown as Record<string, unknown>)[f])), ...dtoFields.map((f) => esc((r.dto as unknown as Record<string, unknown>)[f]))].join(",")),
  ].join("\n");
}

export default function HubPage() {
  const s = useStrings();
  const [rows, setRows] = useState<HubRow[] | null>(null);
  const [withSim, setWithSim] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/submissions?limit=1000")
        .then((r) => (r.ok ? r.json() : { submissions: [] }))
        .then((d) => alive && setRows(d.submissions ?? []))
        .catch(() => alive && setRows([]));
    void load();
    const timer = window.setInterval(load, 15_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => withSim || !r.is_demo), [rows, withSim]);
  const live = (rows ?? []).filter((r) => !r.is_demo).length;
  const k = useMemo(() => kpis(shown), [shown]);
  const clarity = useMemo(() => questionClarity(shown).slice(0, 8), [shown]);
  const agreement = useMemo(() => aiAgreement(shown), [shown]);
  const feelings = useMemo(() => feelingsByRating(shown), [shown]);

  const download = () => {
    const blob = new Blob([toCsv(shown)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brook-checks.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <FlaskConical className="size-4" aria-hidden /> OneAquaHealth
          </p>
          <h1 className="mt-1 font-serif text-[40px] leading-tight text-deep-900">{s.hub.title}</h1>
          <p className="mt-1 max-w-2xl text-[16.5px] text-ink-soft">{s.hub.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[14.5px] font-semibold ring-1 ring-line">
            <input type="checkbox" checked={withSim} onChange={(e) => setWithSim(e.target.checked)} className="size-4.5 accent-[#216b8c]" />
            {s.hub.includeSimulated}
          </label>
          <button className="btn-secondary !min-h-11 !text-[15px]" onClick={download} disabled={!shown.length}>
            <Download className="size-4.5" /> {s.hub.downloadCsv}
          </button>
        </div>
      </header>

      {withSim && (
        <p className="flex items-start gap-2 rounded-2xl bg-sun-100 px-4 py-3 text-[14px] text-[#6b4700]">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {s.hub.simulatedNote} ({s.hub.live}: {live})
          </span>
        </p>
      )}

      {rows === null ? (
        <div className="flex items-center justify-center gap-2 py-24 text-ink-soft">
          <Loader2 className="size-5 animate-spin" /> {s.hub.loading}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <Kpi label={s.hub.checks} value={String(k.checks)} hint={`${live} ${s.hub.live.toLowerCase()}`} />
            <Kpi label={s.hub.sitesCovered} value={`${k.sites}/106`} />
            <Kpi label={s.hub.medianTime} value={k.medianMinutes ? `${k.medianMinutes} ${s.hub.minutes}` : "—"} />
            <Kpi label={s.hub.voiceShare} value={pct(k.voiceShare)} />
            <Kpi label={s.hub.aiAccepted} value={pct(k.acceptRate)} />
            <Kpi label={s.hub.languages} value={String(k.languages)} />
          </section>

          <section>
            <h2 className="mb-3 text-[20px] font-bold text-deep-900">{s.hub.mapTitle}</h2>
            <HubMap rows={shown} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
            <div className="card p-6">
              <h2 className="text-[20px] font-bold text-deep-900">{s.hub.clarityTitle}</h2>
              <p className="mt-1 text-[14.5px] text-ink-soft">{s.hub.clarityIntro}</p>
              <ol className="mt-4 space-y-3">
                {clarity.map((c, i) => (
                  <li key={c.qid} className="rounded-2xl bg-mist p-3.5 ring-1 ring-line">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[15.5px] font-bold">
                        {i + 1}. {s.q[c.qid].title}
                      </span>
                      <span className="text-[14px] font-bold tabular-nums text-deep">{pct(c.score)}</span>
                    </div>
                    <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-white ring-1 ring-line" aria-hidden>
                      <span className="bg-aqua" style={{ width: `${c.helpRate * 100}%` }} />
                      <span className="bg-sun" style={{ width: `${c.notSureRate * 100}%` }} />
                      <span className="bg-clay" style={{ width: `${c.unclearRate * 100}%` }} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 text-[12.5px] text-ink-soft">
                      <span>
                        <i className="mr-1 inline-block size-2 rounded-full bg-aqua" />
                        {s.hub.help} {pct(c.helpRate)}
                      </span>
                      <span>
                        <i className="mr-1 inline-block size-2 rounded-full bg-sun" />
                        {s.hub.notSure} {pct(c.notSureRate)}
                      </span>
                      <span>
                        <i className="mr-1 inline-block size-2 rounded-full bg-clay" />
                        {s.hub.unclear} {pct(c.unclearRate)}
                      </span>
                    </div>
                    {FIXES[c.qid] && i < 4 && (
                      <p className="mt-2 text-[13.5px] text-ink">
                        <b className="text-deep">{s.hub.fix}:</b> {FIXES[c.qid]}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-5">
              <div className="card p-6">
                <h2 className="text-[20px] font-bold text-deep-900">{s.hub.agreementTitle}</h2>
                <p className="mt-1 text-[14.5px] text-ink-soft">{s.hub.agreementIntro}</p>
                <div className="mt-3 h-[300px]">
                  <ResponsiveContainer>
                    <BarChart data={agreement.map((a) => ({ name: s.q[a.qid].title, [s.hub.accepted]: a.accepted, [s.hub.corrected]: a.corrected }))} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <CartesianGrid horizontal={false} stroke="#dbe8ed" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "#4b6474" }} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "#10283a" }} />
                      <Tooltip cursor={{ fill: "#f1fafb" }} />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey={s.hub.accepted} stackId="a" fill="#6bc7d4" radius={[4, 0, 0, 4]} />
                      <Bar dataKey={s.hub.corrected} stackId="a" fill="#216b8c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-6">
                <h2 className="text-[20px] font-bold text-deep-900">{s.hub.feelingsTitle}</h2>
                <p className="mt-1 text-[14.5px] text-ink-soft">{s.hub.feelingsIntro}</p>
                <div className="mt-3 h-[220px]">
                  <ResponsiveContainer>
                    <BarChart data={feelings.map((f) => ({ ...f, name: `${s.q.overallAssessment.options?.[f.rating]?.label} (${f.n})` }))} margin={{ left: -18, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="#dbe8ed" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#10283a" }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "#4b6474" }} />
                      <Tooltip cursor={{ fill: "#f1fafb" }} />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey="joy" name={s.feelings.joy} fill="#8cc740" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="serenity" name={s.feelings.serenity} fill="#6bc7d4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="anger" name={s.feelings.anger} fill="#c9603d" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="fear" name={s.feelings.fear} fill="#0d3245" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <h2 className="px-6 pt-5 text-[20px] font-bold text-deep-900">{s.hub.latestTitle}</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[14.5px]">
                <thead className="bg-mist text-[12.5px] uppercase tracking-wide text-ink-soft">
                  <tr>
                    <th className="px-6 py-2.5">{s.hub.when}</th>
                    <th className="px-3 py-2.5">{s.hub.site}</th>
                    <th className="px-3 py-2.5">{s.hub.rating}</th>
                    <th className="px-3 py-2.5">{s.hub.mode}</th>
                    <th className="px-3 py-2.5">{s.hub.lang}</th>
                    <th className="px-3 py-2.5">{s.hub.fhir}</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.slice(0, 25).map((r) => {
                    const ModeIcon = r.mode === "tap" ? MousePointerClick : r.mode === "voice" ? Mic : Sparkles;
                    return (
                      <tr key={r.id} className="hover:bg-aqua-50/60">
                        <td className="whitespace-nowrap px-6 py-2.5 text-ink-soft">{new Date(r.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-semibold">{r.site_name}</div>
                          <div className="text-[12.5px] text-ink-soft">
                            {r.city} · {r.site_code} {r.is_demo && <span className="ml-1 rounded bg-sun-100 px-1.5 py-0.5 text-[11px] font-semibold text-[#8a5a00]">{s.hub.simulated}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${RATING_TONE[r.dto.overallAssessment] ?? ""}`}>
                            {s.q.overallAssessment.options?.[r.dto.overallAssessment]?.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <ModeIcon className="size-4 text-ink-soft" aria-label={r.mode} />
                        </td>
                        <td className="px-3 py-2.5 uppercase text-ink-soft">{r.lang}</td>
                        <td className="px-3 py-2.5">{r.fhir_result ? (r.fhir_result.ok ? "✓" : "✗") : "—"}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Link to={`/story/${r.id}`} className="font-semibold text-deep hover:underline">
                            {s.hub.open}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
