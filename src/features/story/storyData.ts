// Everything the story page needs, from either the phone's own copy of a
// check or the server's copy (when opened from the research hub).

import type { AnswerSource } from "@/core/fhir";
import { FEELINGS, QUESTIONS, type AnswerValues, type CitizenSubmissionPut, type QuestionId, type SiteRef } from "@/core/protocol";
import type { RecentWeather } from "@/core/weather";
import { db } from "@/lib/localdb";

export interface StoryData {
  id: string;
  createdAt: string;
  lang: string;
  site: SiteRef;
  answers: AnswerValues;
  sources: Partial<Record<QuestionId, AnswerSource>>;
  dto: CitizenSubmissionPut;
  fhir?: Record<string, unknown> | null;
  fhirResult?: { ok: boolean; status: number; server: string; locations?: string[]; error?: string } | null;
  weather: RecentWeather | null;
  photos: { slot: string; src: string }[];
  biodiversity?: string | null;
  status: "pending" | "sent" | "failed" | "server";
  trial: boolean;
  durationS?: number;
  mode?: string;
}

export function answersFromDto(dto: CitizenSubmissionPut): AnswerValues {
  const answers: AnswerValues = {};
  for (const q of QUESTIONS) {
    if (q.id === "feelings" || q.id === "overallAssessment") continue;
    const v = (dto as unknown as Record<string, unknown>)[q.id];
    if (v !== undefined) (answers as Record<string, unknown>)[q.id] = v;
  }
  answers.overallAssessment = dto.overallAssessment;
  const feelings: Record<string, number> = {};
  for (const k of FEELINGS) if (typeof dto[k] === "number") feelings[k] = dto[k] as number;
  if (Object.keys(feelings).length) answers.feelings = feelings;
  return answers;
}

interface ServerRow {
  id: string;
  created_at: string;
  site_code: string;
  site_name: string;
  city: string | null;
  lat: number;
  lon: number;
  custom_site: boolean;
  lang: string;
  mode: string;
  duration_s: number | null;
  dto: CitizenSubmissionPut;
  provenance: Partial<Record<QuestionId, AnswerSource>>;
  weather: RecentWeather | null;
  fhir_result: StoryData["fhirResult"];
  photos: { id: string; slot: string }[];
  trial?: boolean;
}

export async function loadStory(id: string): Promise<StoryData | null> {
  const local = (await db.checks.get(id)) ?? (await db.checks.where("serverId").equals(id).first());
  if (local) {
    return {
      id: local.serverId ?? local.id,
      createdAt: local.createdAt,
      lang: local.lang,
      site: local.site,
      answers: local.answers,
      sources: local.sources,
      dto: local.dto,
      fhir: local.fhir,
      fhirResult: local.fhirResult ?? null,
      weather: local.weather,
      photos: Object.entries(local.thumbs).map(([slot, src]) => ({ slot, src })),
      biodiversity: local.biodiversity,
      status: local.status,
      trial: Boolean(local.trial),
      durationS: local.durationS,
      mode: local.mode,
    };
  }
  try {
    const res = await fetch("/api/submissions?limit=1000");
    if (!res.ok) return null;
    const { submissions } = (await res.json()) as { submissions: ServerRow[] };
    const row = submissions.find((r) => r.id === id);
    if (!row) return null;
    return {
      id: row.id,
      createdAt: row.created_at,
      lang: row.lang,
      site: { code: row.site_code, name: row.site_name, lat: row.lat, lon: row.lon, city: row.city ?? undefined, custom: row.custom_site },
      answers: answersFromDto(row.dto),
      sources: row.provenance ?? {},
      dto: row.dto,
      fhir: null,
      fhirResult: row.fhir_result,
      weather: row.weather,
      photos: (row.photos ?? []).map((p) => ({ slot: p.slot, src: `/api/photo?id=${p.id}` })),
      status: "server",
      trial: Boolean(row.trial),
      durationS: row.duration_s ?? undefined,
      mode: row.mode,
    };
  } catch {
    return null;
  }
}
