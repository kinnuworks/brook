// Films the laptop scenes of the demo video: the check with its side panel, the
// research hub and the About page. As in record-phone.mjs, every action happens
// at a set time in its clip, matched to the narration over it.
// Run with the dev server up (and OPENAI_API_KEY set): node scripts/video/record-desktop.mjs [baseUrl]
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
const state = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {});
const waitFor = async (pred, timeout = 30_000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (pred(await state())) return;
    await pause(120);
  }
  throw new Error("timed out waiting for state");
};
const tap = (name) => page.getByRole("button", { name, exact: false }).first().click();
const chip = (text) => page.locator("button[data-option]", { hasText: text }).first().click();
const glideTo = (text, offset = 90) =>
  page.evaluate(
    ([t, o]) => {
      const el = [...document.querySelectorAll("h1, h2, h3, p")].find((n) => n.textContent?.trim().startsWith(t));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: "smooth" });
    },
    [text, offset],
  );

let rec;
let t0 = 0;
const start = async () => {
  await page.mouse.move(0, 0);
  rec = await startScreencast(page, { width: 1920, height: 1200 });
  t0 = Date.now();
};
const at = async (s) => {
  const wait = t0 + s * 1000 - Date.now();
  if (wait > 0) await pause(wait);
};
const stop = async (name, until) => {
  await at(until);
  console.log(name, await rec.stop(`${OUT}/${name}.mp4`, { minSeconds: until }));
};

// ── D0: the check on a laptop, answers filling the side panel (s11b, 6.2 s) ──
await page.goto(`${BASE}/check?demo=1`, { waitUntil: "domcontentloaded" });
await tap("I'm on the bank and safe");
await tap("Demo: Alna");
await page.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
await pause(500);
await tap("Continue");
await waitFor((s) => s.step === "question", 60_000);
for (const qid of ["channelForm", "bottomChannelType"]) {
  if ((await state()).current !== qid) break;
  if (await page.getByRole("button", { name: "Yes, that's right" }).count()) await tap("Yes, that's right");
  else await page.locator("button[data-option]").first().click();
  await waitFor((s) => s.current !== qid);
  await pause(300);
}
await pause(900);
await start();
await at(1.2);
if (await page.getByRole("button", { name: "Yes, that's right" }).count()) await tap("Yes, that's right");
else await chip("Laid stones");
await waitFor((s) => s.current === "habitats");
await at(3.0);
await chip("Riffles or rapids");
await at(3.8);
await tap("Done");
await waitFor((s) => s.current !== "habitats");
await at(5.3);
if ((await state()).current === "fallenBiomassTypes") await tap("None");
await stop("d0-check", 7.0);

// ── D1: the research hub (s12, 9.6 s) ──
await page.goto(`${BASE}/hub`, { waitUntil: "domcontentloaded" });
await page.locator(".maplibregl-canvas").waitFor({ timeout: 20_000 });
await pause(3500);
await start();
await at(1.0);
await glideTo("Checks across OneAquaHealth", 70);
await at(2.4);
await page.getByRole("button", { name: "Oslo", exact: true }).click();
await at(4.3);
await glideTo("Which questions do people find hard?", 80);
await at(7.0);
await glideTo("Do people agree with the photo suggestions?", 80);
await stop("d1-hub", 10.4);

// ── D2: languages, working without AI or signal, data in Europe, cost (s13, 10.0 s) ──
await page.goto(`${BASE}/about`, { waitUntil: "domcontentloaded" });
await pause(2000);
await glideTo("How we use AI safely", 80);
await pause(1400);
await start();
await at(4.2);
await glideTo("Your data", 80);
await at(6.6);
await glideTo("What it costs, and how OneAquaHealth could use it", 80);
await stop("d2-about", 10.6);

await context.close();
await browser.close();
