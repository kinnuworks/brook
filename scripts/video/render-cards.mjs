// Renders the still layers of the demo video (1920×1080 PNGs): backgrounds
// with captions, the phone and browser frames, and the title cards. Drawn in
// HTML so the type is crisp and matches the app.
// Run: node scripts/video/render-cards.mjs

import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const OUT = "out/video/cards";
await mkdir(OUT, { recursive: true });
const avatar = await readFile("public/favicon.svg", "utf8");
const photo = async (p) => `data:image/jpeg;base64,${(await readFile(p)).toString("base64")}`;

const FONT = `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800&family=DM+Serif+Display&display=swap" rel="stylesheet">`;
const BASE_CSS = `
*{box-sizing:border-box} body{margin:0;width:1920px;height:1080px;font-family:'DM Sans',sans-serif;color:#10283a;overflow:hidden}
.bg{position:absolute;inset:0;background:radial-gradient(1200px 700px at 78% 20%,#e3f5f8 0%,rgba(227,245,248,0) 70%),linear-gradient(160deg,#f1fafb 0%,#f4f8f9 55%,#ecf6df 100%)}
.wave{position:absolute;left:0;right:0;bottom:0;height:150px;opacity:.55}
.eyebrow{font-size:24px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#17707e}
.title{font-family:'DM Serif Display',serif;font-size:70px;line-height:1.04;color:#0d3245;margin-top:14px}
.sub{font-size:30px;line-height:1.45;color:#4b6474;margin-top:26px}
.brand{position:absolute;left:64px;top:52px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800;color:#0d3245}
.brand svg{width:52px;height:52px}
`;
const WAVE = `<svg class="wave" viewBox="0 0 1920 150" preserveAspectRatio="none"><path d="M0 90 Q120 50 240 90 T480 90 T720 90 T960 90 T1200 90 T1440 90 T1680 90 T1920 90 V150 H0Z" fill="#6bc7d4" opacity=".25"/><path d="M0 110 Q120 80 240 110 T480 110 T720 110 T960 110 T1200 110 T1440 110 T1680 110 T1920 110 V150 H0Z" fill="#216b8c" opacity=".12"/></svg>`;
const brand = `<div class="brand">${avatar}<span>Brook</span></div>`;

