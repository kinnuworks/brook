import { useLayoutEffect, useRef, useState } from "react";

// A phone to show the app in: titanium edge, black bezel, camera island,
// status bar, side buttons and home bar. Whatever goes inside is laid out at a
// real phone's width (390 px) and scaled to fit, so it looks exactly like the
// app does on a phone, at any size.

export const SCREEN_W = 390;
export const SCREEN_H = 844;

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-20 flex h-[50px] items-center justify-between px-[34px] pt-[6px] text-[16px] font-semibold text-ink" aria-hidden>
      <span className="w-[60px] tracking-tight">9:41</span>
      <span className="flex items-center gap-[6px]">
        <svg viewBox="0 0 18 12" width="18" height="12">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" />
          <rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" />
          <rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 16 12" width="16" height="12">
          <path d="M8 11.5 L5.6 9 a3.4 3.4 0 0 1 4.8 0 Z" fill="currentColor" />
          <path d="M2.8 6.3 a7.4 7.4 0 0 1 10.4 0" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M0.6 3.8 a10.6 10.6 0 0 1 14.8 0" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 27 13" width="27" height="13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
          <path d="M25 4.5 v4 a2 2 0 0 0 0 -4z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const screen = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  useLayoutEffect(() => {
    const el = screen.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SCREEN_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const side = "absolute w-[4px] bg-gradient-to-r from-[#4c5861] via-[#9aa6ae] to-[#5c6870]";
  return (
    <div className={`relative ${className}`}>
      {/* side buttons: action, volume up, volume down / power */}
      <span className={`${side} -left-[3px] top-[17%] h-[5%] rounded-l-[3px]`} aria-hidden />
      <span className={`${side} -left-[3px] top-[25%] h-[9%] rounded-l-[3px]`} aria-hidden />
      <span className={`${side} -left-[3px] top-[36%] h-[9%] rounded-l-[3px]`} aria-hidden />
      <span className={`${side} -right-[3px] top-[29%] h-[13%] rounded-r-[3px]`} aria-hidden />
      <div className="rounded-[54px] bg-gradient-to-br from-[#e3e8ec] via-[#8f9ba4] to-[#d7dde2] p-[3px] shadow-[0_60px_110px_-40px_rgb(13_50_69/0.55),0_30px_60px_-30px_rgb(13_50_69/0.35)]">
        <div className="rounded-[51px] bg-[#0a0d10] p-[11px] ring-1 ring-black/40">
          <div ref={screen} className="relative overflow-hidden rounded-[40px] bg-mist" style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}>
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                transform: `scale(${scale})`,
              }}
            >
              <StatusBar />
              <div className="absolute left-1/2 top-[11px] z-30 h-[35px] w-[120px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
              {children}
              <div className="absolute bottom-[8px] left-1/2 z-30 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-ink/85" aria-hidden />
            </div>
            {/* a soft reflection across the glass */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.16)_0%,transparent_32%)]" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
