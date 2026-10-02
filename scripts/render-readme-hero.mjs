// Composes the README hero image from phone screenshots (run capture-screens.mjs first).
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { PHONE_CSS, phone } from "./lib/phone-frame.mjs";

const img = async (name) => `data:image/png;base64,${(await readFile(`docs/img/${name}.png`)).toString("base64")}`;
const shots = [
  { src: await img("check-question"), bar: "#fefefe" },
  { src: await img("check-margins"), bar: "#fefefe", style: "margin-top:34px" },
  { src: await img("story"), bar: "#f3f8f9" },
  { src: await img("review"), bar: "#fefefe", style: "margin-top:34px" },
];
const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>
body{margin:0;width:1600px;height:900px;overflow:hidden;background:linear-gradient(160deg,#e3f5f8 0%,#f4f8f9 55%,#ecf6df 100%);font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center}
h1{font-family:'DM Serif Display',serif;font-size:56px;color:#0d3245;margin:44px 0 6px}
p{font-size:22px;color:#4b6474;margin:0 0 30px}
.row{display:flex;gap:42px;align-items:flex-start}
${PHONE_CSS}
</style></head><body><h1>Brook — talk to your stream</h1><p>OneAquaHealth's citizen stream check, by voice or tap, in seven languages</p>
<div class="row">${shots.map((x) => phone(x.src, 640, { bar: x.bar, style: x.style })).join("")}</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "docs/img/hero.png" });
await browser.close();
console.log("docs/img/hero.png");
