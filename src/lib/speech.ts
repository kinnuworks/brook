// Brook's voice and ears, using the browser's own speech engines: free, no
// account, nothing extra to download. Where a browser has no speech
// recognition (Firefox), Brook says so and the check works by tap or typing.

/* eslint-disable @typescript-eslint/no-explicit-any */
type RecognitionCtor = new () => any;

const Recognition: RecognitionCtor | undefined =
  typeof window !== "undefined" ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : undefined;

export const canListen = () => Boolean(Recognition);
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export interface Heard {
  /** Every alternative the recogniser offered, best first. */
  alternatives: string[];
}

export interface ListenHandle {
  stop: () => void;
  result: Promise<Heard | null>;
}

export function listen(locale: string, onInterim?: (text: string) => void): ListenHandle {
  if (!Recognition) return { stop: () => {}, result: Promise.resolve(null) };
  const rec = new Recognition();
  rec.lang = locale;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 4;
  let done = false;
  let finalAlternatives: string[] = [];
  let lastInterim = "";

  const result = new Promise<Heard | null>((resolve) => {
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalAlternatives = Array.from(r, (alt: any) => String(alt.transcript).trim()).filter(Boolean);
        } else {
          lastInterim = String(r[0]?.transcript ?? "");
          onInterim?.(lastInterim);
        }
      }
    };
    const finish = () => {
      if (done) return;
      done = true;
      const alternatives = finalAlternatives.length ? finalAlternatives : lastInterim ? [lastInterim] : [];
      resolve(alternatives.length ? { alternatives } : null);
    };
    rec.onend = finish;
    rec.onerror = finish;
  });

  try {
    rec.start();
  } catch {
    /* already started */
  }
  return { stop: () => rec.stop(), result };
}

let voicesCache: SpeechSynthesisVoice[] = [];
function voices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  if (!voicesCache.length) voicesCache = window.speechSynthesis.getVoices();
  return voicesCache;
}
if (canSpeak()) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

/** The most natural-sounding installed voice for a locale. */
function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const base = locale.split("-")[0];
  const candidates = voices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(base));
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.replace("_", "-").toLowerCase() === locale.toLowerCase() ? 4 : 0) +
    (/natural|neural|premium|enhanced|siri/i.test(v.name) ? 3 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (v.localService ? 1 : 0);
  return candidates.sort((a, b) => score(b) - score(a))[0];
}

export function speak(text: string, locale: string, events: { onStart?: () => void; onEnd?: () => void } = {}): () => void {
  if (!canSpeak() || !text.trim()) {
    events.onEnd?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale;
  const v = pickVoice(locale);
  if (v) u.voice = v;
  u.rate = 1.02;
  u.pitch = 1.05;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    events.onEnd?.();
  };
  u.onstart = () => events.onStart?.();
  u.onend = end;
  u.onerror = end;
  synth.speak(u);
  // Some browsers never fire onend for long utterances; guard against a stuck avatar.
  const guard = window.setTimeout(end, Math.min(30_000, 2500 + text.length * 90));
  return () => {
    window.clearTimeout(guard);
    synth.cancel();
    end();
  };
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
