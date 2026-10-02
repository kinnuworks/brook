// Automated accessibility scan (axe-core, WCAG 2.1 A/AA) of every page,
// on a phone-sized screen. Run with the dev server up: node scripts/a11y.mjs [baseUrl]
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium, devices } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 14"] });
await context.addInitScript(() =>
  localStorage.setItem("brook-settings", JSON.stringify({ state: { lang: "en", voiceOn: false, handsFree: false, sharePhotos: true, clientId: "a11y" }, version: 0 })),
);
const page = await context.newPage();
const pages = [
  ["home", "/"],
  ["check-safety", "/check?demo=1"],
  ["hub", "/hub"],
  ["about", "/about"],
];
const results = [];
for (const [name, path] of pages) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).exclude(".maplibregl-canvas").analyze();
  results.push({ page: name, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, sample: v.nodes[0]?.target })) });
}
// A question screen, reached through the real flow.
await page.goto(`${BASE}/check?demo=1`, { waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: "I'm on the bank and safe" }).click();
await page.getByRole("button", { name: /Demo: Alna/ }).click();
await page.waitForTimeout(2500);
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.waitForTimeout(1500);
const q = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
results.push({ page: "check-question", violations: q.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help, sample: v.nodes[0]?.target })) });

await mkdir("docs/evidence", { recursive: true });
await writeFile("docs/evidence/a11y.json", JSON.stringify({ at: new Date().toISOString(), base: BASE, results }, null, 2));
for (const r of results) console.log(`${r.page}: ${r.violations.length} violation types`, r.violations.map((v) => `${v.id}(${v.impact},${v.nodes}) ${JSON.stringify(v.sample)}`).join(" | "));
await browser.close();
