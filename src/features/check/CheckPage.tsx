import { ArrowLeft, Ear, HelpCircle, Keyboard, Loader2, Mic, Send, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { AvatarState } from "@/components/BrookAvatar";
import { LangPicker } from "@/components/LangPicker";
import { hasPhrase, interpretLocally, normalize, type LocalIntent } from "@/core/matcher";
import { activeQuestions, QUESTION_BY_ID, SPEECH_LOCALE, type AnswerValue, type PhotoSlot } from "@/core/protocol";
import type { AnswerSource } from "@/core/fhir";
import { SITE_BY_CODE } from "@/core/sites";
import { fetchRecentWeather } from "@/core/weather";
import { loadLang, stringsFor, useStrings } from "@/i18n";
import { aiStatus, analysePhotos, interpret } from "@/lib/api";
import { canListen, listen, speak, stopSpeaking, type ListenHandle } from "@/lib/speech";
import { useSettings } from "@/lib/settings";
import { AnswerInput } from "./parts/AnswerInput";
import { PhotoStep, SAMPLE_SET } from "./parts/PhotoStep";
import { Review } from "./parts/Review";
import { SiteStep } from "./parts/SiteStep";
import { Transcript } from "./parts/Transcript";
import { lookText, offered, useCheck, type Via } from "./store";
import { flushPending, submitCurrentCheck } from "./submit";
import { preparePhoto, urlToBlob } from "@/lib/image";

const sameValue = (a: AnswerValue | undefined, b: AnswerValue | undefined) =>
  Array.isArray(a) && Array.isArray(b) ? a.length === b.length && a.every((x) => b.includes(x)) : JSON.stringify(a) === JSON.stringify(b);

export default function CheckPage() {
  const s = useStrings();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const demo = params.get("demo") === "1";
  const film = params.has("film");
  const lang = useSettings((st) => st.lang);
  const voiceOn = useSettings((st) => st.voiceOn);
  const setVoiceOn = useSettings((st) => st.setVoiceOn);
  const handsFree = useSettings((st) => st.handsFree);
  const setHandsFree = useSettings((st) => st.setHandsFree);

  const step = useCheck((st) => st.step);
  const current = useCheck((st) => st.current);
  const say = useCheck((st) => st.say);
  const site = useCheck((st) => st.site);
  const answers = useCheck((st) => st.answers);
  const suggestions = useCheck((st) => st.suggestions);
  const looks = useCheck((st) => st.looks);
  const lookIndex = useCheck((st) => st.lookIndex);

  const [avatar, setAvatar] = useState<AvatarState>("idle");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [interim, setInterim] = useState("");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [draft, setDraft] = useState<AnswerValue | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState(false);
  const listenRef = useRef<ListenHandle | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view when the answer panel below grows or shrinks.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => el.scrollTo({ top: el.scrollHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const started = useRef(false);

  // Start (or resume) a check, and find out whether the AI helper is available.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void flushPending();
    void aiStatus().then((r) => useCheck.getState().setAiAvailable(Boolean(r?.ai)));
    const st = useCheck.getState();
    if (!st.id || st.step === "submitting" || demo) {
      void loadLang(lang).then(() => useCheck.getState().begin(lang));
    }
  }, [demo, lang]);

  // Speak whatever Brook just said.
  useEffect(() => {
    if (!say) return;
    if (!voiceOn) return;
    const locale = SPEECH_LOCALE[useCheck.getState().lang];
    const cancel = speak(say.text, locale, {
      onStart: () => setAvatar("speaking"),
      onEnd: () => {
        setAvatar("idle");
        const st = useCheck.getState();
        if (useSettings.getState().handsFree && st.step === "question" && canListen()) startListening();
      },
    });
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say?.id, voiceOn]);

  useEffect(() => () => {
    stopSpeaking();
    listenRef.current?.stop();
  }, []);

  useEffect(() => setDraft(undefined), [current]);

  // Weather for the second look and the story, fetched once a site is chosen.
  useEffect(() => {
    if (!site) return;
    const ctrl = new AbortController();
    void fetchRecentWeather(site.lat, site.lon, ctrl.signal).then((w) => useCheck.getState().setWeather(w));
    return () => ctrl.abort();
  }, [site]);

  // In demo mode, choose a real Coimbra site and load sample photos for people away from a stream.
  useEffect(() => {
    if (!demo || step !== "photos") return;
    const st = useCheck.getState();
    if (Object.keys(st.photos).length) return;
    void (async () => {
      for (const [slot, url] of Object.entries(SAMPLE_SET) as [PhotoSlot, string][]) {
        const p = await preparePhoto(await urlToBlob(url));
        useCheck.getState().setPhoto(slot, { dataUrl: p.dataUrl, b64: p.b64, sample: true });
      }
    })();
  }, [demo, step]);

  const commit = useCallback((value: AnswerValue, via: Via, utterance?: string, viaAi = false) => {
    const st = useCheck.getState();
    const qid = st.current;
    if (!qid) return;
    const sug = offered(st.suggestions[qid]) ? st.suggestions[qid] : undefined;
    let source: AnswerSource;
    if (sug) {
      const same = sameValue(value, sug.value);
      source = same ? "photo-confirmed" : "photo-corrected";
      st.note(qid, same ? "suggestionAccepted" : "suggestionRejected", via);
    } else {
      source = via === "tap" ? "tap" : viaAi ? (via === "voice" ? "voice-ai" : "text-ai") : via;
    }
    stopSpeaking();
    st.answer(value, source, via, via === "tap" ? undefined : utterance);
  }, []);

  const apply = useCallback(
    (intent: LocalIntent, via: Via, utterance: string) => {
      const st = useCheck.getState();
      if (!st.current) return;
      const q = QUESTION_BY_ID[st.current];
      switch (intent.kind) {
        case "answer":
          if (q.kind === "feelings") {
            setDraft(intent.value);
            return;
          }
          return commit(intent.value, via, utterance);
        case "notSure":
          return st.notSure(via, utterance);
        case "help":
          return st.help(via);
        case "repeat":
          return st.repeat(via);
        case "back":
          return st.back();
        default:
          return st.unclear(via, utterance);
      }
    },
    [commit],
  );

  const handleUtterance = useCallback(
    async (alternatives: string[], via: Via) => {
      const st = useCheck.getState();
      const qid = st.current;
      if (!qid || st.step !== "question" || !alternatives.length) return;
      const q = QUESTION_BY_ID[qid];
      const strings = stringsFor(st.lang);
      const first = alternatives[0];
      const sug = offered(st.suggestions[qid]) ? st.suggestions[qid] : undefined;

      // "Yes, that's right" confirms a photo suggestion (not for yes/no questions, where yes means yes).
      if (sug && q.kind !== "yesno") {
        for (const alt of alternatives) {
          const t = normalize(alt);
          const yes = strings.words.yes.some((w) => hasPhrase(t, w));
          const no = strings.words.no.some((w) => hasPhrase(t, w));
          const named = interpretLocally(q, alt, strings);
          if (named.kind === "answer") return apply(named, via, first);
          if (yes && !no) return commit(sug.value, via, first);
          if (no && !yes) {
            st.note(qid, "suggestionRejected", via);
            return st.rejectSuggestion();
          }
        }
      }

      for (const alt of alternatives) {
        const intent = interpretLocally(q, alt, strings);
        if (intent.kind !== "unclear") return apply(intent, via, first);
      }

      if (st.aiAvailable) {
        st.note(qid, "aiInterpret", via);
        setThinking(true);
        setAvatar("thinking");
        const labels = Object.fromEntries((q.codes ?? []).map((c) => [c, `${strings.q[qid].options?.[c]?.label ?? c} (${strings.q[qid].options?.[c]?.official ?? c})`]));
        const r = await interpret({ lang: st.lang, qid, utterance: first, question: strings.q[qid].ask, labels });
        setThinking(false);
        setAvatar("idle");
        if (r?.fallback) st.setAiAvailable(false);
        else if (r?.intent) {
          if (r.intent === "answer" && r.value !== undefined) {
            if (q.kind === "feelings") return setDraft(r.value);
            return commit(r.value, via, first, true);
          }
          if (r.intent === "not_sure") return st.notSure(via, first);
          if (r.intent === "help") return st.help(via);
          if (r.intent === "repeat") return st.repeat(via);
          if (r.intent === "back") return st.back();
          return st.unclear(via, first, r.reply);
        }
      }
      st.unclear(via, first);
    },
    [apply, commit],
  );

  const startListening = useCallback(() => {
    if (!canListen()) return;
    stopSpeaking();
    listenRef.current?.stop();
    setListening(true);
    setAvatar("listening");
    const handle = listen(SPEECH_LOCALE[useCheck.getState().lang], (t) => setInterim(t));
    listenRef.current = handle;
    void handle.result.then((heard) => {
      setListening(false);
      setInterim("");
      setAvatar("idle");
      if (heard) void handleUtterance(heard.alternatives, "voice");
    });
  }, [handleUtterance]);

  // Film mode (?film=1): lets the demo-video script "speak" a reply through exactly
  // the same path a real voice reply takes, since a recorded browser has no microphone.
  useEffect(() => {
    if (!params.has("film")) return;
    const w = window as unknown as { __brookHear?: (text: string) => Promise<void> };
    w.__brookHear = async (text: string) => {
      setListening(true);
      setAvatar("listening");
      const words = text.split(" ");
      for (let i = 1; i <= words.length; i++) {
        setInterim(words.slice(0, i).join(" "));
        await new Promise((r) => setTimeout(r, 140));
      }
      await new Promise((r) => setTimeout(r, 350));
      setListening(false);
      setInterim("");
      setAvatar("idle");
      await handleUtterance([text], "voice");
    };
    return () => {
      delete w.__brookHear;
    };
  }, [params, handleUtterance]);

  const toggleMic = () => {
    if (listening) listenRef.current?.stop();
    else startListening();
  };

  const continueFromPhotos = async () => {
    const st = useCheck.getState();
    const photos = Object.entries(st.photos) as [PhotoSlot, { dataUrl: string }][];
    if (!photos.length || !st.aiAvailable) return st.finishPhotos(null);
    st.startAnalyzing();
    setAvatar("thinking");
    const r = await analysePhotos({ lang: st.lang, photos: photos.map(([slot, p]) => ({ slot, dataUrl: p.dataUrl })) });
    setAvatar("idle");
    if (!r || r.fallback) {
      useCheck.getState().setAiAvailable(false);
      return useCheck.getState().finishPhotos(null);
    }
    useCheck.getState().finishPhotos({ suggestions: r.suggestions, isStream: r.isStream, model: r.model, biodiversity: r.biodiversity });
  };

  const submit = async () => {
    setSubmitting(true);
    setSendError(false);
    useCheck.getState().setSubmitting();
    try {
      const check = await submitCurrentCheck();
      if (check.status !== "sent") setSendError(!navigator.onLine ? false : true);
      stopSpeaking();
      navigate(`/story/${check.id}`);
      useCheck.getState().reset();
    } catch {
      setSendError(true);
      setSubmitting(false);
    }
  };

  const onLangChange = (l: typeof lang) => {
    void loadLang(l).then(() => {
      const st = useCheck.getState();
      st.setLang(l);
      if (st.step === "question" && st.current) st.repeat("tap");
    });
  };

  // Progress through the questions.
  const list = activeQuestions(answers);
  const answeredCount = list.filter((q) => q.id in answers).length;
  const total = list.length;
  const position = current ? list.findIndex((q) => q.id === current) + 1 : answeredCount;
  const pct = step === "review" || step === "secondLook" ? 100 : Math.round((answeredCount / Math.max(1, total)) * 100);
  const q = current ? QUESTION_BY_ID[current] : null;
  const qText = current ? s.q[current] : null;
  const sug = current && offered(suggestions[current]) ? suggestions[current] : undefined;
  const look = step === "secondLook" ? looks[lookIndex] : undefined;
  const siteInfo = site && !site.custom ? SITE_BY_CODE.get(site.code) : null;

  return (
    <div className="flex h-dvh flex-col bg-mist">
      {/* Top bar */}
      <header className="z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2">
          <button className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-aqua-100" onClick={() => navigate("/")} aria-label={s.ui.close}>
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[15px] font-bold text-deep-900">{site?.name ?? "Brook"}</div>
            <div className="truncate text-[12.5px] text-ink-soft">
              {step === "question" && current ? `${s.ui.question} ${position} ${s.ui.of} ${total} · ${s.sections[q!.section].title}` : siteInfo?.cityName ?? s.ui.tagline}
            </div>
          </div>
          <button
            className={`grid size-11 place-items-center rounded-full ${handsFree ? "bg-leaf-100 text-leaf-700" : "text-ink-soft hover:bg-aqua-100"}`}
            onClick={() => setHandsFree(!handsFree)}
            aria-pressed={handsFree}
            aria-label={s.ui.handsFree}
            title={s.ui.handsFreeHint}
            disabled={!canListen()}
          >
            <Ear className="size-5" />
          </button>
          <button
            className="grid size-11 place-items-center rounded-full text-ink-soft hover:bg-aqua-100"
            onClick={() => {
              if (voiceOn) stopSpeaking();
              setVoiceOn(!voiceOn);
            }}
            aria-pressed={voiceOn}
            aria-label={voiceOn ? s.ui.voiceOn : s.ui.voiceOff}
          >
            {voiceOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <div className="hidden sm:block">
            <LangPicker onChange={onLangChange} />
          </div>
        </div>
        <div className="h-1.5 bg-aqua-100" role="progressbar" aria-label={s.ui.step} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-1.5 rounded-r-full bg-gradient-to-r from-aqua to-deep transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} data-scroller tabIndex={0} aria-label="Conversation" className="flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none">
        <Transcript avatar={avatar} interim={interim} />
      </div>

      {/* Dock: what you can do right now */}
      <div className="z-20 border-t border-line bg-white/95 shadow-[0_-12px_30px_-18px_rgb(16_40_58/0.35)] backdrop-blur">
        <div tabIndex={-1} className="mx-auto max-h-[62vh] max-w-2xl overflow-y-auto px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {step === "intro" && (
            <button className="btn-primary w-full" onClick={() => useCheck.getState().begin(lang)}>
              {s.ui.start}
            </button>
          )}

          {step === "safety" && (
            <button className="btn-primary w-full" onClick={() => useCheck.getState().confirmSafety()}>
              <ShieldCheck className="size-5" /> {s.brook.safetyReady}
            </button>
          )}

          {step === "site" && demo && (
            <button
              className="btn-primary mb-3 w-full"
              onClick={() => {
                const c = SITE_BY_CODE.get("O17")!;
                useCheck.getState().chooseSite({ code: c.code, name: c.name, lat: c.lat, lon: c.lon, city: c.cityName });
              }}
            >
              Demo: {SITE_BY_CODE.get("O17")?.name}, Oslo
            </button>
          )}
          {step === "site" && (
            <SiteStep
              onPick={(picked) => {
                stopSpeaking();
                useCheck.getState().chooseSite(picked);
              }}
            />
          )}

          {step === "photos" && <PhotoStep onContinue={() => void continueFromPhotos()} />}

          {step === "analyzing" && (
            <div className="flex items-center justify-center gap-3 py-6 text-[16px] font-semibold text-deep">
              <Loader2 className="size-5 animate-spin" /> {s.ui.analyzing}
            </div>
          )}

          {step === "question" && current && q && qText && (
            <div className="space-y-3">
              <AnswerInput
                key={current}
                qid={current}
                suggestion={sug}
                draft={draft}
                onAnswer={(v) => commit(v, "tap")}
                onRejectSuggestion={() => useCheck.getState().rejectSuggestion()}
              />
              <div className="flex items-center gap-2">
                {(q.allowNotSure || q.kind === "feelings") && (
                  <button className="btn-ghost !min-h-11 !px-3.5 text-[15px]" onClick={() => useCheck.getState().notSure("tap")}>
                    {s.ui.notSure}
                  </button>
                )}
                <button className="btn-ghost !min-h-11 !px-3.5 text-[15px]" onClick={() => useCheck.getState().help("tap")} aria-label={s.ui.whatDoesItMean} title={s.ui.whatDoesItMean}>
                  <HelpCircle className="size-4.5" aria-hidden /> <span className="hidden min-[400px]:inline" aria-hidden>{s.ui.whatDoesItMean}</span>
                </button>
                <div className="flex-1" />
                <button className="grid size-12 place-items-center rounded-full text-ink-soft ring-1 ring-line hover:ring-aqua" onClick={() => setTyping((t) => !t)} aria-label={s.ui.typeInstead}>
                  <Keyboard className="size-5" />
                </button>
                {(canListen() || film) && (
                  <button
                    onClick={toggleMic}
                    disabled={thinking}
                    aria-pressed={listening}
                    aria-label={listening ? s.ui.listening : s.ui.listen}
                    className={`relative grid size-16 place-items-center rounded-full text-white shadow-[0_10px_24px_-8px_rgb(33_107_140/0.7)] transition ${listening ? "bg-leaf-700" : "bg-deep hover:bg-deep-600"}`}
                  >
                    {listening && <span className="absolute inset-0 rounded-full bg-leaf animate-ripple" />}
                    {thinking ? <Loader2 className="relative size-6 animate-spin" /> : <Mic className="relative size-7" />}
                  </button>
                )}
              </div>
              {typing && (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!typed.trim()) return;
                    void handleUtterance([typed.trim()], "text");
                    setTyped("");
                  }}
                >
                  <input
                    autoFocus
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={s.ui.typeInstead}
                    className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-[17px] ring-[1.5px] ring-line outline-none focus:ring-aqua"
                  />
                  <button className="btn-primary !px-4" aria-label={s.ui.send}>
                    <Send className="size-5" />
                  </button>
                </form>
              )}
              {!canListen() && !film && <p className="text-[13px] text-ink-faint">{s.ui.speechUnsupported}</p>}
              <details className="text-[13px] text-ink-soft">
                <summary className="cursor-pointer select-none">{s.ui.officialQuestion}</summary>
                <p className="mt-1">{qText.official}</p>
              </details>
              <div className="flex justify-start">
                <button className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-soft hover:text-deep" onClick={() => useCheck.getState().back()}>
                  <ArrowLeft className="size-4" /> {s.ui.back}
                </button>
              </div>
            </div>
          )}

          {step === "secondLook" && look && (
            <div className="space-y-2">
              <p className="text-[13px] text-ink-soft">
                {s.secondLook.source}: {look.basis.map((b) => (b === "weather" ? "Open-Meteo" : s.q[b as keyof typeof s.q]?.title ?? b)).join(", ")}
              </p>
              {look.severity === "safety" || !look.revisit.length ? (
                <button className="btn-primary w-full" onClick={() => useCheck.getState().decideLook("keep")}>
                  {s.ui.continue}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary" onClick={() => useCheck.getState().decideLook("change")}>
                    {s.secondLook.change}
                  </button>
                  <button className="btn-primary" onClick={() => useCheck.getState().decideLook("keep")}>
                    {s.secondLook.keep}
                  </button>
                </div>
              )}
              <p className="sr-only">{lookText(useCheck.getState().lang, look)}</p>
            </div>
          )}

          {(step === "review" || step === "submitting") && (
            <>
              <Review onSubmit={() => void submit()} busy={submitting} />
              {sendError && <p className="mt-2 text-center text-[14px] text-clay">{s.ui.sendFailed}</p>}
            </>
          )}
        </div>
      </div>
      <span className="sr-only" aria-live="assertive">
        {listening ? s.ui.listening : ""}
      </span>
    </div>
  );
}
