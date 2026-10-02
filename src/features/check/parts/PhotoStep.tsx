import { Camera, ImagePlus, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import type { PhotoSlot } from "@/core/protocol";
import { preparePhoto, urlToBlob } from "@/lib/image";
import { useSettings } from "@/lib/settings";
import { useStrings } from "@/i18n";
import { useCheck } from "../store";

const SLOTS: { slot: PhotoSlot; key: "photoUpstream" | "photoDownstream" | "photoSurroundings" | "photoBiodiversity"; optional?: boolean }[] = [
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
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
              <button
                onClick={() => inputs.current[slot]?.click()}
                className={`group relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-2xl text-center transition ${photo ? "ring-2 ring-aqua" : "bg-white ring-[1.5px] ring-dashed ring-line hover:ring-aqua"}`}
              >
                {photo ? (
                  <>
                    <img src={photo.dataUrl} alt={s.brook[key]} className="absolute inset-0 size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-left text-[13px] font-semibold text-white">
                      {s.brook[key]}
                      <RotateCcw className="size-4" aria-label={s.ui.retake} />
                    </span>
                  </>
                ) : (
                  <span className="px-2">
                    {busy === slot ? <Loader2 className="mx-auto size-6 animate-spin text-aqua-600" /> : <Camera className="mx-auto size-6 text-aqua-600" />}
                    <span className="mt-1.5 block text-[14.5px] font-semibold text-deep-900">{s.brook[key]}</span>
                    {optional && <span className="block text-[12px] text-ink-faint">{s.ui.optional}</span>}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[13.5px] text-ink-soft">{s.ui.photoTip}</p>
      <label className="flex items-start gap-2.5 rounded-2xl bg-aqua-50 p-3 text-[14px] text-ink-soft">
        <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 size-5 accent-[#216b8c]" />
        <span>
          <span className="font-semibold text-deep-900">{s.ui.sharePhotos}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[13px]">
            <ShieldCheck className="size-3.5 shrink-0 text-leaf-700" aria-hidden /> {s.ui.privacyNote}
          </span>
        </span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button className="btn-primary" disabled={!count || busy !== null} onClick={onContinue}>
          {s.ui.continue}
        </button>
        <button className="btn-secondary" disabled={busy !== null} onClick={useSamples}>
          {busy === "samples" ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />} {s.ui.useSamplePhotos}
        </button>
      </div>
      <button className="btn-ghost w-full !min-h-10 text-[15px]" disabled={busy !== null} onClick={onContinue}>
        {s.ui.skipPhotos}
      </button>
    </div>
  );
}
