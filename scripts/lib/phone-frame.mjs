// A phone drawn in HTML/CSS for the README and Devpost images, matching the
// app's own PhoneFrame component: titanium edge, black bezel, camera island,
// status bar and home bar. The screenshot (390×797, the app's area under the
// status bar) fills the screen exactly, so nothing is cropped.

export const PHONE_CSS = `
.phone{position:relative;flex:none}
.phone .btn{position:absolute;width:4px;background:linear-gradient(90deg,#4c5861,#9aa6ae,#5c6870)}
.phone .frame{background:linear-gradient(135deg,#e3e8ec,#8f9ba4 50%,#d7dde2);box-shadow:0 60px 110px -40px rgba(13,50,69,.55),0 30px 60px -30px rgba(13,50,69,.35)}
.phone .bezel{background:#0a0d10}
.phone .screen{position:relative;overflow:hidden;background:#fff}
.phone .status{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;font:600 16px/1 'DM Sans',sans-serif;color:#10283a;padding:6px 34px 0}
.phone .island{position:absolute;left:50%;transform:translateX(-50%);background:#000;border-radius:999px}
.phone .shot{position:absolute;left:0;width:100%;display:block}
.phone .home{position:absolute;left:50%;transform:translateX(-50%);background:rgba(16,40,58,.85);border-radius:999px}
.phone .glass{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.14) 0%,transparent 32%);pointer-events:none}
`;

const ICONS = `<span style="display:flex;gap:6px;align-items:center">
<svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor"/></svg>
<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5 L5.6 9 a3.4 3.4 0 0 1 4.8 0 Z" fill="currentColor"/><path d="M2.8 6.3 a7.4 7.4 0 0 1 10.4 0" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M0.6 3.8 a10.6 10.6 0 0 1 14.8 0" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>
<svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><path d="M25 4.5 v4 a2 2 0 0 0 0 -4z" fill="currentColor" fill-opacity=".45"/></svg></span>`;

/**
 * A phone `height` px tall showing `src` (a data URL of a 390×797 screenshot).
 * `bar` is the status bar's background, to match the top of the screenshot.
 */
export function phone(src, height, { bar = "#ffffff", style = "" } = {}) {
  const k = height / 900; // the frame is designed at 900 px tall
  const frame = 3 * k;
  const bezel = 11.5 * k;
  const screenH = height - 2 * (frame + bezel);
  const s = screenH / 844; // CSS px of the 390×844 screen
  const screenW = 390 * s;
  const width = screenW + 2 * (frame + bezel);
  const r = 54 * s;
  const btn = (side, top, h) => `<span class="btn" style="${side}:-${3 * k}px;top:${top}%;height:${h}%;border-radius:${side === "left" ? "3px 0 0 3px" : "0 3px 3px 0"}"></span>`;
  return `<div class="phone" style="width:${width}px;height:${height}px;${style}">
  ${btn("left", 17, 5)}${btn("left", 25, 9)}${btn("left", 36, 9)}${btn("right", 29, 13)}
  <div class="frame" style="padding:${frame}px;border-radius:${r + bezel + frame}px">
    <div class="bezel" style="padding:${bezel}px;border-radius:${r + bezel}px">
      <div class="screen" style="width:${screenW}px;height:${screenH}px;border-radius:${r}px">
        <div style="position:absolute;inset:0;transform-origin:top left;transform:scale(${s});width:390px;height:844px">
          <div class="status" style="height:47px;background:${bar}"><span style="width:60px">9:41</span>${ICONS}</div>
          <div class="island" style="top:11px;width:120px;height:34px"></div>
          <img class="shot" src="${src}" style="top:47px;height:797px">
          <div class="home" style="bottom:4px;width:134px;height:5px"></div>
        </div>
        <div class="glass"></div>
      </div>
    </div>
  </div>
</div>`;
}
