// Captures the screenshots used in the README, the Devpost gallery and the
// thumbnails: a demo check on a phone (390×797, the app's area under the status
// bar, at 3×) and the main pages on a laptop (1440×900 at 2×). Sends one demo
// check, marked Trial.
//
// Run with the dev server up:  node scripts/capture-screens.mjs [baseUrl] [phone|laptop]

import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";
const ONLY = process.argv[3];
const OUT = "docs/img";
await mkdir(OUT, { recursive: true });
const SETTINGS = { state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: false, clientId: "screens" }, version: 0 };

const browser = await chromium.launch();

async function walk(page, shots) {
  const state = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {});
  const until = async (pred, ms = 60_000) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (pred(await state())) return;
      await page.waitForTimeout(150);
    }
    throw new Error("timed out");
  };
  await page.goto(`${BASE}/check?demo=1`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "I'm on the bank and safe" }).click();
  await page.getByRole("button", { name: /Demo: Alna/ }).click();
  await page.waitForFunction(() => document.querySelectorAll("img[alt]").length >= 3, null, { timeout: 15_000 });
  await page.waitForTimeout(600);
  if (shots.photos) await page.screenshot({ path: shots.photos });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await until((s) => s.step === "question");
  for (let i = 0; i < 40; i++) {
    const s = await state();
    if (s.step === "review") break;
    if (s.step === "secondLook") {
      await page.getByRole("button", { name: /Keep my answer|Continue/ }).first().click();
      await page.waitForTimeout(400);
      continue;
    }
    if (s.step !== "question") {
      await page.waitForTimeout(300);
      continue;
    }
    const qid = s.current;
    await page.waitForTimeout(700);
    await page.mouse.move(0, 0); // no hover highlight left over from the last click
    if (shots[qid]) await page.screenshot({ path: shots[qid] });
    if (qid === "channelForm" && shots.help) {
      await page.getByRole("button", { name: "What does that mean?" }).click();
      await page.waitForTimeout(900);
      await page.screenshot({ path: shots.help });
    }
    const confirm = page.getByRole("button", { name: "Yes, that's right" });
    if (await confirm.count()) await confirm.click();
    else if (qid === "feelings") await page.getByRole("button", { name: "Done" }).click();
    else if (await page.getByRole("button", { name: "None", exact: true }).count()) await page.getByRole("button", { name: "None", exact: true }).click();
    else if (await page.getByRole("button", { name: "No", exact: true }).count()) await page.getByRole("button", { name: "No", exact: true }).click();
    else if (await page.locator("[data-option]").count()) await page.locator("[data-option]").first().click();
    else await page.getByRole("button", { name: "Done" }).click();
    await until((st) => st.current !== qid || st.step !== "question", 20_000);
  }
  await page.waitForTimeout(700);
  if (shots.review) await page.screenshot({ path: shots.review });
  await page.getByRole("button", { name: "Send my check" }).click();
  await page.waitForURL(/\/story\//, { timeout: 30_000 });
  await page.waitForTimeout(2500);
}

// ── Phone ────────────────────────────────────────────────────────────────
if (ONLY !== "laptop") {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-GB" });
  await ctx.addInitScript((s) => localStorage.setItem("brook-settings", JSON.stringify(s)), SETTINGS);
  const page = await ctx.newPage();
  await walk(page, {
    help: `${OUT}/help.png`,
    banksChannelType: `${OUT}/check-question.png`,
    imperviousAreasLeft: `${OUT}/check-margins.png`,
    review: `${OUT}/review.png`,
  });
  await page.screenshot({ path: `${OUT}/story.png` });
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("p")].find((n) => n.textContent?.startsWith("What you saw today"));
    el?.closest("section")?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -70);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/story-lab.png` });
  await ctx.close();
}

// ── Laptop ───────────────────────────────────────────────────────────────
if (ONLY !== "phone") {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: "en-GB" });
  await ctx.addInitScript((s) => localStorage.setItem("brook-settings", JSON.stringify(s)), SETTINGS);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/desktop-home.png` });
  await walk(page, { banksChannelType: `${OUT}/desktop-check.png` });
  await page.screenshot({ path: `${OUT}/desktop-story.png` });
  await page.goto(`${BASE}/hub`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/desktop-hub.png` });
  await ctx.close();
}

await browser.close();
console.log("screens captured in docs/img");
