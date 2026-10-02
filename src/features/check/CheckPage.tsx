import { ArrowLeft, Ear, HelpCircle, Loader2, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { AvatarState } from "@/components/BrookAvatar";
import { LangPicker } from "@/components/LangPicker";
import { Logo } from "@/components/Logo";
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
import { Composer, type QuickAction } from "./parts/Composer";
import { PhotoStep, SAMPLE_SET } from "./parts/PhotoStep";
import { Review } from "./parts/Review";
import { SidePanel } from "./parts/SidePanel";
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

  useEffect(
    () => () => {
      stopSpeaking();
      listenRef.current?.stop();
    },
    [],
  );

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
        const r = await interpret({
          lang: st.lang,
          qid,
          utterance: first,
          question: strings.q[qid].ask,
          labels,
        });
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
    const w = window as unknown as {
      __brookHear?: (text: string) => Promise<void>;
    };
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
    const r = await analysePhotos({
      lang: st.lang,
      photos: photos.map(([slot, p]) => ({ slot, dataUrl: p.dataUrl })),
    });
    setAvatar("idle");
    if (!r || r.fallback) {
      useCheck.getState().setAiAvailable(false);
      return useCheck.getState().finishPhotos(null);
    }
    useCheck.getState().finishPhotos({
      suggestions: r.suggestions,
      isStream: r.isStream,
      model: r.model,
      biodiversity: r.biodiversity,
    });
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
  const canTalk = canListen() || film;
  const quick: QuickAction[] = q
    ? [
        ...(position > 1
          ? [
              {
                label: s.ui.back,
                icon: ArrowLeft,
                iconOnly: true,
                onClick: () => useCheck.getState().back(),
              },
            ]
          : []),
        {
          label: s.ui.whatDoesItMean,
          icon: HelpCircle,
          onClick: () => useCheck.getState().help("tap"),
        },
        ...(q.allowNotSure || q.kind === "feelings"
          ? [
              {
                label: s.ui.notSure,
                onClick: () => useCheck.getState().notSure("tap"),
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className="flex h-dvh flex-col bg-mist lg:bg-[linear-gradient(180deg,#e3f5f8_0%,#f4f8f9_45%)]">
      {/* Top bar */}
      <header className="z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-2 pt-2 sm:px-4 lg:gap-3 lg:px-6">
          <Link to="/" className="mr-1 hidden shrink-0 lg:block" aria-label="Brook home">
            <Logo />
          </Link>
          <span className="hidden h-9 w-px bg-line lg:block" aria-hidden />
          <button className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-aqua-100 lg:hidden" onClick={() => navigate("/")} aria-label={s.ui.close}>
            <X className="size-5" />
          </button>
          <div className="min-w-0 flex-1 leading-tight lg:pl-1">
            <div className="truncate text-[16px] font-bold text-deep-900">{site?.name ?? "Brook"}</div>
            <div className="truncate text-[13px] text-ink-soft">
              {step === "question" && current ? `${s.sections[q!.section].title} · ${position} ${s.ui.of} ${total}` : (siteInfo?.cityName ?? s.ui.tagline)}
            </div>
          </div>
          <button
            className={`grid size-11 shrink-0 place-items-center rounded-full ${handsFree ? "bg-leaf-100 text-leaf-700" : "text-ink-soft hover:bg-aqua-100"}`}
            onClick={() => setHandsFree(!handsFree)}
            aria-pressed={handsFree}
            aria-label={s.ui.handsFree}
            title={s.ui.handsFreeHint}
            disabled={!canListen()}
          >
            <Ear className="size-5" />
          </button>
          <button
            className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-aqua-100"
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
          <button className="btn-secondary !hidden !min-h-11 !px-4 !text-[15px] lg:!inline-flex" onClick={() => navigate("/")}>
            <X className="size-4" /> {s.ui.close}
          </button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2.5 pt-2 lg:px-6">
          <div className="h-1.5 overflow-hidden rounded-full bg-aqua-100" role="progressbar" aria-label={s.ui.step} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-aqua to-deep transition-all duration-500" style={{ width: `${Math.max(pct, 3)}%` }} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 lg:gap-6 lg:px-6 lg:py-5">
        {/* The conversation, with what you can do right now underneath */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:overflow-hidden lg:rounded-[28px] lg:bg-mist/80 lg:shadow-[var(--shadow-card)] lg:ring-1 lg:ring-line">
          <div ref={scrollRef} data-scroller tabIndex={0} aria-label="Conversation" className="fade-top flex-1 overflow-y-auto overscroll-contain focus-visible:outline-none">
            <Transcript avatar={avatar} interim={interim} />
          </div>

          <div className="z-10 border-t border-line bg-white/95 shadow-[0_-12px_30px_-20px_rgb(16_40_58/0.3)] backdrop-blur">
            <div className="mx-auto w-full max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 sm:px-5 lg:pb-4">
              <div tabIndex={-1} className="-mx-1.5 max-h-[46vh] overflow-y-auto overscroll-contain px-1.5 py-1 lg:max-h-[42vh]">
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
                      useCheck.getState().chooseSite({
                        code: c.code,
                        name: c.name,
                        lat: c.lat,
                        lon: c.lon,
                        city: c.cityName,
                      });
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
                  <div className="flex items-center justify-center gap-3 py-5 text-[16px] font-semibold text-deep">
                    <Loader2 className="size-5 animate-spin" /> {s.ui.analyzing}
                  </div>
                )}

                {step === "question" && current && q && qText && (
                  <AnswerInput key={current} qid={current} suggestion={sug} draft={draft} onAnswer={(v) => commit(v, "tap")} onRejectSuggestion={() => useCheck.getState().rejectSuggestion()} />
                )}

                {step === "secondLook" && look && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-ink-soft">
                      {s.secondLook.source}: {look.basis.map((b) => (b === "weather" ? "Open-Meteo" : (s.q[b as keyof typeof s.q]?.title ?? b))).join(", ")}
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
                    {sendError && <p className="mt-2 text-center text-[14px] text-clay-700">{s.ui.sendFailed}</p>}
                  </>
                )}
              </div>

              {step === "question" && current && q && (
                <div className="mt-2.5">
                  <Composer canTalk={canTalk} listening={listening} thinking={thinking} onMic={toggleMic} onSend={(text) => void handleUtterance([text], "text")} quick={quick} />
                  {!canTalk && <p className="mt-1.5 text-[12.5px] text-ink-faint">{s.ui.speechUnsupported}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        <SidePanel />
      </div>
      <span className="sr-only" aria-live="assertive">
        {listening ? s.ui.listening : ""}
      </span>
    </div>
  );
}
