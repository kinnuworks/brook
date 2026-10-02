import { ArrowRight, Camera, Check, CheckCircle2, ChevronDown, Ear, ImageIcon, Languages, MessagesSquare, Mic, ShieldCheck, Sparkles, Volume2, Waves, X } from "lucide-react";
import { Link } from "react-router";
import { BrookAvatar } from "@/components/BrookAvatar";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Pictogram } from "@/components/Pictogram";
import { CITIES, SITES } from "@/core/sites";
import { fmt, useStrings } from "@/i18n";

const FEATURE_ICONS = [MessagesSquare, Camera, Sparkles, Waves];

function WaveBand({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden ${className}`} aria-hidden>
      <svg className="absolute bottom-0 h-full w-[200%] animate-wave" viewBox="0 0 1600 100" preserveAspectRatio="none">
        <path d="M0 60 Q100 30 200 60 T400 60 T600 60 T800 60 T1000 60 T1200 60 T1400 60 T1600 60 V100 H0Z" fill="#6bc7d4" opacity="0.18" />
        <path d="M0 72 Q100 48 200 72 T400 72 T600 72 T800 72 T1000 72 T1200 72 T1400 72 T1600 72 V100 H0Z" fill="#216b8c" opacity="0.1" />
      </svg>
    </div>
  );
}

/** The check as it looks on a phone, drawn at real size inside the frame, in the site's language. */
function HeroScreen() {
  const s = useStrings();
  const q = s.q.banksChannelType;
  const laid = q.options?.LAS?.label ?? "";
  const letter = (code: string) => q.options?.[code]?.official?.match(/\(([A-Z])\)\s*$/)?.[1];
  return (
    <div className="absolute inset-0 flex flex-col pt-[50px] text-left">
      <div className="border-b border-line bg-white px-2 pt-1.5">
        <div className="flex items-center gap-1.5">
          <span className="grid size-11 place-items-center text-ink-soft">
            <X className="size-5" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[16px] font-bold text-deep-900">Alna – Bryn stasjon</div>
            <div className="truncate text-[13px] text-ink-soft">
              {s.sections.see.title} · 3 {s.ui.of} 21
            </div>
          </div>
          <span className="grid size-11 place-items-center text-ink-soft">
            <Ear className="size-5" />
          </span>
          <span className="grid size-11 place-items-center text-ink-soft">
            <Volume2 className="size-5" />
          </span>
        </div>
        <div className="px-2 pb-2.5 pt-2">
          <div className="h-1.5 rounded-full bg-aqua-100">
            <div className="h-full w-[14%] rounded-full bg-gradient-to-r from-aqua to-deep" />
          </div>
        </div>
      </div>

      <div className="fade-top flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-3 pb-3">
        <div className="flex justify-center">
          <span className="flex items-center gap-2 rounded-full bg-leaf-100 px-3 py-1.5 text-[13.5px] font-semibold text-leaf-700">
            <CheckCircle2 className="size-4" /> {s.q.bottomChannelType.title} · {s.q.bottomChannelType.options?.NAT?.label}
            <Mic className="size-3.5 opacity-70" />
          </span>
        </div>
        <div className="mt-4 flex items-end gap-2.5">
          <span className="w-8 shrink-0" />
          <div className="max-w-[88%] rounded-[22px] rounded-bl-md bg-white px-4 pb-3 pt-3 shadow-[var(--shadow-card)] ring-2 ring-aqua/50">
            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-aqua-700">
              {s.ui.question} 3 {s.ui.of} 21 · {s.sections.see.title}
            </p>
            <p className="mt-1 text-[18px] font-semibold leading-snug text-deep-900">{q.ask}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[13.5px] font-semibold text-ink-soft">
              {s.ui.officialQuestion} <ChevronDown className="size-4" />
            </p>
          </div>
        </div>
        <div className="mt-1.5 flex items-end gap-2.5">
          <BrookAvatar size={32} state="speaking" />
          <div className="max-w-[85%] rounded-[20px] rounded-bl-md bg-aqua-50 px-4 py-2.5 text-[17px] leading-snug ring-1 ring-aqua-200">
            <Camera className="mr-1.5 inline size-4 -translate-y-px text-aqua-700" />
            {fmt(s.brook.suggestion, { answer: laid.toLowerCase() })}
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-white px-3 pb-[30px] pt-3">
        <div className="rounded-2xl bg-gradient-to-br from-aqua-50 to-white p-3 ring-1 ring-aqua-200">
          <div className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-aqua-700">
            <Camera className="size-3.5" /> {s.ui.fromYourPhoto}
          </div>
          <div className="mt-0.5 text-[17px] font-bold text-deep-900">{laid}</div>
          <div className="mt-2.5 flex gap-2">
            <span className="btn-primary !min-h-11 flex-1 !gap-1.5 !px-2.5 !text-[15px]">
              <Check className="size-4.5" /> {s.ui.confirm}
            </span>
            <span className="btn-secondary !min-h-11 flex-1 !gap-1.5 !px-2.5 !text-[15px]">
              <X className="size-4.5" /> {s.ui.change}
            </span>
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {(["NAT", "ART", "LAS"] as const).map((code) => (
            <span key={code} className="option-tile !min-h-[92px]">
              {code === "LAS" && (
                <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-aqua-100 text-aqua-700">
                  <Camera className="size-3" />
                </span>
              )}
              <span className="absolute right-2.5 top-1.5 text-[11px] font-bold text-ink-faint">{letter(code)}</span>
              <span className="[&>svg]:h-9 [&>svg]:w-[54px]">
                <Pictogram qid="banksChannelType" code={code} />
              </span>
              <span className="text-[15px] font-semibold leading-tight">{q.options?.[code]?.label}</span>
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="flex h-[52px] min-w-0 flex-1 items-center truncate rounded-full bg-mist px-4 text-[16px] text-ink-faint ring-[1.5px] ring-line">{s.ui.typeOrTalk}</span>
          <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-deep text-white shadow-[0_8px_20px_-8px_rgb(33_107_140/0.6)]">
            <Mic className="size-6" />
          </span>
        </div>
      </div>
    </div>
  );
}

function PhonePreview() {
  const s = useStrings();
  // The two notes rest against the phone's frame (12 px), never over its screen.
  const note = "absolute right-[calc(100%-12px)] hidden w-[176px] rounded-2xl bg-white/95 p-3 shadow-[var(--shadow-lift)] ring-1 ring-line backdrop-blur xl:block";
  return (
    <div className="relative mx-auto w-[min(300px,82vw)] md:mr-2 md:w-[330px]" aria-hidden>
      <div className="animate-float">
        <PhoneFrame>
          <HeroScreen />
        </PhoneFrame>
      </div>
      <div className={`${note} top-[22%]`}>
        <div className="flex items-start gap-2 text-[13px] font-bold leading-snug text-leaf-700">
          <CheckCircle2 className="mt-px size-4 shrink-0" /> {s.q.banksChannelType.title} · {s.q.banksChannelType.options?.LAS?.label}
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{s.ui.sources["photo-confirmed"]}</p>
      </div>
      <div className={`${note} top-[60%]`}>
        <div className="flex items-center gap-2 text-[13px] font-bold text-deep-900">
          <Languages className="size-4 shrink-0 text-aqua-700" /> {s.home.trust[2]}
        </div>
        <p className="mt-1 text-[12.5px] font-semibold tracking-[0.12em] text-ink-soft">EN PT FR IT NL NO EL</p>
      </div>
    </div>
  );
}

export function HomePage() {
  const s = useStrings();
  const counts = Object.fromEntries(CITIES.map((c) => [c.id, SITES.filter((x) => x.city === c.id).length]));
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-aqua-100 via-aqua-50 to-mist">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-10 md:grid-cols-[1.15fr_1fr] md:pt-16">
          <div className="animate-rise">
            <p className="eyebrow">{s.ui.tagline}</p>
            <h1 className="mt-3 font-serif text-[42px] leading-[1.05] tracking-tight text-deep-900 md:text-[60px]">{s.ui.heroTitle}</h1>
            <p className="mt-5 max-w-xl text-[18px] leading-relaxed text-ink-soft">{s.ui.heroBody}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/check" className="btn-primary">
                <Mic className="size-5" /> {s.ui.start}
              </Link>
              <Link to="/check?demo=1" className="btn-secondary">
                <ImageIcon className="size-5" /> {s.ui.tryDemo}
              </Link>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-ink-soft">
              {s.home.trust.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-leaf-700" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <PhonePreview />
        </div>
        <WaveBand />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <h2 className="font-serif text-[32px] text-deep-900">{s.home.whatTitle}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {s.home.whatPoints.map((p, i) => (
            <article key={p.title} className="rounded-3xl bg-white/80 p-6 ring-1 ring-line">
              <span className="grid size-9 place-items-center rounded-full bg-aqua-100 text-[15px] font-bold text-deep">{i + 1}</span>
              <h3 className="mt-3 text-[18px] font-bold text-deep-900">{p.title}</h3>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-soft">{p.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-4 rounded-3xl bg-deep p-6 text-white">
          <BrookAvatar size={44} />
          <div>
            <h3 className="text-[18px] font-bold">{s.home.brookTitle}</h3>
            <p className="mt-1 text-[15.5px] leading-relaxed text-white/85">{s.home.brookBody}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {s.home.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i] ?? Sparkles;
            return (
              <article key={f.title} className="card p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-aqua-100 text-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-[19px] font-bold text-deep-900">{f.title}</h2>
                <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-soft">{f.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="font-serif text-[32px] text-deep-900">{s.home.stepsTitle}</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-5">
          {s.home.steps.map((step, i) => (
            <li key={step.title} className="relative rounded-3xl bg-white/70 p-5 ring-1 ring-line">
              <span className="grid size-9 place-items-center rounded-full bg-deep text-[15px] font-bold text-white">{i + 1}</span>
              <h3 className="mt-3 text-[17px] font-bold text-deep-900">{step.title}</h3>
              <p className="mt-1 text-[14.5px] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-6 overflow-hidden rounded-[32px] bg-deep-900 p-7 text-white md:grid-cols-[1fr_1.2fr] md:p-10">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-aqua">{s.home.researchersTitle}</p>
            <p className="mt-3 text-[21px] leading-snug text-white/90">{s.home.researchersBody}</p>
            <Link to="/hub" className="btn mt-6 bg-white text-deep-900 hover:bg-aqua-100">
              {s.ui.forResearchers} <ArrowRight className="size-5" />
            </Link>
          </div>
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-aqua">{s.home.citiesTitle}</p>
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CITIES.map((c) => (
                <li key={c.id} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <div className="text-[17px] font-bold">{c.name}</div>
                  <div className="text-[13px] text-white/60">{c.country}</div>
                  <div className="mt-2 text-[13px] font-semibold text-aqua">
                    {counts[c.id]} {s.home.sites}
                  </div>
                </li>
              ))}
              <li className="grid place-items-center rounded-2xl bg-aqua/15 p-4 text-center ring-1 ring-aqua/30">
                <ShieldCheck className="size-6 text-aqua" aria-hidden />
                <span className="mt-1 text-[13px] text-white/80">+ any stream, anywhere</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 pb-12 text-[13.5px] text-ink-soft">
        <p>{s.home.footer}</p>
        <p className="mt-2 flex flex-wrap gap-4">
          <Link className="font-semibold text-deep hover:underline" to="/about">
            {s.ui.howItWorks}
          </Link>
          <a className="font-semibold text-deep hover:underline" href="https://github.com/kinnuworks/brook" target="_blank" rel="noreferrer">
            Source code
          </a>
        </p>
      </footer>
    </div>
  );
}
