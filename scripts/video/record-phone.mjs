// Films the demo-video clips of the real app on a phone-sized screen (390×844
// at 2×), one clip per scene, with real AI suggestions. Voice replies go
// through film mode (?film=1): the same code path as a real microphone.
// Waiting (photo analysis, network) happens between clips, not in them.
//
// Run with the dev server up (and OPENAI_API_KEY set):
//   node scripts/video/record-phone.mjs [baseUrl]

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startScreencast } from "./screencast.mjs";

const BASE = process.argv[2] ?? "http://localhost:5173";
const OUT = "out/video/clips";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en-GB",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
});
await context.addInitScript(() => {
  localStorage.setItem("brook-settings", JSON.stringify({ state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: false, clientId: "demo-film" }, version: 0 }));
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const state = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {});
const waitFor = async (pred, timeout = 30_000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (pred(await state())) return;
    await pause(150);
  }
  throw new Error("timed out waiting for state");
};
const hear = (text) => page.evaluate((t) => window.__brookHear(t), text);
const tap = (name) => page.getByRole("button", { name, exact: false }).first().click();
const chip = (text) => page.locator("button[data-option]", { hasText: text }).first().click();
const answered = (qid) => waitFor((s) => s.current !== qid || s.step !== "question");

let rec;
const start = async () => (rec = await startScreencast(page, { width: 780, height: 1688 }));
const stop = async (name, minSeconds = 0) => {
  const r = await rec.stop(`${OUT}/${name}.mp4`, { minSeconds });
  console.log(name, r);
};

// ── P1: hello, safety, site ───────────────────────────────────────────────
await page.goto(`${BASE}/check?demo=1&film=1`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "I'm on the bank and safe" }).waitFor();
await pause(800);
await start();
await pause(2600);
await tap("I'm on the bank and safe");
await pause(1800);
await tap("Demo: Alna");
await page.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
await pause(2200);
await stop("p1-start");

// ── P2: photos → suggestions (the AI wait is between clips) ───────────────
await tap("Continue");
await waitFor((s) => s.step === "question", 60_000);
await pause(600);
await start();
await pause(3200);
await stop("p2-suggested");

// ── P3: talk, ask what a word means ───────────────────────────────────────
await start();
await pause(800);
await hear("what does U shape mean?");
await pause(3800);
await hear("okay, then it's a U shape");
await answered("channelForm");
await pause(1600);
await stop("p3-voice-help");

// The rest of "what you see", then the photo-suggestion moments.
const s1 = await state();
if (s1.current === "bottomChannelType") {
  await chip("Natural");
  await answered("bottomChannelType");
}

// ── P4: confirm a photo suggestion by voice ───────────────────────────────
await pause(500);
await start();
await pause(2200);
await hear("yes, that's right");
await answered("banksChannelType");
await pause(1800);
await stop("p4-confirm");

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
  await act();
  await answered(s.current);
  await pause(300);
}

// ── P5: face downstream ───────────────────────────────────────────────────
await pause(400);
await start();
await pause(3200);
await chip("No");
await answered("imperviousAreasLeft");
await pause(1400);
await stop("p5-downstream");

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
  await pause(300);
}

// ── P6: rating, feelings, then the second look ────────────────────────────
await pause(400);
await start();
await pause(1200);
await hear("I'd say it's good");
await waitFor((s) => s.step === "question" && s.current === "feelings");
await pause(1000);
await hear("pretty calm, and a bit happy");
await pause(1800);
await tap("Done");
await waitFor((s) => s.step === "secondLook");
await pause(4600);
await tap("Change it");
await waitFor((s) => s.step === "question" && s.current === "overallAssessment");
await pause(900);
await hear("moderate, then");
for (let i = 0; i < 4; i++) {
  await waitFor((s) => s.step === "review" || s.step === "secondLook");
  const s6 = await state();
  if (s6.step === "review") break;
  await pause(2500);
  await tap("Keep my answer");
}
await pause(2400);
await stop("p6-second-look");

await tap("Send my check");
await page.waitForURL(/\/story\//, { timeout: 30_000 });
await pause(2500);

// ── P7: the story, gliding from section to section ───────────────────────
const glideTo = (text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll("p, h2, h3")].find((n) => n.textContent?.trim().startsWith(t));
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
  }, text);
await start();
await pause(2600);
await glideTo("What you saw today");
await pause(4200);
await glideTo("Health risk from the water");
await pause(4200);
await glideTo("One Health tips for today");
await pause(4200);
await stop("p7-story");

// ── P8: the data that travels ─────────────────────────────────────────────
await glideTo("Your answers, as OneAquaHealth receives them");
await pause(900);
await start();
await pause(2200);
await page.getByText("Show the technical data").click();
await pause(3200);
await stop("p8-data");

await context.close();
await browser.close();