// Phone geometry (shared with compose.py): screen 452×978 at (424, 51).
const PHONE = { x: 412, y: 39, w: 476, h: 1002, sx: 424, sy: 51, sw: 452, sh: 978 };
// Browser geometry: window 1560×975 at (180, 70), content 1560×919 at (180, 126).
const BROWSER = { x: 180, y: 70, w: 1560, h: 975, cx: 180, cy: 126, cw: 1560, ch: 919 };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
async function render(name, html, transparent = false) {
  await page.setContent(`<!doctype html><html><head>${FONT}<style>${BASE_CSS}</style></head><body style="background:${transparent ? "transparent" : "#f4f8f9"}">${html}</body></html>`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/${name}.png`, omitBackground: transparent });
}

// Phone scene background: caption on the right.
const phoneScene = (n, eyebrow, title, sub) =>
  render(
    `phone-${n}`,
    `<div class="bg"></div>${WAVE}${brand}
     <div style="position:absolute;left:1000px;top:250px;width:820px">
       <div class="eyebrow">${eyebrow}</div><div class="title">${title}</div><div class="sub">${sub}</div>
     </div>`,
  );

// Transparent phone frame with a rounded screen hole.
await render(
  "phone-frame",
  `<svg width="1920" height="1080" style="position:absolute;inset:0"><defs><mask id="m"><rect width="1920" height="1080" fill="white"/><rect x="${PHONE.sx}" y="${PHONE.sy}" width="${PHONE.sw}" height="${PHONE.sh}" rx="40" fill="black"/></mask>
   <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="#216b8c" flood-opacity=".35"/></filter></defs>
   <g filter="url(#sh)"><rect x="${PHONE.x}" y="${PHONE.y}" width="${PHONE.w}" height="${PHONE.h}" rx="56" fill="#0d3245" mask="url(#m)"/></g></svg>`,
  true,
);
// Transparent browser frame with a window hole.
await render(
  "browser-frame",
  `<svg width="1920" height="1080" style="position:absolute;inset:0"><defs><mask id="m"><rect width="1920" height="1080" fill="white"/><rect x="${BROWSER.cx}" y="${BROWSER.cy}" width="${BROWSER.cw}" height="${BROWSER.ch}" fill="black"/></mask>
   <filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#216b8c" flood-opacity=".28"/></filter></defs>
   <g filter="url(#sh)"><rect x="${BROWSER.x}" y="${BROWSER.y}" width="${BROWSER.w}" height="${BROWSER.h}" rx="18" fill="#ffffff" mask="url(#m)"/></g>
   <circle cx="${BROWSER.x + 30}" cy="${BROWSER.y + 28}" r="8" fill="#f2a5a0"/><circle cx="${BROWSER.x + 56}" cy="${BROWSER.y + 28}" r="8" fill="#f2d39b"/><circle cx="${BROWSER.x + 82}" cy="${BROWSER.y + 28}" r="8" fill="#b7dd9c"/>
   <rect x="${BROWSER.x + 520}" y="${BROWSER.y + 13}" width="520" height="30" rx="15" fill="#f1fafb" stroke="#dbe8ed"/>
   <text x="${BROWSER.x + 780}" y="${BROWSER.y + 34}" text-anchor="middle" font-family="DM Sans" font-size="16" fill="#4b6474">brook-oah.vercel.app</text></svg>`,
  true,
);

await phoneScene("s04", "1 · Start", "Safety first, then the nearest stream", "Brook finds the closest of OneAquaHealth's 106 research streams, or any stream at all.");
await phoneScene("s05", "2 · Photos", "Brook looks at your photos", "…and suggests answers to the questions a photo can answer.");
await phoneScene("s06", "3 · Talk or tap", "Ask what any word means", "Brook asks each question in everyday words, in seven languages.");
await phoneScene("s07", "4 · You decide", "Nothing is saved until you say it's right", "Brook remembers how every answer was given: tapped, spoken, or a suggestion you accepted.");
await phoneScene("s08", "5 · Left and right, solved", "Face the way the water flows", "The hardest question in the form becomes simple.");
await phoneScene("s09", "6 · A second look", "Brook asks. You decide.", "If two answers don't fit together, Brook asks you to look again. It never changes your answer.");
await phoneScene("s10", "7 · Your stream's story", "What scientists found, next to what you saw", "OneAquaHealth's own lab results for this exact stream, with simple tips to keep people and pets safe.");
await phoneScene("s11", "8 · Useful to scientists", "Sent in the form OneAquaHealth already uses", "…and as health data (HL7 FHIR) on OneAquaHealth's own server: ✓ accepted.");

// Desktop scene backgrounds: a caption bar under the window.
const desktopScene = (n, text) =>
  render(
    `desk-${n}`,
    `<div class="bg"></div>${WAVE}
     <div style="position:absolute;left:0;right:0;top:8px;text-align:center;font-size:30px;font-weight:700;color:#0d3245">${text}</div>`,
  );
await desktopScene("s12", "For scientists: which questions do people find hard?");
await desktopScene("s13", "Seven languages · works without AI or signal · data stays in Europe · ≈ 0.1 ¢ per check");

// S1: caption over the river photos (transparent overlay).
await render(
  "s01-caption",
  `<div style="position:absolute;left:0;right:0;bottom:0;height:420px;background:linear-gradient(to top,rgba(13,50,69,.85),rgba(13,50,69,0))"></div>
   <div style="position:absolute;left:96px;bottom:96px;color:white">
     <div style="font-size:26px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#c6ebf1">The Alna river · Oslo · OneAquaHealth site O17</div>
     <div style="font-family:'DM Serif Display',serif;font-size:76px;line-height:1.05;margin-top:12px">106 city streams. Five cities.<br>How healthy are they?</div>
   </div>
   <div style="position:absolute;right:28px;bottom:22px;color:rgba(255,255,255,.7);font-size:16px">Photos: PaulVIF, CC BY-SA 3.0 · Wikimedia Commons</div>`,
  true,
);

// S2: the problem, in three beats.
const q = (hl) => `<div class="bg"></div>${WAVE}${brand}
  <div style="position:absolute;left:180px;right:180px;top:230px">
    <div class="eyebrow">An official question from the stream check</div>
    <div style="margin-top:22px;background:white;border-radius:28px;padding:44px 52px;box-shadow:0 20px 50px -20px rgba(33,107,140,.35);font-size:50px;line-height:1.3;color:#0d3245">
      “Is more than one third of the ${hl ? '<span style="background:#fdf3dc;border-bottom:5px solid #f2b33d">left margin</span>' : "left margin"} covered by ${hl ? '<span style="background:#fdf3dc;border-bottom:5px solid #f2b33d">impervious areas</span>' : "impervious areas"}?”
    </div>
    ${hl === 2 ? '<div style="margin-top:46px;font-size:44px;color:#c9603d;font-weight:700">Left of what? What does “impervious” mean?</div><div style="margin-top:14px;font-size:40px;color:#4b6474">People guess, or give up.</div>' : ""}
  </div>`;
await render("s02-a", q(0));
await render("s02-b", q(2));

// S3: title card.
await render(
  "s03-title",
  `<div class="bg"></div>${WAVE}
   <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">
     <div style="width:170px;height:170px">${avatar.replace("<svg ", '<svg width="170" height="170" ')}</div>
     <div style="font-family:'DM Serif Display',serif;font-size:120px;color:#0d3245;line-height:1">Brook</div>
     <div style="font-size:40px;color:#4b6474">A friendly guide for OneAquaHealth's stream check</div>
   </div>`,
);

// S14: closing card.
await render(
  "s14-close",
  `<div class="bg"></div>${WAVE}
   <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center">
     <div style="width:120px;height:120px">${avatar.replace("<svg ", '<svg width="120" height="120" ')}</div>
     <div style="font-family:'DM Serif Display',serif;font-size:88px;color:#0d3245;line-height:1.05">Brook gives OneAquaHealth's<br>stream check a voice.</div>
     <div style="font-size:40px;font-weight:700;color:#216b8c;margin-top:16px">brook-oah.vercel.app</div>
     <div style="font-size:30px;color:#4b6474">github.com/kinnuworks/brook</div>
     <div style="font-size:20px;color:#5d7582;margin-top:30px">OneAquaHealth IEEE Global Hackathon 2026 · Track 1: Citizen Science UX · Not an official OneAquaHealth product<br>Voices: AI (ElevenLabs) · Data: OneAquaHealth / ENORA public API · Photos: Wikimedia Commons (CC BY-SA)</div>
   </div>`,
);

// Languages scene: three smaller phones and a caption.
const LANG = { w: 362, h: 783, y: 200, xs: [347, 779, 1211] };
await render(
  "desk-langs",
  `<div class="bg"></div>${WAVE}${brand}
   <div style="position:absolute;left:0;right:0;top:70px;text-align:center">
     <div class="eyebrow">Português · Italiano · Ελληνικά · and four more</div>
     <div style="font-family:'DM Serif Display',serif;font-size:56px;color:#0d3245;margin-top:8px">The languages of OneAquaHealth's cities</div>
   </div>`,
);
await render(
  "langs-frame",
  `<svg width="1920" height="1080" style="position:absolute;inset:0"><defs><mask id="m"><rect width="1920" height="1080" fill="white"/>${LANG.xs
    .map((x) => `<rect x="${x}" y="${LANG.y}" width="${LANG.w}" height="${LANG.h}" rx="32" fill="black"/>`)
    .join("")}</mask>
   <filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="20" stdDeviation="22" flood-color="#216b8c" flood-opacity=".3"/></filter></defs>
   <g filter="url(#sh)">${LANG.xs.map((x) => `<rect x="${x - 10}" y="${LANG.y - 10}" width="${LANG.w + 20}" height="${LANG.h + 20}" rx="44" fill="#0d3245" mask="url(#m)"/>`).join("")}</g></svg>`,
  true,
);

await browser.close();
console.log("cards rendered");
