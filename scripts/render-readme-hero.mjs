// Composes the README hero image from walkthrough screenshots. Run after e2e-walkthrough.mjs.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const shots = ["check-question", "check-margins", "story-lab", "review"];
const imgs = await Promise.all(shots.map(async (s) => `data:image/png;base64,${(await readFile(`docs/img/${s}.png`)).toString("base64")}`));
const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>
body{margin:0;width:1600px;height:900px;background:linear-gradient(160deg,#e3f5f8 0%,#f4f8f9 55%,#ecf6df 100%);font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
h1{font-family:'DM Serif Display',serif;font-size:58px;color:#0d3245;margin:0 0 6px}
p{font-size:22px;color:#4b6474;margin:0 0 34px}
.row{display:flex;gap:34px;align-items:flex-start}
.phone{width:330px;height:640px;border-radius:44px;background:#0d3245;padding:10px;box-shadow:0 30px 60px -20px rgba(33,107,140,.45)}
.phone:nth-child(2),.phone:nth-child(4){margin-top:36px}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:36px;display:block}
</style></head><body><h1>Brook — talk to your stream</h1><p>OneAquaHealth's citizen stream check, by voice or tap, in seven languages</p><div class="row">${imgs.map((src) => `<div class="phone"><img src="${src}"></div>`).join("")}</div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: "docs/img/hero.png" });
await browser.close();
console.log("docs/img/hero.png");
