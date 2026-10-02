import { ArrowRight, CheckCircle2, CloudRain, Download, ExternalLink, FlaskConical, HeartPulse, Leaf, Loader2, PawPrint, Thermometer, Users, Volume2, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { BrookAvatar } from "@/components/BrookAvatar";
import { bandOfCitizen, bandOfLab, labHeadline, oneHealthTips, riskLevel } from "@/core/onehealth";
import { FEELINGS, SPEECH_LOCALE, type Lang } from "@/core/protocol";
import { SITE_BY_CODE } from "@/core/sites";
import { fmt, useStrings } from "@/i18n";
import { speak, stopSpeaking } from "@/lib/speech";
import { useSettings } from "@/lib/settings";
import { describe } from "../check/store";
import { loadStory, type StoryData } from "./storyData";
import { SusCard } from "./SusCard";

const QUALITY_TONE: Record<string, string> = {
  High: "bg-leaf-100 text-leaf-700",
  Good: "bg-leaf-100 text-leaf-700",
  Moderate: "bg-sun-100 text-[#8a5a00]",
  Poor: "bg-clay-100 text-clay-700",
  Bad: "bg-clay-100 text-clay-700",
};
const RATING_TONE: Record<string, string> = {
  GOOD: "from-leaf to-[#6fb02c]",
  MODERATE: "from-sun to-[#e19a1c]",
  POOR: "from-clay to-[#b24a2a]",
};

function yearsAgo(date: string) {
  const y = (Date.now() - Date.parse(date)) / (365.25 * 864e5);
  return y < 1 ? `${Math.max(1, Math.round(y * 12))} mo` : `${y.toFixed(1)} y`;
}

export default function StoryPage() {
  const { id = "" } = useParams();
  const s = useStrings();
  const lang = useSettings((st) => st.lang);
  const [data, setData] = useState<StoryData | null | undefined>(undefined);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    void loadStory(id).then(setData);
    return () => stopSpeaking();
  }, [id]);

  const site = data && !data.site.custom ? SITE_BY_CODE.get(data.site.code) : null;
  const headline = labHeadline(site);
  const tips = useMemo(() => (data ? oneHealthTips(data.answers, site, data.weather) : null), [data, site]);

  if (data === undefined) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-7 animate-spin text-aqua-700" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[18px]">{s.story.notOnDevice}</p>
        <Link to="/hub" className="btn-primary mt-6">
          {s.ui.hubTitle}
        </Link>
      </div>
    );
  }

  const a = data.answers;
  const citizenBand = bandOfCitizen(a.overallAssessment);
  const labBand = headline ? bandOfLab(String(headline.value)) : null;
  const risk = site?.risk;
  const level = riskLevel(risk?.health);
  const feelings = (a.feelings ?? {}) as Record<string, number>;
  const storyLang = (data.lang as Lang) ?? lang;

  const highlights = (["channelForm", "banksChannelType", "waterColor", "waterFlow", "habitats", "isVegetationCoveredLeft", "isVegetationCoveredRight", "pipes", "waterDischarge"] as const)
    .filter((k) => k in a && a[k] !== null)
    .map((k) => ({
      k,
      label: s.q[k].title,
      value: describe(storyLang, k, a[k]!),
    }));

  const tipCards = tips
    ? [
        {
          icon: Users,
          title: s.story.tipsFor.people,
          text: s.story.tips[tips.people.tip],
        },
        {
          icon: PawPrint,
          title: s.story.tipsFor.animals,
          text: s.story.tips[tips.animals.tip],
        },
        {
          icon: Leaf,
          title: s.story.tipsFor.nature,
          text: s.story.tips[tips.nature.tip],
        },
      ]
    : [];

  const readAloud = () => {
    if (reading) {
      stopSpeaking();
      return setReading(false);
    }
    const parts = [
      s.story.title + ".",
      data.site.name + ".",
      citizenBand && labBand ? (citizenBand === labBand ? s.story.agree : s.story.differ) : "",
      ...tipCards.map((t) => `${t.title}: ${t.text}`),
      s.story.thanks,
    ];
    setReading(true);
    speak(parts.filter(Boolean).join(" "), SPEECH_LOCALE[storyLang], {
      onEnd: () => setReading(false),
    });
  };

  const downloadFhir = () => {
    if (!data.fhir) return;
    const blob = new Blob([JSON.stringify(data.fhir, null, 2)], {
      type: "application/fhir+json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brook-check-${data.id.slice(0, 8)}.fhir.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const riskCard = (
    <div className="card p-6">
      <p className="eyebrow flex items-center gap-1.5">
        <HeartPulse className="size-4" aria-hidden /> {s.story.healthRisk}
      </p>
      {risk && typeof risk.health === "number" ? (
        <>
          <p className="mt-2 text-[14px] leading-snug text-ink-soft">{s.story.riskExplain}</p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[34px] font-bold tabular-nums text-deep-900">{risk.health.toFixed(2)}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${level === "low" ? "bg-leaf-100 text-leaf-700" : level === "medium" ? "bg-sun-100 text-[#8a5a00]" : "bg-clay-100 text-clay-700"}`}
            >
              {level === "low" ? s.story.riskLow : level === "medium" ? s.story.riskMedium : s.story.riskHigh}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {(
              [
                [s.story.risks.pathogen, risk.pathogen],
                [s.story.risks.fecal, risk.fecal],
                [s.story.risks.arg, risk.arg],
              ] as const
            ).map(([label, v]) => (
              <div key={label}>
                <div className="flex justify-between text-[13px] text-ink-soft">
                  <span>{label}</span>
                  <span className="tabular-nums">{typeof v === "number" ? v.toFixed(2) : "—"}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-aqua-100">
                  <div className="h-2 rounded-full bg-gradient-to-r from-aqua to-deep" style={{ width: `${Math.min(100, (v ?? 0) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-faint">OneAquaHealth Resilience Map · {risk.date}</p>
        </>
      ) : (
        <p className="mt-3 text-[15px] text-ink-soft">{s.story.noLabData}</p>
      )}
    </div>
  );

  const weatherCard = (
    <div className="card p-6">
      <p className="eyebrow">{s.story.weather}</p>
      {data.weather ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-aqua-50 p-4">
            <CloudRain className="size-5 text-aqua-700" aria-hidden />
            <div className="mt-2 text-[24px] font-bold tabular-nums">{data.weather.rain72hMm} mm</div>
            <div className="text-[13px] text-ink-soft">{s.story.rainLabel}</div>
          </div>
          <div className="rounded-2xl bg-sun-100/70 p-4">
            <Thermometer className="size-5 text-[#8a5a00]" aria-hidden />
            <div className="mt-2 text-[24px] font-bold tabular-nums">{data.weather.maxTempC ?? "—"}°C</div>
            <div className="text-[13px] text-ink-soft">{s.story.maxTemp}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-[15px] text-ink-soft">—</p>
      )}
      <p className="mt-3 text-[12.5px] text-ink-faint">Open-Meteo</p>
    </div>
  );

  const feelingsCard = (
    <div className="card p-6">
      <p className="eyebrow">{s.story.feelingsTitle}</p>
      <div className="mt-3 space-y-2.5">
        {FEELINGS.map((k) => (
          <div key={k}>
            <div className="flex justify-between text-[14px]">
              <span className="font-semibold">{s.feelings[k]}</span>
              <span className="tabular-nums text-ink-soft">{feelings[k] ?? 0}/5</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-aqua-100">
              <div className={`h-2 rounded-full ${k === "anger" || k === "fear" ? "bg-clay" : "bg-leaf"}`} style={{ width: `${((feelings[k] ?? 0) / 5) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const photosCard = data.photos.length > 0 && (
    <div className="card p-6">
      <div className="grid grid-cols-3 gap-2">
        {data.photos.map((p) => (
          <img key={p.slot} src={p.src} alt={p.slot} className="aspect-square w-full rounded-xl object-cover" />
        ))}
      </div>
      {data.biodiversity && <p className="mt-3 text-[14.5px] text-ink-soft">{data.biodiversity}</p>}
    </div>
  );

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-aqua-100 to-mist">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-12 lg:pt-12">
          <div>
            <div className="flex items-center gap-3">
              <BrookAvatar size={48} state={reading ? "speaking" : "idle"} />
              <p className="eyebrow">{s.story.title}</p>
            </div>
            <h1 className="mt-3 font-serif text-[40px] leading-[1.05] text-deep-900 md:text-[56px]">{data.site.name}</h1>
            <p className="mt-1 text-[15px] text-ink-soft">
              {[
                data.site.city,
                new Date(data.createdAt).toLocaleString(storyLang, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
                data.site.code,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-4 max-w-xl text-[18px] text-ink">{s.story.thanks}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={readAloud}>
                <Volume2 className="size-5" /> {s.story.readAloud}
              </button>
              {data.status === "pending" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sun-100 px-3 py-2 text-[14px] font-semibold text-[#8a5a00]">
                  <WifiOff className="size-4" /> {s.brook.offlineQueued}
                </span>
              )}
            </div>
          </div>
          {data.photos.length > 0 && (
            <div className="hidden grid-cols-2 gap-3 lg:grid" aria-hidden>
              {data.photos.slice(0, 3).map((p, i) => (
                <img
                  key={p.slot}
                  src={p.src}
                  alt=""
                  className={`w-full rounded-3xl object-cover shadow-[var(--shadow-lift)] ring-4 ring-white ${i === 0 ? "col-span-2 aspect-[16/8]" : "aspect-[4/3]"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        <div className="min-w-0 space-y-5">
          {/* You vs the lab */}
          <section className="card overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-6">
                <p className="eyebrow">{s.story.youSaw}</p>
                <div className={`mt-3 inline-flex rounded-2xl bg-gradient-to-br px-4 py-2 text-[20px] font-bold text-white ${RATING_TONE[String(a.overallAssessment)] ?? "from-aqua to-deep"}`}>
                  {describe(storyLang, "overallAssessment", a.overallAssessment ?? null)}
                </div>
                <ul className="mt-4 space-y-1.5 text-[15px]">
                  {highlights.map((h) => (
                    <li key={h.k} className="flex justify-between gap-3 border-b border-line/70 pb-1.5 last:border-0">
                      <span className="text-ink-soft">{h.label}</span>
                      <span className="text-right font-semibold">{h.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-aqua-50 p-6">
                <p className="eyebrow flex items-center gap-1.5">
                  <FlaskConical className="size-4" aria-hidden /> {s.story.scientistsFound}
                </p>
                {site && (site.lab.macroinvertebrates || site.lab.diatoms || site.lab.fish) ? (
                  <ul className="mt-3 space-y-2.5">
                    {(["macroinvertebrates", "diatoms", "fish"] as const).map((k) => {
                      const v = site.lab[k];
                      if (!v) return null;
                      return (
                        <li key={k} className="rounded-2xl bg-white p-3 ring-1 ring-aqua-200">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-semibold">{s.story.indicators[k]}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${QUALITY_TONE[String(v.value)] ?? "bg-aqua-100"}`}>
                              {s.story.quality[String(v.value)] ?? String(v.value)}
                            </span>
                          </div>
                          <p className="mt-1 text-[13px] text-ink-soft">
                            {s.story.indicatorHelp[k]} · {v.date.slice(0, 7)}
                            {v.richness ? ` · ${v.richness} taxa` : ""}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-ink-soft">{s.story.noLabData}</p>
                )}
                {headline && (
                  <p className="mt-3 text-[13px] text-ink-soft">
                    {s.story.lastLabVisit}: {headline.date} ({yearsAgo(headline.date)})
                  </p>
                )}
              </div>
            </div>
            {citizenBand && labBand && (
              <div className={`flex gap-3 border-t border-line p-5 ${citizenBand === labBand ? "bg-leaf-100/60" : "bg-sun-100/60"}`}>
                <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${citizenBand === labBand ? "text-leaf-700" : "text-[#8a5a00]"}`} aria-hidden />
                <div>
                  <p className="font-semibold">{citizenBand === labBand ? s.story.agree : s.story.differ}</p>
                  {citizenBand !== labBand && <p className="mt-1 text-[14.5px] text-ink-soft">{s.story.whyDiffer}</p>}
                </div>
              </div>
            )}
          </section>

          {/* On phones the side column's cards sit here, in reading order. */}
          <div className="grid gap-5 md:grid-cols-2 lg:hidden">
            {riskCard}
            {weatherCard}
          </div>

          {/* One Health tips */}
          <section className="card p-6">
            <h2 className="font-serif text-[28px] text-deep-900">{s.story.tipsTitle}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {tipCards.map((t) => (
                <article key={t.title} className="rounded-2xl bg-mist p-4 ring-1 ring-line">
                  <t.icon className="size-5 text-deep" aria-hidden />
                  <h3 className="mt-2 text-[15px] font-bold text-deep-900">{t.title}</h3>
                  <p className="mt-1 text-[15px] leading-snug text-ink">{t.text}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2 lg:hidden">
            {feelingsCard}
            {photosCard}
          </div>

          {/* The data */}
          <section className="card p-6">
            <p className="eyebrow">{s.story.yourCheck}</p>
            <div className="mt-3 rounded-2xl bg-aqua-50 p-4 text-[15px]">
              <p className="font-semibold text-deep-900">{s.story.sentTo}</p>
              {data.fhirResult ? (
                <p className={`mt-1 font-semibold ${data.fhirResult.ok ? "text-leaf-700" : "text-clay-700"}`}>
                  {data.fhirResult.ok
                    ? `✓ ${fmt(s.story.resourcesAccepted, { n: data.fhirResult.locations?.length ?? 0 })}`
                    : `${s.story.notAccepted} (${data.fhirResult.status || data.fhirResult.error})`}
                  <span className="font-normal text-ink-soft"> · {new URL(data.fhirResult.server).hostname}</span>
                </p>
              ) : (
                <p className="mt-1 text-ink-soft">—</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {data.fhir && (
                  <button className="btn-secondary !min-h-11 !text-[15px]" onClick={downloadFhir}>
                    <Download className="size-4.5" /> FHIR bundle
                  </button>
                )}
                {data.fhirResult?.ok && data.fhirResult.locations?.[0] && (
                  <a className="btn-ghost !min-h-11 !text-[15px]" href={`${data.fhirResult.server}/${data.fhirResult.locations[0].split("/_history")[0]}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4.5" /> {s.story.viewOnServer}
                  </a>
                )}
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-[15px] font-semibold text-deep">{s.story.technical}</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-deep-900 p-4 text-[12.5px] leading-relaxed text-aqua-100">{JSON.stringify(data.dto, null, 2)}</pre>
            </details>
          </section>

          {data.status !== "server" && <SusCard submissionId={data.status === "sent" ? data.id : undefined} trial={data.trial} />}

          <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
            <Link to="/check" className="btn-primary">
              {s.story.again} <ArrowRight className="size-5" />
            </Link>
            <Link to="/hub" className="btn-secondary">
              {s.ui.hubTitle}
            </Link>
          </div>
        </div>

        <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:block">
          {riskCard}
          {weatherCard}
          {feelingsCard}
        </aside>
      </div>
    </div>
  );
}
