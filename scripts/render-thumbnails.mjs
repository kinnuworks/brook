// Renders the Devpost thumbnail (3:2) and the link-preview image (1200×630)
// from phone screenshots (run capture-screens.mjs first).
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { PHONE_CSS, phone } from "./lib/phone-frame.mjs";

const avatar = await readFile("public/favicon.svg", "utf8");
const img = async (name) => `data:image/png;base64,${(await readFile(`docs/img/${name}.png`)).toString("base64")}`;
const question = await img("check-question");
const story = await img("story");

const html = (w, h) => {
  const ph = h * 0.74;
  return `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;800&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box}body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:'DM Sans',sans-serif;background:linear-gradient(150deg,#e3f5f8 0%,#f4f8f9 55%,#ecf6df 100%);position:relative}
.l{position:absolute;left:${w * 0.055}px;top:0;bottom:0;width:${w * 0.36}px;display:flex;flex-direction:column;justify-content:center}
.logo{display:flex;align-items:center;gap:14px;font-size:${h * 0.05}px;font-weight:800;color:#0d3245}.logo svg{width:${h * 0.09}px;height:${h * 0.09}px}
h1{font-family:'DM Serif Display',serif;font-size:${h * 0.088}px;line-height:1.02;color:#0d3245;margin:${h * 0.04}px 0 0}
p{font-size:${h * 0.034}px;line-height:1.4;color:#4b6474;margin:${h * 0.035}px 0 0}
.tag{display:inline-block;align-self:flex-start;margin-top:${h * 0.04}px;padding:${h * 0.012}px ${h * 0.026}px;border-radius:999px;background:#216b8c;color:white;font-weight:700;font-size:${h * 0.026}px;white-space:nowrap}
.r{position:absolute;right:${w * 0.045}px;top:${(h - ph) / 2 - h * 0.02}px;display:flex;gap:${h * 0.035}px;align-items:flex-start}
${PHONE_CSS}
</style></head><body>
<div class="l"><div class="logo">${avatar}<span>Brook</span></div><h1>Talk to your stream.</h1>
<p>A friendly guide for OneAquaHealth's citizen stream check. Voice or tap, seven languages.</p><span class="tag">OneAquaHealth IEEE Hackathon 2026</span></div>
<div class="r">${phone(question, ph, { bar: "#fefefe" })}${phone(story, ph, { bar: "#f3f8f9", style: `margin-top:${h * 0.05}px` })}</div>
</body></html>`;
};

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, w, h] of [
  ["docs/img/devpost-thumbnail.png", 1500, 1000],
  ["public/og.png", 1200, 630],
]) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html(w, h), { waitUntil: "networkidle" });
  await page.screenshot({ path: name });
}
await browser.close();
console.log("thumbnails rendered");
