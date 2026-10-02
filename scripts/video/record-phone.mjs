// Films the demo-video clips of the real app on a phone (390×797, the app's area
// under the status bar, at 2×), one clip per scene, with real AI suggestions.
// Voice replies go through film mode (?film=1): the same code path as a real
// microphone. Every action happens at a set time in its clip, matched to the
// narration that plays over it (see compose.py), so there is no dead air.
// Waiting (photo analysis, network) happens between clips, never in them.
// Also captures the check in Portuguese, Italian and Greek for the languages scene.
//
// Run with the dev server up (and OPENAI_API_KEY set):
//   node scripts/video/record-phone.mjs [baseUrl] [langs]   ("langs": only the language stills)

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startScreencast } from "./screencast.mjs";

const BASE = process.argv[2] ?? "http://localhost:5173";
const ONLY_LANGS = process.argv[3] === "langs";
const OUT = "out/video/clips";
const CARDS = "out/video/cards";
await mkdir(OUT, { recursive: true });

const PHONE = {
  viewport: { width: 390, height: 797 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-GB",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
};
const settings = (lang) => ({ state: { lang, voiceOn: false, handsFree: false, sharePhotos: false, clientId: "demo-film" }, version: 0 });

const browser = await chromium.launch();
const context = await browser.newContext(PHONE);
await context.addInitScript((s) => localStorage.setItem("brook-settings", JSON.stringify(s)), settings("en"));
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
const hear = (text) => page.evaluate((t) => window.__brookHear(t), text);
const tap = (name) => page.getByRole("button", { name, exact: false }).first().click();
const chip = (text) => page.locator("button[data-option]", { hasText: text }).first().click();
const answered = (qid) => waitFor((s) => s.current !== qid || s.step !== "question");
const offered = async () => (await page.getByRole("button", { name: "Yes, that's right" }).count()) > 0;

// A clip, with `at(s)` to act at a set second after recording starts.
let rec;
let t0 = 0;
const start = async () => {
  rec = await startScreencast(page, { width: 780, height: 1594 });
  t0 = Date.now();
};
const at = async (s) => {
  const wait = t0 + s * 1000 - Date.now();
  if (wait > 0) await pause(wait);
};
const stop = async (name, until) => {
  await at(until);
  const r = await rec.stop(`${OUT}/${name}.mp4`, { minSeconds: until });
  console.log(name, r);
};

if (!ONLY_LANGS) {
  // ── P1: hello and safety, then the nearest streams (narration s04, 7.3 s) ──
  await page.goto(`${BASE}/check?demo=1&film=1`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "I'm on the bank and safe" }).waitFor();
  await pause(900);
  await start();
  await at(1.9);
  await tap("I'm on the bank and safe");
  await at(5.0);
  await tap("Demo: Alna");
  await page.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
  await stop("p1-start", 7.6);

  // ── P2: photos → suggestions (s05, 6.2 s); the AI's wait is between clips ──
  await tap("Continue");
  await waitFor((s) => s.step === "question", 60_000);
  await pause(700);
  await start();
  await stop("p2-suggested", 6.6);

  // ── P3: ask what a word means, then answer by voice (lead s06; Brook's b02 at 2.2 s) ──
  await start();
  await at(0.5);
  await hear("what does U shape mean?");
  await at(7.6);
  await hear("okay, then it's a U shape");
  await answered("channelForm");
  await stop("p3-voice-help", 9.8);

  // The stream bed (not filmed).
  if ((await state()).current === "bottomChannelType") {
    if (await offered()) await tap("Yes, that's right");
    else await chip("Natural");
    await answered("bottomChannelType");
  }

  // ── P4: confirm a photo suggestion by voice (s07, 8.8 s) ──
  await pause(500);
  await start();
  await at(4.3);
  await hear((await offered()) ? "yes, that's right" : "laid stones");
  await answered("banksChannelType");
  await stop("p4-confirm", 9.2);

  // Fast-forward through the middle questions (not filmed).
  const plan = {
    habitats: async () => tap("Done"),
    fallenBiomassTypes: async () => tap("None"),
    waterFlow: async () => hear("yes, it's fast"),
    waterColor: async () => hear("no, it's clear"),
    waterAbstraction: async () => hear("no"),
    hasDams: async () => chip("No"),
    pipes: async () => hear("yes, there's one pipe"),
    waterDischarge: async () => hear("I'm not sure"),
    construction: async () => chip("No"),
    waterHeight: async () => chip("Knee-deep"),
  };
  for (let i = 0; i < 20; i++) {
    const s = await state();
    if (s.current === "imperviousAreasLeft") break;
    const act = plan[s.current];
    if (!act) throw new Error(`no plan for ${s.current}`);
    if (s.current === "habitats" && !(await page.getByRole("button", { name: "Done" }).isEnabled())) await tap("None");
    else await act();
    await answered(s.current);
    await pause(250);
  }

  // ── P5: face downstream (s08, 5.9 s) ──
  await pause(400);
  await start();
  await at(3.5);
  await chip("No");
  await answered("imperviousAreasLeft");
  await stop("p5-downstream", 6.3);

  const plan2 = {
    imperviousAreasRight: async () => hear("yes"),
    isVegetationCoveredLeft: async () => chip("Yes"),
    vegetationTypeLeft: async () => hear("mostly trees"),
    isVegetationCoveredRight: async () => chip("Yes"),
    vegetationTypeRight: async () => chip("Herbs and grass"),
    hasInvasivePlantSpecies: async () => hear("no"),
    recentVegetationCuts: async () => chip("No"),
  };
  for (let i = 0; i < 20; i++) {
    const s = await state();
    if (s.current === "overallAssessment") break;
    const act = plan2[s.current];
    if (!act) throw new Error(`no plan for ${s.current}`);
    await act();
    await answered(s.current);
    await pause(250);
  }

  // ── P6: rating, feelings, then the second look (s09 at 0.3 s; Brook's b03 at 8.6 s) ──
  await pause(400);
  await start();
  await at(0.8);
  await hear("I'd say it's good");
  await waitFor((s) => s.step === "question" && s.current === "feelings");
  await at(2.9);
  await hear("pretty calm, and a bit happy");
  await at(5.0);
  await tap("Done");
  await waitFor((s) => s.step === "secondLook");
  await at(13.8);
  await tap("Change it");
  await waitFor((s) => s.step === "question" && s.current === "overallAssessment");
  await at(14.5);
  await hear("moderate, then");
  for (let i = 0; i < 4; i++) {
    await waitFor((s) => s.step === "review" || s.step === "secondLook");
    if ((await state()).step === "review") break;
    await pause(900);
    await tap("Keep my answer");
  }
  await stop("p6-second-look", 17.4);

  await tap("Send my check");
  await page.waitForURL(/\/story\//, { timeout: 30_000 });
  await pause(2500);

  // ── P7: the story, section by section (s10, 9.8 s) ──
  const glideTo = (text) =>
    page.evaluate((t) => {
      const el = [...document.querySelectorAll("p, h2, h3")].find((n) => n.textContent?.trim().startsWith(t));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
    }, text);
  await start();
  await at(2.0);
  await glideTo("What you saw today");
  await at(6.3);
  await glideTo("One Health tips for today");
  await stop("p7-story", 10.4);

  // ── P8: the data that travels (s11, 8.2 s) ──
  await glideTo("Your answers, as OneAquaHealth receives them");
  await pause(1200);
  await start();
  await at(3.0);
  await page.getByText("Show the technical data").click();
  await at(5.4);
  await page.evaluate(() => window.scrollBy({ top: 260, behavior: "smooth" }));
  await stop("p8-data", 8.8);
}
await context.close();

// ── The check in three of OneAquaHealth's languages, as stills ──
for (const lang of ["pt", "it", "el"]) {
  const ctx = await browser.newContext(PHONE);
  await ctx.addInitScript((s) => localStorage.setItem("brook-settings", JSON.stringify(s)), settings(lang));
  const p = await ctx.newPage();
  await p.goto(`${BASE}/check?demo=1`, { waitUntil: "networkidle" });
  await p.locator("button.btn-primary").first().click(); // "I'm on the bank and safe", in this language
  await p.getByRole("button", { name: /^Demo:/ }).click();
  await p.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
  await p.waitForTimeout(500);
  await p.locator("button.btn-primary").first().click(); // Continue
  await p.waitForFunction(() => (JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {}).step === "question", null, { timeout: 60_000 });
  await p.waitForTimeout(1200);
  await p.mouse.move(0, 0);
  await p.screenshot({ path: `${CARDS}/lang-${lang}.png` });
  console.log(`lang-${lang}.png`);
  await ctx.close();
}

await browser.close();
