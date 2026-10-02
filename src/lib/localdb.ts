// Every finished check is kept on the phone first, so nothing is lost when
// the signal drops at the stream. Unsent checks are retried when back online.

import Dexie, { type Table } from "dexie";
import type { AnswerValues, CitizenSubmissionPut, QuestionId, SiteRef } from "@/core/protocol";
import type { AnswerSource } from "@/core/fhir";
import type { SecondLook } from "@/core/rules";
import type { RecentWeather } from "@/core/weather";

export interface StoredCheck {
  id: string;
  serverId?: string;
  createdAt: string;
  status: "pending" | "sent" | "failed";
  lang: string;
  mode: "voice" | "tap" | "mixed";
  durationS: number;
  site: SiteRef;
  answers: AnswerValues;
  sources: Partial<Record<QuestionId, AnswerSource>>;
  dto: CitizenSubmissionPut;
  fhir: Record<string, unknown>;
  fhirResult?: { ok: boolean; status: number; server: string; locations?: string[]; error?: string } | null;
  events: unknown[];
  looks: SecondLook[];
  lookDecisions: { id: string; decision: string }[];
  weather: RecentWeather | null;
  thumbs: Record<string, string>;
  biodiversity?: string | null;
  payload?: unknown;
}

class BrookDb extends Dexie {
  checks!: Table<StoredCheck, string>;
  constructor() {
    super("brook");
    this.version(1).stores({ checks: "id, createdAt, status, serverId" });
  }
}

export const db = new BrookDb();
