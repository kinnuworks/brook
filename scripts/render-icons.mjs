// Renders the app icons and the social preview image from SVG/HTML with
// headless Chromium. Run: node scripts/render-icons.mjs
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function svgToPng(svgPath, size, out) {
  const svg = await readFile(svgPath, "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

await svgToPng("public/favicon.svg", 192, "public/icon-192.png");
await svgToPng("public/favicon.svg", 512, "public/icon-512.png");
await svgToPng("public/icon-maskable.svg", 512, "public/icon-maskable-512.png");
await svgToPng("public/icon-maskable.svg", 180, "public/apple-touch-icon.png");
await browser.close();
console.log("icons rendered");
