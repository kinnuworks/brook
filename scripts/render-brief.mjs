// Renders the two-page brief for judges (docs/brook-judges-brief.pdf): what Brook is,
// how to try it, and the evidence for each judging criterion. Run after capture-screens.mjs.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const img = async (p) => `data:image/png;base64,${(await readFile(p)).toString("base64")}`;
const hero = await img("docs/img/hero.png");
const laptop = await img("docs/img/desktop-check.png");
const avatar = await readFile("public/favicon.svg", "utf8");

const CRITERIA = [
  {
    name: "Impact & alignment with OneAquaHealth",
    weight: "30%",
    points: [
      "Built on OneAquaHealth's own questions, answer codes, 106 research sites, lab results and FHIR guide.",
      "Sends checks in the exact format OneAquaHealth's app already uses, so they can be used unchanged.",
      "Your stream's story: OneAquaHealth's lab results for that site next to what you saw, with One Health tips for people, pets and the stream.",
      "Works in the seven languages of OneAquaHealth's cities.",
    ],
  },
  {
    name: "Innovation & creativity",
    weight: "20%",
    points: [
      "A conversation instead of a form: talk or tap, and ask “what does that mean?” at any time.",
      "Photos suggest answers; the person confirms every one. A second look when two answers don't fit.",
      "For researchers: which questions confuse volunteers, so the form can be improved. No paper form can show this.",
    ],
  },
  {
    name: "Technical implementation",
    weight: "20%",
    points: [
      "Health data checked with the official HL7 validator against OneAquaHealth's FHIR guide: 0 errors; sent to their HL7 Europe sandbox.",
      "Understands 93% of 238 realistic replies in seven languages with no AI; photo suggestions right 132 times out of 134 on 36 unseen stream photos.",
      "111 automatic tests, a robot walkthrough of a full check, an offline test (kept and sent when signal returns).",
      "AI limited to each question's own answers, with spending limits; about 0.1 cent per check, measured.",
    ],
  },
  {
    name: "Usability & user experience",
    weight: "15%",
    points: [
      "Plain words, small drawings, and a “face downstream” diagram for the left/right questions.",
      "Voice or tap; a check takes about five minutes; works on phones and laptops.",
      "Accessibility scan (WCAG 2.1 AA): 0 problems on every screen.",
    ],
  },
  {
    name: "Feasibility & scalability",
    weight: "15%",
    points: [
      "€0 to host at pilot scale; about €15 of AI for 10,000 checks a year, and €0 with AI switched off.",
      "No app store and no accounts; open source (MIT); OneAquaHealth's websites can embed it.",
      "Data stays in the EU; photos have their location removed on the phone.",
    ],
  },
];

