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

// Phone geometry (shared with compose.py): screen 452×978 at (424, 51); the app
// (recorded at 390×797) fills the screen under the status bar, at (424, 105) 452×924.
const PHONE = { sx: 424, sy: 51, sw: 452, sh: 978 };

/** A realistic phone over a transparent canvas, with a hole where the app shows. */
function phoneSvg(id, sx, sy, sw, sh) {
  const k = sw / 390; // CSS px of a 390-wide phone
  const bar = 47 * k;
  const r = 54 * k;
  const bezel = 11.5 * k;
  const edge = 3 * k;
  const ox = sx - bezel - edge;
  const oy = sy - bezel - edge;
  const ow = sw + 2 * (bezel + edge);
  const oh = sh + 2 * (bezel + edge);
  const btn = (x, y, h) => `<rect x="${x}" y="${y}" width="${4 * k}" height="${h}" rx="${2 * k}" fill="url(#btn-${id})"/>`;
  return `<defs>
    <linearGradient id="ti-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e8ec"/><stop offset=".5" stop-color="#8f9ba4"/><stop offset="1" stop-color="#d7dde2"/></linearGradient>
    <linearGradient id="btn-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4c5861"/><stop offset=".5" stop-color="#9aa6ae"/><stop offset="1" stop-color="#5c6870"/></linearGradient>
    <mask id="hole-${id}"><rect x="0" y="0" width="1920" height="1080" fill="white"/><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${r}" fill="black"/></mask>
    <clipPath id="scr-${id}"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${r}"/></clipPath>
    <filter id="sh-${id}" x="-30%" y="-20%" width="160%" height="140%"><feDropShadow dx="0" dy="${30 * k}" stdDeviation="${30 * k}" flood-color="#0d3245" flood-opacity=".32"/></filter>
  </defs>
  ${btn(ox - 3 * k, oy + oh * 0.17, oh * 0.05)}${btn(ox - 3 * k, oy + oh * 0.25, oh * 0.09)}${btn(ox - 3 * k, oy + oh * 0.36, oh * 0.09)}${btn(ox + ow - 1 * k, oy + oh * 0.29, oh * 0.13)}
  <g filter="url(#sh-${id})" mask="url(#hole-${id})">
    <rect x="${ox}" y="${oy}" width="${ow}" height="${oh}" rx="${r + bezel + edge}" fill="url(#ti-${id})"/>
    <rect x="${ox + edge}" y="${oy + edge}" width="${ow - 2 * edge}" height="${oh - 2 * edge}" rx="${r + bezel}" fill="#0a0d10"/>
  </g>
  <g clip-path="url(#scr-${id})">
    <rect x="${sx}" y="${sy}" width="${sw}" height="${bar}" fill="#fefefe"/>
    <text x="${sx + 34 * k}" y="${sy + 31 * k}" font-family="DM Sans" font-weight="600" font-size="${16 * k}" fill="#10283a">9:41</text>
    <g transform="translate(${sx + sw - 34 * k - 71 * k} ${sy + 19.5 * k}) scale(${k})" fill="#10283a">
      <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/>
      <g transform="translate(24 0)"><path d="M8 11.5 L5.6 9 a3.4 3.4 0 0 1 4.8 0 Z"/><path d="M2.8 6.3 a7.4 7.4 0 0 1 10.4 0" stroke="#10283a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M0.6 3.8 a10.6 10.6 0 0 1 14.8 0" stroke="#10283a" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>
      <g transform="translate(44 -0.5)"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#10283a" stroke-opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2"/><path d="M25 4.5 v4 a2 2 0 0 0 0 -4z" fill-opacity=".45"/></g>
    </g>
    <rect x="${sx + sw / 2 - 60 * k}" y="${sy + 11 * k}" width="${120 * k}" height="${34 * k}" rx="${17 * k}" fill="#000"/>
    <rect x="${sx + sw / 2 - 67 * k}" y="${sy + sh - 9 * k}" width="${134 * k}" height="${5 * k}" rx="${2.5 * k}" fill="#10283a" fill-opacity=".85"/>
  </g>`;
}
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

// Transparent phone frame: the app shows through the screen, under the status bar.
await render("phone-frame", `<svg width="1920" height="1080" style="position:absolute;inset:0">${phoneSvg("p", PHONE.sx, PHONE.sy, PHONE.sw, PHONE.sh)}</svg>`, true);
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
await desktopScene("s11b", "On a laptop: your progress, your photos and every answer beside the conversation");
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
// While Brook speaks Portuguese: the other two phones step back, and a label names the voice.
await render(
  "langs-focus",
  `<svg width="1920" height="1080" style="position:absolute;inset:0">${LANG.xs
    .slice(1)
    .map((x) => `<rect x="${x - 18}" y="${LANG.y - 18}" width="${LANG.w + 36}" height="${LANG.h + 36}" rx="72" fill="#f4f8f9" fill-opacity=".62"/>`)
    .join("")}</svg>
   <div style="position:absolute;left:${LANG.xs[0] + LANG.w / 2}px;top:${LANG.y + LANG.h + 26}px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;background:#216b8c;color:white;border-radius:999px;padding:9px 22px 9px 18px;font-size:23px;font-weight:700;box-shadow:0 10px 24px -10px rgba(33,107,140,.7);white-space:nowrap">
     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/></svg>
     Brook, in Portuguese
   </div>`,
  true,
);
await render(
  "langs-frame",
  `<svg width="1920" height="1080" style="position:absolute;inset:0">${LANG.xs.map((x, i) => phoneSvg(`l${i}`, x, LANG.y, LANG.w, LANG.h)).join("")}</svg>`,
  true,
);

await browser.close();
console.log("cards rendered");
