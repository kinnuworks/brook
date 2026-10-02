// Offline test: the signal drops at the stream. The check must still finish,
// be kept on the phone, and be sent automatically once back online.
// Run with the dev server up: node scripts/offline-test.mjs [baseUrl]
import { writeFile, mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 14"] });
await context.addInitScript(() =>
  localStorage.setItem("brook-settings", JSON.stringify({ state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: false, clientId: "offline-test" }, version: 0 })),
);
const page = await context.newPage();
const log = [];
const state = () => page.evaluate(() => JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {});

await page.goto(`${BASE}/check?demo=1`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "I'm on the bank and safe" }).click();
await page.getByRole("button", { name: /Demo: Alna/ }).click();
await page.waitForTimeout(2000);
await page.getByRole("button", { name: "Continue without photos" }).click();
// The demo loads sample photos, so Brook looks at them first (an AI call): wait for the first question.
await page.waitForFunction(() => (JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {}).step === "question", null, { timeout: 60_000 });

await context.setOffline(true);
log.push("network OFF after the first question appeared");

// Answer everything with the first sensible tap.
for (let i = 0; i < 40; i++) {
  const st = await state();
  if (st.step === "review") break;
  if (st.step === "secondLook") {
    await page.getByRole("button", { name: /Keep my answer|Continue/ }).first().click();
    continue;
  }
  if (st.step !== "question") {
    await page.waitForTimeout(200);
    continue;
  }
  const q = st.current;
  if (q === "overallAssessment") await page.locator("button[data-option]", { hasText: "Moderate" }).click();
  else if (q === "feelings") await page.getByRole("button", { name: "Done" }).click();
  else if (q === "habitats" || q === "fallenBiomassTypes") await page.getByRole("button", { name: "None" }).click();
  else if (q === "numberOfDams" || q === "invasivePlantSpecies") await page.getByRole("button", { name: "I'm not sure" }).click();
  else if (q === "waterHeight") await page.locator("button[data-option]", { hasText: "Knee-deep" }).click();
  else await page.locator("button[data-option]").first().click();
  await page.waitForFunction((qid) => (JSON.parse(sessionStorage.getItem("brook-check") ?? "{}").state ?? {}).current !== qid, q, { timeout: 5000 }).catch(() => {});
}
await page.getByRole("button", { name: "Send my check" }).click();
await page.waitForURL(/\/story\//, { timeout: 15_000 });
const offlineBanner = await page.getByText("You're offline").isVisible().catch(() => false);
const pending = await page.evaluate(async () => {
  const req = indexedDB.open("brook");
  const db = await new Promise((res, rej) => ((req.onsuccess = () => res(req.result)), (req.onerror = rej)));
  const all = await new Promise((res) => {
    const r = db.transaction("checks").objectStore("checks").getAll();
    r.onsuccess = () => res(r.result);
  });
  return all.map((c) => ({ id: c.id, status: c.status }));
});
log.push(`story page shown offline; offline note visible: ${offlineBanner}; stored: ${JSON.stringify(pending.slice(-1))}`);

await context.setOffline(false);
log.push("network ON");
// Opening the check page flushes anything pending.
await page.goto(`${BASE}/check`, { waitUntil: "domcontentloaded" });
const stored = () =>
  page.evaluate(async () => {
    const req = indexedDB.open("brook");
    const db = await new Promise((res, rej) => ((req.onsuccess = () => res(req.result)), (req.onerror = rej)));
    const all = await new Promise((res) => {
      const r = db.transaction("checks").objectStore("checks").getAll();
      r.onsuccess = () => res(r.result);
    });
    return all.map((c) => ({ id: c.id, status: c.status, serverId: c.serverId ?? null }));
  });
// Sending goes through the server and the database: allow it up to 20 seconds.
let after = await stored();
for (let i = 0; i < 40 && after.at(-1)?.status !== "sent"; i++) {
  await page.waitForTimeout(500);
  after = await stored();
}
log.push(`after reconnecting: ${JSON.stringify(after.slice(-1))}`);
const ok = pending.at(-1)?.status === "pending" && after.at(-1)?.status === "sent" && Boolean(after.at(-1)?.serverId);
log.push(ok ? "PASS: kept offline, sent on reconnect" : "FAIL");
await mkdir("docs/evidence", { recursive: true });
await writeFile("docs/evidence/offline.json", JSON.stringify({ at: new Date().toISOString(), ok, log }, null, 2));
console.log(log.join("\n"));
await browser.close();
process.exitCode = ok ? 0 : 1;
