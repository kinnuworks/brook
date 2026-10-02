import { Camera, ImagePlus, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import type { PhotoSlot } from "@/core/protocol";
import { preparePhoto, urlToBlob } from "@/lib/image";
import { useSettings } from "@/lib/settings";
import { useStrings } from "@/i18n";
import { useCheck } from "../store";

const SLOTS: {
  slot: PhotoSlot;
  key: "photoUpstream" | "photoDownstream" | "photoSurroundings" | "photoBiodiversity";
  optional?: boolean;
}[] = [
  { slot: "upstream", key: "photoUpstream" },
  { slot: "downstream", key: "photoDownstream" },
  { slot: "surroundings", key: "photoSurroundings" },
  { slot: "biodiversity", key: "photoBiodiversity", optional: true },
];

/** Sample photos for people trying Brook away from a stream. Credits in docs/CREDITS.md. */
export const SAMPLE_SET: Partial<Record<PhotoSlot, string>> = {
  upstream: "/samples/upstream.jpg",
  downstream: "/samples/downstream.jpg",
  surroundings: "/samples/surroundings.jpg",
};

export function PhotoStep({ onContinue }: { onContinue: () => void }) {
  const s = useStrings();
  const photos = useCheck((st) => st.photos);
  const setPhoto = useCheck((st) => st.setPhoto);
  const share = useSettings((st) => st.sharePhotos);
  const setShare = useSettings((st) => st.setSharePhotos);
  const [busy, setBusy] = useState<PhotoSlot | "samples" | null>(null);
  const inputs = useRef<Partial<Record<PhotoSlot, HTMLInputElement | null>>>({});

  const take = async (slot: PhotoSlot, file?: File | null) => {
    if (!file) return;
    setBusy(slot);
    try {
      const p = await preparePhoto(file);
      setPhoto(slot, { dataUrl: p.dataUrl, b64: p.b64 });
    } finally {
      setBusy(null);
    }
  };

  const useSamples = async () => {
    setBusy("samples");
    try {
      for (const [slot, url] of Object.entries(SAMPLE_SET) as [PhotoSlot, string][]) {
        const p = await preparePhoto(await urlToBlob(url));
        setPhoto(slot, { dataUrl: p.dataUrl, b64: p.b64, sample: true });
      }
    } finally {
      setBusy(null);
    }
  };

  const count = Object.keys(photos).length;
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-2">
        {SLOTS.map(({ slot, key, optional }) => {
          const photo = photos[slot];
          return (
            <div key={slot} className="relative">
              <input
                ref={(el) => {
                  inputs.current[slot] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                aria-label={s.brook[key]}
                onChange={(e) => {
                  void take(slot, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button onClick={() => inputs.current[slot]?.click()} className="group block w-full text-center" aria-label={photo ? `${s.brook[key]} · ${s.ui.retake}` : s.brook[key]}>
                <span
                  className={`relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl transition ${photo ? "ring-2 ring-aqua" : "border-[1.5px] border-dashed border-aqua-600/45 bg-white group-hover:border-aqua-600 group-hover:bg-aqua-50"}`}
                >
                  {photo ? (
                    <>
                      <img src={photo.dataUrl} alt="" className="absolute inset-0 size-full object-cover" />
                      <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/45 text-white" aria-hidden>
                        <RotateCcw className="size-3.5" />
                      </span>
                    </>
                  ) : busy === slot ? (
                    <Loader2 className="size-5 animate-spin text-aqua-700" aria-hidden />
                  ) : (
                    <Camera className="size-5 text-aqua-700" aria-hidden />
                  )}
                </span>
                <span className="mt-1 block text-[12px] font-semibold leading-tight text-deep-900" aria-hidden>
                  {s.brook[key]}
                </span>
                {optional && (
                  <span className="block text-[11px] leading-tight text-ink-faint" aria-hidden>
                    {s.ui.optional}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[13.5px] text-ink-soft">{s.ui.photoTip}</p>
      <label className="flex items-start gap-2.5 rounded-2xl bg-aqua-50 px-3 py-2.5 text-[14px] text-ink-soft">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#216b8c]" />
        <span>
          <span className="font-semibold text-deep-900">{s.ui.sharePhotos}</span>
          <span className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-leaf-700" aria-hidden /> {s.ui.privacyNote}
          </span>
        </span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary !min-h-12" disabled={!count || busy !== null} onClick={onContinue}>
          {s.ui.continue}
        </button>
        <button className="btn-secondary !min-h-12 !px-3" disabled={busy !== null} onClick={useSamples}>
          {busy === "samples" ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />} {s.ui.useSamplePhotos}
        </button>
      </div>
      <button className="mx-auto block min-h-10 px-3 text-[14.5px] font-semibold text-ink-soft hover:text-deep" disabled={busy !== null} onClick={onContinue}>
        {s.ui.skipPhotos}
      </button>
    </div>
  );
}
