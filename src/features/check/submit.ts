// Turns a finished conversation into the three things Brook hands over:
// OneAquaHealth's own submission body, a FHIR bundle, and the interaction
// record the research hub learns from. Saved on the phone first, then sent.

import { buildBundle } from "@/core/fhir";
import { toCitizenSubmission, type PhotoSlot } from "@/core/protocol";
import { secondLooks } from "@/core/rules";
import { db, type StoredCheck } from "@/lib/localdb";
import { useSettings } from "@/lib/settings";
import { useCheck } from "./store";

async function pseudonym(clientId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`brook:${clientId}`));
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function thumbnail(dataUrl: string, max = 360): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

export async function sendStored(check: StoredCheck): Promise<StoredCheck> {
  try {
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(check.payload),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const out = (await res.json()) as { id: string; fhir: StoredCheck["fhirResult"] };
    const updated: StoredCheck = { ...check, status: "sent", serverId: out.id, fhirResult: out.fhir ?? null, payload: undefined };
    await db.checks.put(updated);
    return updated;
  } catch {
    const failed: StoredCheck = { ...check, status: navigator.onLine ? "failed" : "pending" };
    await db.checks.put(failed);
    return failed;
  }
}

export async function submitCurrentCheck(): Promise<StoredCheck> {
  const st = useCheck.getState();
  const settings = useSettings.getState();
  if (!st.site) throw new Error("no site");
  const submittedAt = new Date().toISOString();
  const citizenRef = await pseudonym(settings.clientId);
  const dto = toCitizenSubmission(st.site, st.answers);
  const fhir = buildBundle({
    id: st.id,
    site: st.site,
    answers: st.answers,
    sources: st.sources,
    startedAt: st.startedAt ?? submittedAt,
    submittedAt,
    lang: st.lang,
    citizenRef,
    aiModel: st.aiModel,
  });
  const mode = st.usedVoice && st.usedTap ? "mixed" : st.usedVoice ? "voice" : "tap";
  const durationS = Math.round((Date.parse(submittedAt) - Date.parse(st.startedAt ?? submittedAt)) / 1000);
  const looks = secondLooks(st.answers, st.weather);
  const photoEntries = Object.entries(st.photos) as [PhotoSlot, { dataUrl: string; b64: string; sample?: boolean }][];
  const thumbs: Record<string, string> = {};
  for (const [slot, p] of photoEntries) thumbs[slot] = await thumbnail(p.dataUrl);

  // A check made with Brook's sample photos is a trial, not a field observation.
  const trial = photoEntries.some(([, p]) => p.sample);
  const payload = {
    submission: {
      trial,
      site_code: st.site.code,
      site_name: st.site.name,
      city: st.site.city ?? null,
      lat: st.site.lat,
      lon: st.site.lon,
      custom_site: Boolean(st.site.custom),
      lang: st.lang,
      mode,
      duration_s: durationS,
      dto,
      provenance: st.sources,
      events: st.events.map((e) => ({ ...e, t: e.t - Date.parse(st.startedAt ?? submittedAt) })),
      second_looks: looks.map((l) => ({ id: l.id, severity: l.severity, decision: st.lookDecisions.find((d) => d.id === l.id)?.decision ?? "keep" })),
      weather: st.weather,
      client_id: citizenRef,
    },
    fhir,
    photos: settings.sharePhotos ? photoEntries.filter(([, p]) => !p.sample).map(([slot, p]) => ({ slot, b64: p.b64 })) : [],
  };

  const check: StoredCheck = {
    id: st.id,
    createdAt: submittedAt,
    status: "pending",
    trial,
    lang: st.lang,
    mode,
    durationS,
    site: st.site,
    answers: st.answers,
    sources: st.sources,
    dto,
    fhir,
    events: st.events,
    looks,
    lookDecisions: st.lookDecisions,
    weather: st.weather,
    thumbs,
    biodiversity: st.biodiversity,
    payload,
  };
  await db.checks.put(check);
  if (!navigator.onLine) return check;
  return sendStored(check);
}

/** Sends anything saved while offline. Called on start-up and when the connection returns. */
export async function flushPending() {
  if (!navigator.onLine) return;
  const pending = await db.checks.where("status").anyOf("pending", "failed").toArray();
  for (const check of pending) if (check.payload) await sendStored(check);
}
