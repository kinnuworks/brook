import { BadgeCheck, Brain, Database, Eye, Globe2, HeartHandshake, Lock, Mic, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { SITES_FETCHED_AT } from "@/core/sites";

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-[32px] leading-tight text-deep-900">{title}</h2>
      <div className="mt-4 space-y-3 text-[16.5px] leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function Point({ icon: Icon, title, children }: { icon: typeof Mic; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <Icon className="mt-0.5 size-5 shrink-0 text-deep" aria-hidden />
      <div>
        <div className="font-bold text-deep-900">{title}</div>
        <div className="mt-0.5 text-[15px] text-ink-soft">{children}</div>
      </div>
    </div>
  );
}

/** How a check flows through Brook. Every box is real code in this repository. */
function Architecture() {
  const box = "fill-white stroke-[#dbe8ed]";
  return (
    <figure className="card overflow-x-auto p-4">
      <svg viewBox="0 0 980 430" className="min-w-[760px]" role="img" aria-labelledby="arch-title">
        <title id="arch-title">Brook architecture: from a citizen at the stream to OneAquaHealth's data and FHIR systems</title>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#216b8c" />
          </marker>
        </defs>
        <style>{`text{font-family:DM Sans,system-ui,sans-serif;fill:#10283a} .t{font-size:15px;font-weight:700} .s{font-size:12.5px;fill:#4b6474} .l{stroke:#216b8c;stroke-width:1.6;fill:none;marker-end:url(#arr)}`}</style>

        {/* phone */}
        <rect x="20" y="40" width="200" height="340" rx="26" className={box} strokeWidth="1.5" />
        <text x="40" y="74" className="t">On the phone</text>
        <text x="40" y="96" className="s">Voice or tap · 7 languages</text>
        <rect x="40" y="112" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="135" className="t" style={{ fontSize: 13.5 }}>Dialogue engine</text>
        <text x="52" y="154" className="s">OAH protocol, scripted</text>
        <rect x="40" y="178" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="201" className="t" style={{ fontSize: 13.5 }}>Local matcher</text>
        <text x="52" y="220" className="s">word lists, no network</text>
        <rect x="40" y="244" width="160" height="56" rx="12" fill="#e3f5f8" />
        <text x="52" y="267" className="t" style={{ fontSize: 13.5 }}>Second look</text>
        <text x="52" y="286" className="s">7 rules + weather</text>
        <rect x="40" y="310" width="160" height="52" rx="12" fill="#ecf6df" />
        <text x="52" y="332" className="t" style={{ fontSize: 13.5 }}>Offline queue</text>
        <text x="52" y="350" className="s">IndexedDB</text>

        {/* AI */}
        <rect x="290" y="40" width="210" height="150" rx="20" className={box} strokeWidth="1.5" />
        <text x="310" y="72" className="t">Optional AI helper</text>
        <text x="310" y="96" className="s">Understands free replies</text>
        <text x="310" y="116" className="s">Suggests answers from photos</text>
        <text x="310" y="140" className="s">Strict schema · OAH codes only</text>
        <text x="310" y="160" className="s">Spending caps · fails closed</text>
        <text x="310" y="180" className="s" style={{ fill: "#4f7f1c", fontWeight: 700 }}>Citizen confirms every answer</text>

        {/* outputs */}
        <rect x="290" y="230" width="210" height="150" rx="20" className={box} strokeWidth="1.5" />
        <text x="310" y="262" className="t">What a check becomes</text>
        <text x="310" y="286" className="s">OAH submission body (exact DTO)</text>
        <text x="310" y="306" className="s">HL7 FHIR R4 bundle, OAH IG</text>
        <text x="310" y="326" className="s">Answer sources + Provenance</text>
        <text x="310" y="346" className="s">Interaction record (clarity)</text>
        <text x="310" y="366" className="s">Photos only with consent</text>

        {/* destinations */}
        <rect x="570" y="40" width="190" height="96" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="72" className="t">Brook storage (EU)</text>
        <text x="590" y="96" className="s">Supabase Frankfurt</text>
        <text x="590" y="116" className="s">RLS + server secret</text>
        <rect x="570" y="158" width="190" height="96" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="190" className="t">OAH FHIR sandbox</text>
        <text x="590" y="214" className="s">HL7 Europe, HAPI R4</text>
        <text x="590" y="234" className="s">transaction POST</text>
        <rect x="570" y="276" width="190" height="104" rx="20" className={box} strokeWidth="1.5" />
        <text x="590" y="308" className="t">OAH public data</text>
        <text x="590" y="332" className="s">106 sites, lab classes,</text>
        <text x="590" y="352" className="s">health-risk scores (ENORA)</text>
        <text x="590" y="372" className="s">Weather: Open-Meteo</text>

        {/* people */}
        <rect x="820" y="60" width="140" height="120" rx="20" fill="#0d3245" />
        <text x="838" y="94" className="t" style={{ fill: "#fff" }}>Research hub</text>
        <text x="838" y="118" className="s" style={{ fill: "#c6ebf1" }}>Map, confusing</text>
        <text x="838" y="136" className="s" style={{ fill: "#c6ebf1" }}>questions, AI</text>
        <text x="838" y="154" className="s" style={{ fill: "#c6ebf1" }}>agreement</text>
        <rect x="820" y="230" width="140" height="120" rx="20" fill="#216b8c" />
        <text x="838" y="264" className="t" style={{ fill: "#fff" }}>Your stream's</text>
        <text x="838" y="284" className="t" style={{ fill: "#fff" }}>story</text>
        <text x="838" y="308" className="s" style={{ fill: "#e3f5f8" }}>You vs the lab,</text>
        <text x="838" y="326" className="s" style={{ fill: "#e3f5f8" }}>One Health tips</text>

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

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-14 px-4 pb-20 pt-10">
      <header>
        <p className="eyebrow">How Brook works</p>
        <h1 className="mt-2 font-serif text-[46px] leading-[1.05] text-deep-900">A voice for OneAquaHealth's citizen stream check</h1>
        <p className="mt-4 text-[18px] leading-relaxed text-ink-soft">
          Brook does not replace OneAquaHealth's Citizen Science App. It gives it a voice. The questions, the answer codes and the data Brook hands over are
          OneAquaHealth's own; what Brook adds is a patient guide who explains, listens, double-checks gently, and turns every visit into data that travels.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2 text-[14px] font-semibold">
          {[
            ["problem", "The problem"],
            ["how", "How it works"],
            ["ai", "Responsible AI"],
            ["oah", "Built on OneAquaHealth"],
            ["privacy", "Privacy & security"],
            ["evidence", "Evidence"],
            ["limits", "Honest limits"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full bg-white px-3.5 py-2 text-deep ring-1 ring-line hover:ring-aqua">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <Section id="problem" eyebrow="Track 1 · Citizen Science UX" title="The problem, in OneAquaHealth's own words">
        <p>
          The hackathon brief names it plainly: <em>“complex tools, confusing terminology, and low participation reduce usability and impact.”</em> A form asks a
          volunteer at a stream to judge “transversal artificial barriers”, “impervious areas covering more than one third of the left margin” and the
          “dominant vegetation” of the riparian zone. Left and right are defined facing downstream, which almost nobody knows. Unsure people guess or give up,
          and researchers receive data they cannot fully trust.
        </p>
        <p>
          OneAquaHealth also measured its own data: on the FAIR principles its digital objects scored about 1.6 out of 3, with interoperability the weakest. And
          the project ends in December 2026, so whatever helps citizens keep watching these streams has to be cheap to run and easy to adopt.
        </p>
      </Section>

      <Section id="how" eyebrow="Tracks 1, 3, 4 and 7" title="How a check flows">
        <Architecture />
        <div className="grid gap-3 sm:grid-cols-2">
          <Point icon={Mic} title="A conversation, not a form">
            Brook asks each of OneAquaHealth's questions in plain words, by voice or text, in English, Portuguese, French, Italian, Dutch, Norwegian or Greek. “What
            does that mean?” always works. The official wording is one tap away.
          </Point>
          <Point icon={Eye} title="Photos suggest, people decide">
            From the upstream, downstream and surroundings photos, Brook suggests answers to the questions a photo can answer, with what it saw. Nothing is
            recorded until the citizen confirms or corrects it.
          </Point>
          <Point icon={Sparkles} title="A second look">
            Seven published rules notice contradictions, like a “good” rating next to a sewage discharge, or clear water after 20 mm of rain. They never change an
            answer; the citizen decides, and the decision is kept.
          </Point>
          <Point icon={HeartHandshake} title="Your stream's story">
            After sending, people see what OneAquaHealth scientists measured at that exact site next to what they saw, with precautionary One Health tips for
            people, pets and the stream. That is the reason to come back.
          </Point>
        </div>
      </Section>

      <Section id="ai" eyebrow="Track 3 · AI-Supported Assessment" title="Responsible AI, built in rather than promised">
        <div className="grid gap-3 sm:grid-cols-2">
          <Point icon={BadgeCheck} title="AI never decides">
            Every answer is given or confirmed by a person. The overall health rating is always the citizen's own; the AI is never asked for it.
          </Point>
          <Point icon={ShieldCheck} title="AI can only choose valid answers">
            The model must reply in a strict JSON schema whose only allowed values are the current question's OneAquaHealth codes, and the server checks again.
            Replies are treated as data, never as instructions.
          </Point>
          <Point icon={Brain} title="Works without AI">
            The dialogue is scripted and most replies are understood on the phone with word lists in seven languages. If the AI is unavailable or its budget is
            spent, the check carries on by voice and tap.
          </Point>
          <Point icon={Database} title="Every answer says where it came from">
            Tapped, said, typed, understood with AI, or a photo suggestion confirmed or corrected. This travels with the data as a FHIR extension, a Provenance
            record and, where AI proposed a value, the HL7 security label AIAST.
          </Point>
        </div>
        <p className="text-[15px] text-ink-soft">
          The research hub shows how often people accept each kind of suggestion. Where agreement is low, the AI should stay quiet: that is a design decision the
          data can now inform.
        </p>
      </Section>

      <Section id="oah" eyebrow="Feasibility" title="Built on OneAquaHealth's own tools">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <b>The protocol:</b> every field and answer code comes from the OneAquaHealth Citizen Science App's public API and submission schema
            (CitizenSubmissionPutDTO). A Brook check can be submitted to OneAquaHealth unchanged.
          </li>
          <li>
            <b>The sites and the science:</b> 106 research sites in Coimbra, Toulouse, Ghent, Benevento and Oslo, with their latest macroinvertebrate, diatom and
            fish quality classes and Resilience Map health-risk scores, from OneAquaHealth's public API (snapshot {SITES_FETCHED_AT.slice(0, 10)}).
          </li>
          <li>
            <b>The standard:</b> checks are exported as HL7 FHIR R4 shaped by the OneAquaHealth Implementation Guide (HL7 Europe): its Location profile and its own
            indicator codes. A citizen check is preliminary; once a researcher verifies it, it claims the guide's indicator profile. Details in{" "}
            <a className="font-semibold text-deep underline" href="https://github.com/kinnuworks/brook/blob/main/docs/FHIR.md">docs/FHIR.md</a>.
          </li>
          <li>
            <b>The sandbox:</b> bundles are posted as FHIR transactions to OneAquaHealth's HL7 Europe sandbox.
          </li>
          <li>
            <b>Cost:</b> a web app with no install, on free tiers; the optional AI costs about one cent per check, capped.
          </li>
        </ul>
      </Section>

      <Section id="privacy" eyebrow="Privacy & security" title="Careful with people's data">
        <div className="grid gap-3 sm:grid-cols-2">
          <Point icon={Lock} title="Photos">
            Shrunk and re-encoded on the phone, which removes every EXIF field including GPS. Shared with researchers only if the person ticks the box.
          </Point>
          <Point icon={Globe2} title="Where data lives">
            Brook's database is in the EU (Frankfurt). No accounts; each phone has a random id that is hashed before it leaves. IP addresses are never stored.
          </Point>
          <Point icon={ShieldCheck} title="Locked down">
            Every table has row-level security with no public policies; the only way in is a set of database functions that check a server-only secret. The
            browser never holds a secret.
          </Point>
          <Point icon={TriangleAlert} title="Abuse and cost">
            Same-origin checks, size limits, server-side validation of every field, per-caller and daily AI spending caps that fail closed.
          </Point>
        </div>
      </Section>

      <Section id="evidence" eyebrow="Evidence" title="What has been checked">
        <ul className="list-disc space-y-2 pl-5">
          <li>Unit tests for the protocol, the answer matcher, the second-look rules, the One Health tips and the FHIR builder.</li>
          <li>FHIR bundles validated with the official HL7 validator against the OneAquaHealth Implementation Guide (results in docs/FHIR.md).</li>
          <li>A matcher evaluation: how many realistic spoken replies in seven languages are understood with no AI at all.</li>
          <li>An end-to-end browser test of a full check, and an automated accessibility scan.</li>
        </ul>
        <p className="text-[15px] text-ink-soft">
          All of it is in the repository, with the commands to reproduce it:{" "}
          <a className="font-semibold text-deep underline" href="https://github.com/kinnuworks/brook">github.com/kinnuworks/brook</a>.
        </p>
      </Section>

      <Section id="limits" eyebrow="Honesty" title="What Brook does not claim">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            The research hub starts with <b>simulated checks</b>, clearly marked, so it has something to show. Their question-difficulty figures are stated
            assumptions, not findings. Real checks are counted separately.
          </li>
          <li>Translations were prepared for this prototype and have not yet been reviewed by native-speaking volunteers.</li>
          <li>
            Voice depends on the browser's speech engine. Firefox has none, so Brook works by tap and typing there. In Chrome, recognition is done by Google's
            servers.
          </li>
          <li>Photo suggestions can be wrong. That is why they are only suggestions and why agreement is measured.</li>
          <li>One Health tips are precautionary and based on simple published rules and OneAquaHealth's own risk scores. They are not medical advice.</li>
          <li>The OneAquaHealth FHIR sandbox is shared and wiped regularly; Brook keeps its own copy of each submission result.</li>
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
  );
}
