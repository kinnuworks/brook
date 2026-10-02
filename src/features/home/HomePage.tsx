import { ArrowRight, Camera, CheckCircle2, ImageIcon, MessagesSquare, Mic, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { Link } from "react-router";
import { BrookAvatar } from "@/components/BrookAvatar";
import { CITIES, SITES } from "@/core/sites";
import { useStrings } from "@/i18n";

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

function PhonePreview() {
  return (
    <div className="relative mx-auto w-[300px] animate-float">
      <div className="rounded-[44px] bg-deep-900 p-2.5 shadow-[var(--shadow-lift)]">
        <div className="overflow-hidden rounded-[36px] bg-mist">
          <div className="flex items-center justify-between bg-white px-4 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <BrookAvatar size={30} state="speaking" />
              <div className="leading-tight">
                <div className="text-[13px] font-bold text-deep-900">Ribeira de Coselhas</div>
                <div className="text-[11px] text-ink-soft">Coimbra · step 7 of 22</div>
              </div>
            </div>
            <Mic className="size-4 text-leaf-700" />
          </div>
          <div className="h-1 bg-aqua-100">
            <div className="h-1 w-1/3 rounded-r-full bg-aqua" />
          </div>
          <div className="space-y-2.5 p-3 text-[13px]">
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3 py-2 shadow-sm">
              And the banks: natural, artificial like concrete walls, or stones laid without concrete?
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-aqua-50 px-3 py-2 ring-1 ring-aqua-200">
              <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-aqua-700">
                <ImageIcon className="size-3" /> From your photo
              </div>
              Looks like <b>laid stones</b>: loose rocks along both banks, no mortar.
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-deep px-3 py-2 text-white">Yes, loose stones.</div>
            <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-leaf-100 px-2.5 py-1 text-[11px] font-semibold text-leaf-700">
              <CheckCircle2 className="size-3" /> Banks · Laid stones
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white px-3 py-2 shadow-sm">
              Do you see any of these: sand banks, stone deposits, riffles, or plants growing in the water?
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 px-3 pb-4">
            {["Stone deposits", "Riffles", "Water plants", "None"].map((c) => (
              <div key={c} className="rounded-xl bg-white px-2.5 py-2 text-[12px] font-semibold ring-1 ring-line">
                {c}
              </div>
            ))}
          </div>
        </div>
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