const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>
@page { size: A4; margin: 0 }
* { box-sizing: border-box }
body { margin: 0; font-family: 'DM Sans', sans-serif; color: #10283a; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.page { width: 210mm; height: 297mm; padding: 15mm 15mm 12mm; position: relative; overflow: hidden; page-break-after: always; background: linear-gradient(170deg, #e3f5f8 0%, #f4f8f9 40%, #ffffff 100%) }
.page:last-child { page-break-after: auto }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 20px; color: #0d3245 }
.brand svg { width: 34px; height: 34px }
.eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #17707e }
h1 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 38px; line-height: 1.05; color: #0d3245; margin: 6px 0 5px }
h2 { font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 24px; color: #0d3245; margin: 0 0 8px }
p, li { font-size: 12.5px; line-height: 1.45 }
.lead { font-size: 14.5px; color: #4b6474; margin: 0 }
.hero { height: 292px; overflow: hidden; border-radius: 14px; margin: 10px 0 8px; box-shadow: 0 10px 30px -12px rgba(33,107,140,.35) }
.hero img { display: block; width: 100%; margin-top: -74px }
.try { background: #fff; border: 1px solid #dbe8ed; border-radius: 14px; padding: 2px 14px; margin: 6px 0 10px }
.try div { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #eef3f5 }
.try div:last-child { border-bottom: 0 }
.try b { font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #17707e }
.try a { font-size: 13px; font-weight: 700; color: #216b8c; text-decoration: none }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px }
.stats div { background: #0d3245; color: #fff; border-radius: 14px; padding: 10px 12px }
.stats b { display: block; font-family: 'DM Serif Display', serif; font-weight: 400; font-size: 26px; line-height: 1.1; color: #c6ebf1 }
.stats span { font-size: 10.5px; line-height: 1.35; color: rgba(255,255,255,.85) }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px }
.card { background: #fff; border: 1px solid #dbe8ed; border-radius: 14px; padding: 10px 14px }
.card ul { margin: 4px 0 0; padding-left: 16px }
.card li { margin: 3px 0 }
.quote { font-style: italic; color: #4b6474 }
.crit { background: #fff; border: 1px solid #dbe8ed; border-radius: 14px; padding: 10px 14px; margin-bottom: 8px }
.crit h3 { display: flex; justify-content: space-between; align-items: baseline; margin: 0 0 3px; font-size: 14px; color: #0d3245 }
.crit h3 span { font-size: 12px; color: #fff; background: #216b8c; border-radius: 999px; padding: 2px 9px }
.crit ul { margin: 0; padding-left: 16px }
.crit li { margin: 2px 0; font-size: 12px }
.laptop { margin: 10px 0 0 }
.laptop img { display: block; height: 252px; width: auto; margin: 0 auto; border-radius: 10px; border: 1px solid #dbe8ed; box-shadow: 0 10px 30px -12px rgba(33,107,140,.35) }
.laptop figcaption { margin-top: 6px; font-size: 11.5px; color: #4b6474; text-align: center }
.foot { position: absolute; left: 15mm; right: 15mm; bottom: 8mm; font-size: 9.5px; color: #5d7582; display: flex; justify-content: space-between }
</style></head><body>

<section class="page">
  <div class="brand">${avatar}<span>Brook</span></div>
  <div class="eyebrow" style="margin-top:14px">OneAquaHealth IEEE Global Hackathon 2026 · Track 1: Citizen Science UX (also 3, 4, 7)</div>
  <h1>Talk to your stream.</h1>
  <p class="lead">A friendly guide for OneAquaHealth's citizen stream check. Talk or tap in seven languages, get every hard word explained, and send data scientists can use right away.</p>
  <div class="hero"><img src="${hero}"></div>
  <div class="try">
    <div><b>Try it in one minute</b><a href="https://brook-oah.vercel.app/check?demo=1">brook-oah.vercel.app/check?demo=1</a></div>
    <div><b>Video, 3 minutes</b><a href="https://www.youtube.com/watch?v=fHfNSAoPz7I">youtube.com/watch?v=fHfNSAoPz7I</a></div>
    <div><b>Code, open source</b><a href="https://github.com/kinnuworks/brook">github.com/kinnuworks/brook</a></div>
  </div>
  <div class="cols">
    <div class="card">
      <h2>The problem</h2>
      <p style="margin:0">At the stream, volunteers meet questions like <span class="quote">“Is more than one third of the left margin covered by impervious areas?”</span> Left of what? What does impervious mean? People guess or give up. The Track 1 brief names it: <span class="quote">“complex tools, confusing terminology, and low participation.”</span></p>
    </div>
    <div class="card">
      <h2>What Brook does</h2>
      <ul>
        <li>Asks each official question in plain words, by voice or tap, and explains any word.</li>
        <li>Suggests answers from your photos; nothing is saved until you confirm.</li>
        <li>Takes a gentle second look when two answers don't fit. You always decide.</li>
        <li>Shows your stream's story: OneAquaHealth's lab results next to what you saw.</li>
        <li>Sends OneAquaHealth's exact format, plus HL7 FHIR health data.</li>
      </ul>
    </div>
  </div>
  <div class="stats">
    <div><b>0 errors</b><span>official HL7 validator, against OneAquaHealth's FHIR guide</span></div>
    <div><b>93%</b><span>of 238 realistic replies in 7 languages understood without AI</span></div>
    <div><b>132 / 134</b><span>photo suggestions right, on 36 stream photos never seen before</span></div>
    <div><b>0 problems</b><span>accessibility scan (WCAG 2.1 AA), every screen</span></div>
  </div>
  <div class="foot"><span>Brook · brook-oah.vercel.app</span><span>Not an official OneAquaHealth product · Page 1 of 2</span></div>
</section>

<section class="page">
  <div class="brand">${avatar}<span>Brook</span></div>
  <h1 style="font-size:30px;margin-top:12px">How Brook meets the judging criteria</h1>
  ${CRITERIA.map((c) => `<div class="crit"><h3>${c.name}<span>${c.weight}</span></h3><ul>${c.points.map((p) => `<li>${p}</li>`).join("")}</ul></div>`).join("")}
  <figure class="laptop">
    <img src="${laptop}">
    <figcaption>Phone first, laptop too: the conversation, with progress, photos and every answer beside it.</figcaption>
  </figure>
  <div class="foot"><span>Details and the commands to repeat every test: github.com/kinnuworks/brook</span><span>Page 2 of 2</span></div>
</section>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({ path: "docs/brook-judges-brief.pdf", format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
await browser.close();
console.log("docs/brook-judges-brief.pdf");
