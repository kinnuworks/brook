// What the research hub learns from Brook's conversations: not only what
// volunteers saw, but where OneAquaHealth's protocol confuses them.

import type { AnswerSource } from "@/core/fhir";
import type { CitizenSubmissionPut, QuestionId } from "@/core/protocol";
import { QUESTIONS } from "@/core/protocol";

export interface HubEvent {
  qid: QuestionId;
  type: string;
  via?: string;
  ms?: number;
  t: number;
}

export interface HubRow {
  id: string;
  created_at: string;
  is_demo: boolean;
  trial?: boolean;
  site_code: string;
  site_name: string;
  city: string | null;
  lat: number;
  lon: number;
  custom_site: boolean;
  lang: string;
  mode: "voice" | "tap" | "mixed";
  duration_s: number | null;
  dto: CitizenSubmissionPut;
  provenance: Partial<Record<QuestionId, AnswerSource>>;
  events: HubEvent[];
  second_looks: { id: string; severity: string; decision: string }[];
  fhir_result: { ok: boolean; status: number } | null;
  verified: boolean;
  photos: { id: string; slot: string }[];
}

export interface Clarity {
  qid: QuestionId;
  asked: number;
  help: number;
  notSure: number;
  unclear: number;
  helpRate: number;
  notSureRate: number;
  unclearRate: number;
  /** Share of askings where the volunteer needed help, wasn't sure, or wasn't understood. */
  score: number;
  medianSeconds: number | null;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export function questionClarity(rows: HubRow[]): Clarity[] {
  const by = new Map<QuestionId, { asked: number; help: number; notSure: number; unclear: number; times: number[] }>();
  for (const q of QUESTIONS) by.set(q.id, { asked: 0, help: 0, notSure: 0, unclear: 0, times: [] });
  for (const r of rows) {
    const seen = new Set<string>();
    for (const e of r.events ?? []) {
      const b = by.get(e.qid);
      if (!b) continue;
      if (e.type === "asked" && !seen.has(e.qid)) {
        b.asked++;
        seen.add(e.qid);
      }
      if (e.type === "help") b.help++;
      if (e.type === "notSure") b.notSure++;
      if (e.type === "unclear") b.unclear++;
      if ((e.type === "answered" || e.type === "changed") && typeof e.ms === "number") b.times.push(e.ms / 1000);
    }
  }
  return [...by.entries()]
    .filter(([, b]) => b.asked > 0)
    .map(([qid, b]) => {
      const helpRate = b.help / b.asked;
      const notSureRate = b.notSure / b.asked;
      const unclearRate = b.unclear / b.asked;
      return {
        qid,
        asked: b.asked,
        help: b.help,
        notSure: b.notSure,
        unclear: b.unclear,
        helpRate,
        notSureRate,
        unclearRate,
        score: Math.min(1, helpRate + notSureRate + unclearRate),
        medianSeconds: median(b.times),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export interface Agreement {
  qid: QuestionId;
  shown: number;
  accepted: number;
  corrected: number;
  rate: number;
}

export function aiAgreement(rows: HubRow[]): Agreement[] {
  const by = new Map<QuestionId, { accepted: number; corrected: number }>();
  for (const r of rows) {
    for (const [qid, src] of Object.entries(r.provenance ?? {}) as [QuestionId, AnswerSource][]) {
      if (src !== "photo-confirmed" && src !== "photo-corrected") continue;
      const b = by.get(qid) ?? { accepted: 0, corrected: 0 };
      if (src === "photo-confirmed") b.accepted++;
      else b.corrected++;
      by.set(qid, b);
    }
  }
  return [...by.entries()]
    .map(([qid, b]) => ({ qid, shown: b.accepted + b.corrected, accepted: b.accepted, corrected: b.corrected, rate: b.accepted / Math.max(1, b.accepted + b.corrected) }))
    .filter((a) => a.shown >= 1)
    .sort((a, b) => a.rate - b.rate);
}

export function feelingsByRating(rows: HubRow[]) {
  const out = ["GOOD", "MODERATE", "POOR"].map((rating) => {
    const rs = rows.filter((r) => r.dto?.overallAssessment === rating);
    const avg = (k: "joy" | "serenity" | "anger" | "fear") => {
      const xs = rs.map((r) => r.dto[k]).filter((v): v is number => typeof v === "number");
      return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0;
    };
    return { rating, n: rs.length, joy: avg("joy"), serenity: avg("serenity"), anger: avg("anger"), fear: avg("fear") };
  });
  return out;
}

export function kpis(rows: HubRow[]) {
  const durations = rows.map((r) => r.duration_s).filter((v): v is number => typeof v === "number" && v > 0);
  const voice = rows.filter((r) => r.mode !== "tap").length;
  const photoAnswers = rows.flatMap((r) => Object.values(r.provenance ?? {})).filter((s) => s === "photo-confirmed" || s === "photo-corrected");
  const accepted = photoAnswers.filter((s) => s === "photo-confirmed").length;
  const langs = new Set(rows.map((r) => r.lang));
  const sites = new Set(rows.map((r) => r.site_code));
  return {
    checks: rows.length,
    sites: sites.size,
    medianMinutes: durations.length ? Math.round((median(durations)! / 60) * 10) / 10 : null,
    voiceShare: rows.length ? voice / rows.length : 0,
    acceptRate: photoAnswers.length ? accepted / photoAnswers.length : null,
    languages: langs.size,
    secondLooks: rows.reduce((n, r) => n + (r.second_looks?.length ?? 0), 0),
  };
}

/** What a form designer could change, for the questions people find hardest. */
export const FIXES: Partial<Record<QuestionId, string>> = {
  imperviousAreasLeft: "Volunteers mix up left and right. Show a 'face downstream' picture before the margin questions.",
  imperviousAreasRight: "Same left/right confusion. One diagram covering both margins would help.",
  habitats: "Many habitat words are unfamiliar. One small photo per habitat type would carry most of the meaning.",
  waterDischarge: "Most people don't know what sewage looks like. Add smell and colour cues, and let them attach a photo.",
  hasInvasivePlantSpecies: "Few volunteers know invasive species. A city-specific photo list of the five commonest would help.",
  waterAbstraction: "Give examples: pumps, hoses, irrigation channels, intakes.",
  channelForm: "Cross-section drawings of flat, U and V shapes make this instant.",
  waterHeight: "Body-based estimates (ankle, knee, waist) are easier than metres.",
  vegetationTypeLeft: "'Dominant' is unclear. Say 'covers more than half', and show herb/shrub/tree heights.",
  vegetationTypeRight: "'Dominant' is unclear. Say 'covers more than half', and show herb/shrub/tree heights.",
  banksChannelType: "'Laid stones' vs 'artificial' needs a photo pair: loose rocks versus stones set in concrete.",
  pipes: "Distinguish a rainwater outlet from a polluting pipe: look and smell of the water coming out.",
};
