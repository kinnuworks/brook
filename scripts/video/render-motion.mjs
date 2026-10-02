// Renders the two animated cards of the demo video, frame by frame so the
// motion is perfectly smooth: the title ("So we built Brook…") and the close.
// Each frame sets every CSS animation to the exact time and takes a screenshot.
// Run: node scripts/video/render-motion.mjs

import { mkdir, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const OUT = "out/video/clips";
const FPS = 30;
await mkdir(OUT, { recursive: true });

const FONT = `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..800&family=DM+Serif+Display&display=swap" rel="stylesheet">`;

// Brook's face, with its own moving waves (the same drawing as the app's avatar).
const avatar = (size) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" style="display:block">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd3de"/><stop offset=".55" stop-color="#3fa9b9"/><stop offset="1" stop-color="#216b8c"/></linearGradient>
  <clipPath id="c"><circle cx="32" cy="32" r="30"/></clipPath></defs>
  <circle cx="32" cy="32" r="30" fill="url(#g)"/>
  <g clip-path="url(#c)" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="3.4"><g class="waves">
    <path d="M-32 25 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity=".95"/>
    <path d="M-36 34 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity=".8"/>
    <path d="M-32 43 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" opacity=".6"/>
  </g></g>
  <path class="leaf" d="M47 6 c7 0 11 4 11 10 c-6 1 -11 -2 -11 -10z" fill="#8cc740"/>
</svg>`;

const CSS = `
*{box-sizing:border-box} body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:'DM Sans',sans-serif;color:#10283a}
.bg{position:absolute;inset:0;background:radial-gradient(1100px 650px at 50% 42%,#e3f5f8 0%,rgba(227,245,248,0) 72%),linear-gradient(160deg,#f1fafb 0%,#f4f8f9 55%,#ecf6df 100%)}
.sea{position:absolute;left:0;bottom:0;width:3840px;height:170px;animation:drift 12s linear infinite}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-1920px)}}
.waves{animation:waves 2.4s linear infinite}
@keyframes waves{from{transform:translateX(0)}to{transform:translateX(-32px)}}
.ring{position:absolute;border-radius:50%;border:3px solid #6bc7d4;opacity:0}
@keyframes ripple{0%{transform:scale(.7);opacity:.55}100%{transform:scale(2.3);opacity:0}}
@keyframes pop{0%{transform:scale(.55);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes rise{0%{transform:translateY(46px);opacity:0;filter:blur(10px)}100%{transform:translateY(0);opacity:1;filter:blur(0)}}
@keyframes fadeup{0%{transform:translateY(18px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes draw{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:0}}
@keyframes leaf{0%{transform:rotate(-35deg) scale(.4);opacity:0}100%{transform:rotate(0) scale(1);opacity:1}}
.leaf{transform-origin:52px 11px;transform-box:view-box}
`;

const SEA = `<svg class="sea" viewBox="0 0 3840 170" preserveAspectRatio="none">
  <path d="M0 100 Q120 60 240 100 T480 100 T720 100 T960 100 T1200 100 T1440 100 T1680 100 T1920 100 T2160 100 T2400 100 T2640 100 T2880 100 T3120 100 T3360 100 T3600 100 T3840 100 V170 H0Z" fill="#6bc7d4" opacity=".22"/>
  <path d="M0 122 Q160 92 320 122 T640 122 T960 122 T1280 122 T1600 122 T1920 122 T2240 122 T2560 122 T2880 122 T3200 122 T3520 122 T3840 122 V170 H0Z" fill="#216b8c" opacity=".1"/>
</svg>`;

const ease = "cubic-bezier(.2,.8,.2,1)";
const anim = (name, start, dur, extra = "") => `animation:${name} ${dur}s ${ease} ${start}s both${extra}`;

// ── Title: "So we built Brook: a friendly guide for OneAquaHealth's stream check." ──
// The narrator starts 0.3 s in and says "Brook" about a second later.
const word = "Brook";
const title = `<div class="bg"></div>${SEA}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <div style="display:flex;align-items:center;gap:40px">
    <div style="position:relative;width:170px;height:170px">
      <div class="ring" style="inset:0;${anim("ripple", 0.15, 1.8)}"></div>
      <div class="ring" style="inset:0;${anim("ripple", 0.55, 1.8)}"></div>
      <div style="${anim("pop", 0.1, 0.8)}">${avatar(170).replace('class="leaf"', `class="leaf" style="${anim("leaf", 0.55, 0.7)}"`)}</div>
    </div>
    <div style="font-family:'DM Serif Display',serif;font-size:172px;line-height:1;color:#0d3245;display:flex;letter-spacing:-1px">
      ${[...word].map((ch, i) => `<span style="display:inline-block;${anim("rise", 0.85 + i * 0.075, 0.75)}">${ch}</span>`).join("")}
    </div>
  </div>
  <svg width="560" height="40" viewBox="0 0 560 40" style="margin-top:6px;margin-left:200px">
    <path d="M6 22 Q76 2 146 22 T286 22 T426 22 T554 20" fill="none" stroke="#6bc7d4" stroke-width="7" stroke-linecap="round" style="--len:620;stroke-dasharray:620;${anim("draw", 1.35, 1.0)}"/>
  </svg>
  <div style="margin-top:30px;font-size:44px;color:#4b6474;${anim("fadeup", 1.75, 0.8)}">A friendly guide for OneAquaHealth's stream check</div>
</div>`;

// ── Close: "Brook doesn't replace OneAquaHealth's app. It gives it a voice." ──
const close = `<div class="bg"></div>${SEA}
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
  <div style="position:relative;width:124px;height:124px">
    <div class="ring" style="inset:0;${anim("ripple", 0.1, 1.8)}"></div>
    <div style="${anim("pop", 0.05, 0.7)}">${avatar(124)}</div>
  </div>
  <div style="font-family:'DM Serif Display',serif;font-size:90px;line-height:1.06;color:#0d3245;margin-top:30px">
    <div style="${anim("rise", 0.35, 0.8)}">Brook gives OneAquaHealth's</div>
    <div style="${anim("rise", 0.55, 0.8)}">stream check a voice.</div>
  </div>
  <div style="margin-top:34px;font-size:44px;font-weight:700;color:#216b8c;${anim("fadeup", 1.5, 0.7)}">brook-oah.vercel.app</div>
  <div style="margin-top:10px;font-size:31px;color:#4b6474;${anim("fadeup", 1.7, 0.7)}">github.com/kinnuworks/brook</div>
  <div style="margin-top:40px;font-size:20px;line-height:1.6;color:#5d7582;${anim("fadeup", 2.1, 0.8)}">OneAquaHealth IEEE Global Hackathon 2026 · Track 1: Citizen Science UX · Not an official OneAquaHealth product<br>Voices: AI (ElevenLabs) · Data: OneAquaHealth / ENORA public API · Photos: Wikimedia Commons (CC BY-SA)</div>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

async function film(name, html, seconds) {
  await page.setContent(`<!doctype html><html><head>${FONT}<style>${CSS}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
  const dir = `out/frames/${name}`;
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const frames = Math.round(seconds * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((ms) => document.getAnimations().forEach((a) => (a.currentTime = ms)), (f * 1000) / FPS);
    await page.screenshot({ path: `${dir}/${String(f).padStart(5, "0")}.jpg`, type: "jpeg", quality: 95 });
  }
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${dir}/%05d.jpg`, "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", `${OUT}/${name}.mp4`]);
  await rm(dir, { recursive: true, force: true });
  console.log(`${OUT}/${name}.mp4`, `${seconds}s`);
}

await film("title", title, 6.0);
await film("close", close, 7.0);
await browser.close();
