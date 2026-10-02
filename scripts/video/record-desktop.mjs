// Films the desktop scenes of the demo video: the research hub and the About page.
// Run with the dev server up: node scripts/video/record-desktop.mjs [baseUrl]
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startScreencast } from "./screencast.mjs";

const BASE = process.argv[2] ?? "http://localhost:5173";
const OUT = "out/video/clips";
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5, locale: "en-GB" });
await context.addInitScript(() =>
  localStorage.setItem("brook-settings", JSON.stringify({ state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: false, clientId: "demo-film" }, version: 0 })),
);
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const glideTo = (text, offset = 90) =>
  page.evaluate(
    ([t, o]) => {
      const el = [...document.querySelectorAll("h1, h2, h3, p")].find((n) => n.textContent?.trim().startsWith(t));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: "smooth" });
    },
    [text, offset],
  );

// ── D1: the research hub ──────────────────────────────────────────────────
await page.goto(`${BASE}/hub`, { waitUntil: "domcontentloaded" });
await page.locator(".maplibregl-canvas").waitFor({ timeout: 20_000 });
await pause(3500);
let rec = await startScreencast(page, { width: 1920, height: 1200 });
await pause(2500);
await glideTo("Checks across OneAquaHealth", 70);
await pause(2200);
await page.getByRole("button", { name: "Oslo", exact: true }).click();
await pause(3800);
await glideTo("Which questions do people find hard?", 80);
await pause(5200);
await glideTo("Do people agree with the photo suggestions?", 80);
await pause(3600);
console.log("d1-hub", await rec.stop(`${OUT}/d1-hub.mp4`));

// ── D2: how Brook uses AI, and what it costs ──────────────────────────────
await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded" });
await pause(2000);
await glideTo("How we use AI safely", 80);
await pause(1200);
rec = await startScreencast(page, { width: 1920, height: 1200 });
await pause(3800);
await glideTo("What it costs, and how OneAquaHealth could use it", 80);
await pause(3800);
await glideTo("How we tested it", 80);
await pause(3600);
console.log("d2-about", await rec.stop(`${OUT}/d2-about.mp4`));

await context.close();
await browser.close();
