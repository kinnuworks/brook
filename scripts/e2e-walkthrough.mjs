// End-to-end walkthrough of a complete stream check on a phone-sized screen:
// safety → site → sample photos → every question (tapped, typed, "not sure",
// "what does that mean?") → second look → review → send → story.
// Saves a screenshot per step to out/e2e/. Also used to film the demo video.
//
// Run with the dev server up:  node scripts/e2e-walkthrough.mjs [baseUrl]

import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";
const OUT = "out/e2e";
const RECORD = process.env.RECORD === "1";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices["iPhone 14"],
  locale: "en-GB",
  ...(RECORD ? { recordVideo: { dir: "out/video-raw", size: { width: 390, height: 844 } } } : {}),
});
await context.addInitScript(() => {
  localStorage.setItem("brook-settings", JSON.stringify({ state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: true, clientId: "e2e-walkthrough" }, version: 0 }));
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && !/favicon|Failed to load resource/.test(m.text()) && errors.push(m.text()));

let shot = 0;
const snap = async (name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, "0")}-${name}.png` });
};
const state = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {});
const tap = (text) => page.getByRole("button", { name: text, exact: false }).first().click();
const chip = (text) => page.locator("button[data-option]", { hasText: text }).first().click();
const type = async (text) => {
  if (!(await page.getByPlaceholder("Type an answer").isVisible().catch(() => false))) await page.getByLabel("Type an answer").click();
  await page.getByPlaceholder("Type an answer").fill(text);
  await page.getByPlaceholder("Type an answer").press("Enter");
};
const pause = (ms) => page.waitForTimeout(ms);

// What we answer, and how: a mix of taps, typed sentences, "not sure" and a help request.
const PLAN = {
  channelForm: async () => {
    await tap("What does that mean?");
    await pause(500);
    await snap("help");
    await type("it's kind of a U with steep sides");
  },
  bottomChannelType: () => type("natural, gravel and stones"),
  banksChannelType: () => chip("Laid stones"),
  habitats: async () => {
    await chip("Riffles or rapids");
    await chip("Stone deposits");
    await tap("Done");
  },
  fallenBiomassTypes: () => tap("None"),
  waterFlow: () => chip("Fast"),
  waterColor: () => chip("Clear"),
  waterAbstraction: () => chip("No"),
  hasDams: () => chip("Yes"),
  numberOfDams: () => tap("Done"),
  pipes: () => type("no, I don't think so"),
  waterDischarge: () => tap("I'm not sure"),
  construction: () => chip("No"),
  waterHeight: () => chip("Knee-deep"),
  imperviousAreasLeft: () => chip("Yes"),
  imperviousAreasRight: () => chip("No"),
  isVegetationCoveredLeft: () => chip("Yes"),
  vegetationTypeLeft: () => chip("Herbs and grass"),
  isVegetationCoveredRight: () => chip("Yes"),
  vegetationTypeRight: () => chip("Trees"),
  hasInvasivePlantSpecies: () => chip("No"),
  recentVegetationCuts: () => chip("No"),
  overallAssessment: () => chip("Moderate"),
  feelings: async () => {
    await type("quite calm, and a bit happy");
    await pause(400);
    await snap("feelings");
    await tap("Done");
  },
};

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
await snap("home");
await page.goto(`${BASE}/check?demo=1`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "I'm on the bank and safe" }).waitFor({ timeout: 30_000 });
await snap("hello-safety");
await tap("I'm on the bank and safe");
await snap("site");
await tap("Demo: Alna");
await page.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
await snap("photos");
await tap("Continue");

const seen = new Set();
for (let guard = 0; guard < 60; guard++) {
  const st = await state();
  if (st.step === "question" && st.current) {
    if (seen.has(st.current) && !["channelForm"].includes(st.current)) {
      // A question came back (e.g. after "back"): answer it with its plan again.
    }
    seen.add(st.current);
    const act = PLAN[st.current];
    if (!act) throw new Error(`no plan for ${st.current}`);
    await pause(300);
    if (["channelForm", "banksChannelType", "waterColor", "imperviousAreasLeft", "overallAssessment"].includes(st.current)) await snap(`q-${st.current}`);
    await act();
    await page.waitForFunction((qid) => {
      const s = JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {};
      return s.current !== qid || s.step !== "question";
    }, st.current, { timeout: 10_000 });
    continue;
  }
  if (st.step === "secondLook") {
    await snap("second-look");
    const keep = page.getByRole("button", { name: "Keep my answer" });
    if (await keep.isVisible().catch(() => false)) await keep.click();
    else await tap("Continue");
    await pause(400);
    continue;
  }
  if (st.step === "review") {
    await snap("review");
    await tap("Send my check");
    break;
  }
  await pause(300);
}

await page.waitForURL(/\/story\//, { timeout: 30_000 });
await page.waitForTimeout(1500);
await snap("story-top");
await page.mouse.wheel(0, 900);
await snap("story-lab");
await page.mouse.wheel(0, 1100);
await snap("story-tips");
await page.mouse.wheel(0, 1400);
await snap("story-data");

await page.goto(`${BASE}/hub`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await snap("hub");

console.log(JSON.stringify({ screenshots: shot, questionsAnswered: seen.size, errors }, null, 2));
await context.close();
await browser.close();
if (errors.length) process.exitCode = 1;
