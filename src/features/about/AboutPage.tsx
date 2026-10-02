import { BadgeCheck, Brain, Camera, ChevronDown, Globe2, HeartHandshake, Lock, MapPin, MessagesSquare, ShieldCheck, Sparkles, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { SITES_FETCHED_AT } from "@/core/sites";

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-[32px] leading-tight text-deep-900">{title}</h2>
      <div className="mt-4 space-y-3 text-[17px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function Point({ icon: Icon, title, children }: { icon: typeof MapPin; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <Icon className="mt-0.5 size-5 shrink-0 text-deep" aria-hidden />
      <div>
        <div className="font-bold text-deep-900">{title}</div>
        <div className="mt-0.5 text-[15.5px] text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

function Technical({ title = "Technical details", children }: { title?: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl bg-mist ring-1 ring-line">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[15px] font-semibold text-deep">
        {title}
        <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 px-4 pb-4 text-[14.5px] leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

/** How a check flows through Brook. Every box is real code in this repository. */
function Architecture() {
  const box = "fill-white stroke-[#dbe8ed]";
  return (
    <figure className="overflow-x-auto rounded-2xl bg-white p-3 ring-1 ring-line" tabIndex={0} aria-label="Architecture diagram (scrolls sideways on small screens)">
      <svg viewBox="0 0 980 430" className="min-w-[760px]" role="img" aria-labelledby="arch-title">
        <title id="arch-title">Brook architecture: from a person at the stream to OneAquaHealth's data and health-data systems</title>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#216b8c" />
          </marker>
        </defs>
        <style>{`text{font-family:DM Sans,system-ui,sans-serif;fill:#10283a} .t{font-size:15px;font-weight:700} .s{font-size:12.5px;fill:#4b6474} .l{stroke:#216b8c;stroke-width:1.6;fill:none;marker-end:url(#arr)}`}</style>
        <rect x="20" y="40" width="200" height="340" rx="26" className={box} strokeWidth="1.5" />
        <text x="40" y="74" className="t">On the phone</text>
        <text x="40" y="96" className="s">Voice or tap · 7 languages</text>
        <rect x="40" y="112" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="135" className="t" style={{ fontSize: 13.5 }}>Conversation</text>
        <text x="52" y="154" className="s">OAH's questions, in order</text>
        <rect x="40" y="178" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="201" className="t" style={{ fontSize: 13.5 }}>Understanding</text>
        <text x="52" y="220" className="s">word lists, no internet</text>
        <rect x="40" y="244" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="267" className="t" style={{ fontSize: 13.5 }}>Second look</text>
        <text x="52" y="286" className="s">7 rules + weather</text>
        <rect x="40" y="310" width="160" height="52" rx="12" fill="#ecf6df" />
        <text x="52" y="332" className="t" style={{ fontSize: 13.5 }}>Saved offline</text>
        <text x="52" y="350" className="s">sent when back online</text>
        <rect x="290" y="40" width="210" height="150" rx="20" className={box} strokeWidth="1.5" />
        <text x="310" y="72" className="t">Optional AI helper</text>
        <text x="310" y="96" className="s">Understands unusual replies</text>
        <text x="310" y="116" className="s">Suggests answers from photos</text>
        <text x="310" y="140" className="s">Only OAH's own answers allowed</text>
        <text x="310" y="160" className="s">Spending limits</text>
        <text x="310" y="180" className="s" style={{ fill: "#3d6914", fontWeight: 700 }}>The person confirms every answer</text>
        <rect x="290" y="230" width="210" height="150" rx="20" className={box} strokeWidth="1.5" />
        <text x="310" y="262" className="t">What a check becomes</text>
        <text x="310" y="286" className="s">OAH's own submission format</text>
        <text x="310" y="306" className="s">Health-data standard (HL7 FHIR)</text>
        <text x="310" y="326" className="s">Where each answer came from</text>
        <text x="310" y="346" className="s">Which questions were hard</text>
        <text x="310" y="366" className="s">Photos only if you agree</text>
        <rect x="570" y="40" width="190" height="96" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="72" className="t">Brook's storage</text>
        <text x="590" y="96" className="s">In the EU (Frankfurt)</text>
        <text x="590" y="116" className="s">Locked by a server key</text>
        <rect x="570" y="158" width="190" height="96" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="190" className="t">OAH health-data server</text>
        <text x="590" y="214" className="s">Run by HL7 Europe</text>
        <text x="590" y="234" className="s">for OneAquaHealth</text>
        <rect x="570" y="276" width="190" height="104" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="308" className="t">OAH public data</text>
        <text x="590" y="332" className="s">106 sites, lab results,</text>
        <text x="590" y="352" className="s">health-risk scores</text>
        <text x="590" y="372" className="s">Weather: Open-Meteo</text>
        <rect x="820" y="60" width="140" height="120" rx="20" fill="#0d3245" />
        <text x="838" y="94" className="t" style={{ fill: "#fff" }}>Research hub</text>
        <text x="838" y="118" className="s" style={{ fill: "#c6ebf1" }}>Map, hard</text>
        <text x="838" y="136" className="s" style={{ fill: "#c6ebf1" }}>questions, AI</text>
        <text x="838" y="154" className="s" style={{ fill: "#c6ebf1" }}>agreement</text>
        <rect x="820" y="230" width="140" height="120" rx="20" fill="#216b8c" />
        <text x="838" y="264" className="t" style={{ fill: "#fff" }}>Your stream's</text>
        <text x="838" y="284" className="t" style={{ fill: "#fff" }}>story</text>
        <text x="838" y="308" className="s" style={{ fill: "#e3f5f8" }}>You vs the lab,</text>
        <text x="838" y="326" className="s" style={{ fill: "#e3f5f8" }}>health tips</text>
        <path d="M200 205 C 245 205, 250 115, 288 115" className="l" />
        <path d="M200 270 C 245 270, 250 300, 288 300" className="l" />
        <path d="M500 300 C 535 300, 535 90, 568 90" className="l" />
        <path d="M500 305 C 535 305, 540 205, 568 205" className="l" />
        <path d="M760 90 L 818 110" className="l" />
        <path d="M760 330 C 790 330, 790 290, 818 290" className="l" />
        <path d="M760 205 C 790 205, 790 270, 818 280" className="l" />
      </svg>
    </figure>
  );
}

const STEPS = [
  { icon: ShieldCheck, title: "Stay safe", body: "A ten-second reminder to keep to the bank." },
  { icon: MapPin, title: "Find the stream", body: "Brook shows the nearest of OneAquaHealth's 106 research streams, or you add your own." },
  { icon: Camera, title: "Take three photos", body: "Looking upstream, downstream and around you." },
  { icon: MessagesSquare, title: "Answer about twenty questions", body: "By talking or tapping. Brook explains any word and suggests answers from your photos." },
  { icon: HeartHandshake, title: "See your stream's story", body: "What scientists found there, next to what you saw, with simple health tips." },
];

const TOC = [
  ["why", "Why we built it"],
  ["how", "What happens in a check"],
  ["ai", "How we use AI safely"],
  ["oah", "Built on OneAquaHealth"],
  ["cost", "What it costs"],
  ["privacy", "Your data"],
  ["tests", "How we tested it"],
  ["limits", "What we don't claim"],
] as const;

/** Which section is being read, for the side menu on wide screens. */
function useActiveSection() {
  const [active, setActive] = useState<string>(TOC[0][0]);
  useEffect(() => {
    const els = TOC.map(([id]) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

export default function AboutPage() {
  const active = useActiveSection();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
      <aside className="hidden lg:block">
        <nav className="sticky top-24" aria-label="On this page">
          <p className="eyebrow">On this page</p>
          <ul className="mt-3 space-y-0.5 border-l border-line">
            {TOC.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 text-[15px] transition ${active === id ? "border-deep font-semibold text-deep-900" : "border-transparent text-ink-soft hover:text-deep"}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/check" className="btn-primary mt-6 !min-h-11 w-full !px-4 !text-[15px]">
            Start a stream check
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 max-w-3xl space-y-14">
        <header>
          <p className="eyebrow">How Brook works</p>
          <h1 className="mt-2 font-serif text-[44px] leading-[1.05] text-deep-900">A friendly guide for OneAquaHealth's stream check</h1>
          <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">
            OneAquaHealth asks people to check the health of streams in their city by answering about twenty questions. The questions are useful, but many use hard
            words. Brook turns them into a simple conversation on your phone. It doesn't replace OneAquaHealth's app; it helps more people use it, and use it well.
          </p>
          <nav className="mt-6 flex flex-wrap gap-2 text-[14px] font-semibold lg:hidden" aria-label="On this page">
            {TOC.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-full bg-white px-3.5 py-2 text-deep ring-1 ring-line hover:ring-aqua">
                {label}
              </a>
            ))}
          </nav>
        </header>

        <Section id="why" eyebrow="The problem" title="Why we built it">
          <p>
            Imagine standing by a stream and reading: <em>“Is more than one third of the left margin covered by impervious areas?”</em> What is a margin? What does
            impervious mean? And left of what? (It means left when you face the way the water flows, which almost nobody knows.)
          </p>
          <p>
            When questions are confusing, people guess or give up, and scientists get answers they can't fully trust. OneAquaHealth's own hackathon brief says
            it: <em>“complex tools, confusing terminology, and low participation.”</em> Brook is our answer to that sentence.
          </p>
        </Section>

        <Section id="how" eyebrow="Step by step" title="What happens in a check">
          <ol className="grid gap-3 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-deep text-[14px] font-bold text-white">{i + 1}</span>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-deep-900">
                    <s.icon className="size-4.5 text-deep" aria-hidden /> {s.title}
                  </div>
                  <div className="mt-0.5 text-[15.5px] text-ink-soft">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
          <p>
            Along the way, if two answers don't fit together (say, “good” health but a pipe pouring dirty water in), Brook gently asks you to look again. It never
            changes your answer. You always have the final say.
          </p>
          <Technical title="Technical details: how the pieces fit">
            <Architecture />
            <p>
              The conversation is a fixed script that follows OneAquaHealth's questions in order (<code>src/core/protocol.ts</code>). Most replies are understood on
              the phone with word lists in seven languages (<code>src/core/matcher.ts</code>); only replies it can't understand are sent to the AI. Photos go to
              the AI only to suggest answers (<code>api/vision.ts</code>).
            </p>
          </Technical>
        </Section>

        <Section id="ai" eyebrow="Responsible AI" title="How we use AI safely">
          <div className="grid gap-3 sm:grid-cols-2">
            <Point icon={BadgeCheck} title="AI never decides">
              Every answer comes from the person, or is confirmed by them. The final “how healthy is this stream?” rating is always theirs.
            </Point>
            <Point icon={ShieldCheck} title="AI can only pick real answers">
              The AI can only choose from OneAquaHealth's own list of answers for that question. Anything else is thrown away.
            </Point>
            <Point icon={Brain} title="Works without AI">
              Brook understands most replies on the phone, with no AI. If the AI is switched off or its budget runs out, the check still works.
            </Point>
            <Point icon={Sparkles} title="Every answer is labelled">
              Brook records how each answer was given: tapped, spoken, or a photo suggestion the person accepted or corrected. Scientists can see this too.
            </Point>
          </div>
          <Technical>
            <p>
              The model (OpenAI <code>gpt-6-luna</code>) must reply in a strict JSON schema whose only allowed values are the current question's OneAquaHealth codes;
              the server checks again with the same validator the app uses. Citizen text is treated as data, never as instructions. Answer sources travel in the
              FHIR data as an extension and a Provenance record; values proposed by AI carry the HL7 security label <code>AIAST</code>.
            </p>
          </Technical>
        </Section>

        <Section id="oah" eyebrow="Fits what exists" title="Built on OneAquaHealth's own tools">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>The same questions and answers</b> as OneAquaHealth's Citizen Science App. A Brook check can be sent to OneAquaHealth without any changes.
            </li>
            <li>
              <b>Their 106 research streams</b> in Coimbra, Toulouse, Ghent, Benevento and Oslo, with their latest lab results and health-risk scores (data from{" "}
              {SITES_FETCHED_AT.slice(0, 10)}).
            </li>
            <li>
              <b>Their health-data standard.</b> Each check is also saved in the format health systems use to share data, following OneAquaHealth's own rules for
              it, and sent to their health-data server.
            </li>
          </ul>
          <Technical>
            <p>
              Questions, codes and the submission body (<code>CitizenSubmissionPutDTO</code>) come from the public API at <code>api.enora-oah.eu</code>; unit tests
              check our codes against their published lists. FHIR: R4 transaction shaped by the OneAquaHealth Implementation Guide (HL7 Europe): Location profile,
              the guide's indicator codes, validated with the official HL7 validator with 0 errors, and posted to the guide's sandbox. A citizen check is
              “preliminary”; once a researcher verifies it, it also passes the guide's indicator profile. See{" "}
              <a className="font-semibold text-deep underline" href="https://github.com/kinnuworks/brook/blob/main/docs/FHIR.md">docs/FHIR.md</a>.
            </p>
          </Technical>
        </Section>

        <Section id="cost" eyebrow="Sustainability" title="What it costs, and how OneAquaHealth could use it">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="text-[28px] font-bold text-deep-900">€0</div>
              <div className="text-[14.5px] text-ink-soft">to host for a pilot (free plans)</div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="text-[28px] font-bold text-deep-900">≈ 0.1 ¢</div>
              <div className="text-[14.5px] text-ink-soft">of AI per check, measured; €0 with AI off</div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="text-[28px] font-bold text-deep-900">≈ €15</div>
              <div className="text-[14.5px] text-ink-soft">of AI for 10,000 checks a year</div>
            </div>
          </div>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <b>Open it from their app.</b> OneAquaHealth's app could show a “talk me through it” button that opens Brook. (Brook already allows this.)
            </li>
            <li>
              <b>Send answers straight in.</b> Brook's answers are already in their format; it only needs a login from OneAquaHealth.
            </li>
            <li>
              <b>Check the words.</b> Each language is one file, so a local volunteer can review it in an afternoon.
            </li>
          </ol>
          <p className="text-[15px] text-ink-soft">No app store, nothing to install, open source. It can keep running after the project's funding ends.</p>
        </Section>

        <Section id="privacy" eyebrow="Privacy & security" title="Your data">
          <div className="grid gap-3 sm:grid-cols-2">
            <Point icon={Camera} title="Photos">
              Shrunk on your phone, with their location removed, before anything is sent. Shared with researchers only if you tick the box.
            </Point>
            <Point icon={Globe2} title="No accounts">
              No sign-up. Your phone gets a random code, which is scrambled before it leaves. We never store your internet address.
            </Point>
            <Point icon={Lock} title="Kept in Europe, locked">
              Answers are stored in the EU. Only Brook's own server, with a secret key, can read or write them.
            </Point>
            <Point icon={WifiOff} title="Works with no signal">
              If you lose signal at the stream, your check is kept on your phone and sent when you're back online.
            </Point>
          </div>
          <Technical>
            <p>
              Photos are re-encoded through a canvas (all EXIF/GPS dropped). Supabase Postgres in Frankfurt; every table has row-level security with no public
              policies; access only through <code>SECURITY DEFINER</code> functions that check a server-only secret. Rate limits use a salted daily hash of the IP,
              never the IP itself. Strict Content-Security-Policy, same-origin checks, size limits and server-side validation of every field.
            </p>
          </Technical>
        </Section>

        <Section id="tests" eyebrow="Evidence" title="How we tested it">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <b>Understanding replies:</b> 238 realistic replies in seven languages, written by someone who never saw Brook's word lists. Brook understood 93%
              correctly on first sight, with no AI. After fixing three general problems it found, 96%, with none recorded wrongly.
            </li>
            <li>
              <b>Photo suggestions:</b> 36 real photos of streams in Oslo, Toulouse and near Ghent that Brook had never seen. We wrote down only what each
              photo clearly shows. Brook's suggestions were right 132 times out of 134. For three pictures that weren't streams (two maps and a plant), it
              said so and suggested nothing.
            </li>
            <li>
              <b>Health-data format:</b> checked with the official HL7 validator against OneAquaHealth's own rules: 0 errors.
            </li>
            <li>
              <b>Everyone can use it:</b> an automatic accessibility scan (WCAG 2.1 AA) found 0 problems on every screen.
            </li>
            <li>
              <b>No signal:</b> a test cuts the internet mid-check. The check is kept and sent when the connection returns.
            </li>
            <li>
              <b>Over 100 automatic tests</b> run on every change, and a robot walks through a full check on a phone-sized screen.
            </li>
          </ul>
          <p className="text-[15px] text-ink-soft">
            Everything is in the code, with the commands to repeat it:{" "}
            <a className="font-semibold text-deep underline" href="https://github.com/kinnuworks/brook">github.com/kinnuworks/brook</a>.
          </p>
        </Section>

        <Section id="limits" eyebrow="Honesty" title="What we don't claim">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              The research hub starts with <b>made-up example checks</b>, clearly marked “Simulated”, so you can see how it works. Real checks are marked “Field”.
            </li>
            <li>The seven languages haven't yet been checked by native-speaking volunteers.</li>
            <li>Voice needs a browser that supports it (Chrome, Edge or Safari). In Firefox you tap or type instead.</li>
            <li>
              Photo suggestions can be wrong. Our photo test only scored things a photo shows clearly; harder things, like the shape of the channel, weren't
              scored. That's why they are only suggestions, and why we measure how often people accept them.
            </li>
            <li>The health tips are simple, careful advice based on OneAquaHealth's own data. They are not medical advice.</li>
          </ul>
        </Section>

        <div className="flex flex-wrap gap-3">
          <Link to="/check" className="btn-primary">
            Start a stream check
          </Link>
          <Link to="/hub" className="btn-secondary">
            Research hub
          </Link>
        </div>
      </div>
    </div>
  );
}
