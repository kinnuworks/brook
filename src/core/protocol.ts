// The OneAquaHealth citizen stream check, question for question.
//
// Field names, answer codes and the order of questions are taken from the
// OneAquaHealth Citizen Science App: the codes come from its public API
// (api.enora-oah.eu/api/citizens/*) and the fields from its submission schema
// (CitizenSubmissionPutDTO). Brook never invents a field or a code — what it
// produces can be submitted to OneAquaHealth unchanged.

export const LANGS = ["en", "pt", "fr", "it", "nl", "no", "el"] as const;
export type Lang = (typeof LANGS)[number];

/** BCP-47 tags used for speech recognition and synthesis. */
export const SPEECH_LOCALE: Record<Lang, string> = {
  en: "en-GB",
  pt: "pt-PT",
  fr: "fr-FR",
  it: "it-IT",
  nl: "nl-BE",
  no: "nb-NO",
  el: "el-GR",
};

export type Section = "see" | "water" | "margins" | "overall" | "feelings";

export type QuestionId =
  | "channelForm"
  | "bottomChannelType"
  | "banksChannelType"
  | "habitats"
  | "fallenBiomassTypes"
  | "waterFlow"
  | "waterColor"
  | "waterAbstraction"
  | "hasDams"
  | "numberOfDams"
  | "pipes"
  | "waterDischarge"
  | "construction"
  | "waterHeight"
  | "imperviousAreasLeft"
  | "imperviousAreasRight"
  | "isVegetationCoveredLeft"
  | "vegetationTypeLeft"
  | "isVegetationCoveredRight"
  | "vegetationTypeRight"
  | "hasInvasivePlantSpecies"
  | "invasivePlantSpecies"
  | "recentVegetationCuts"
  | "overallAssessment"
  | "feelings";

export type QuestionKind = "single" | "multi" | "yesno" | "number" | "text" | "rating" | "feelings";

export type PhotoSlot = "upstream" | "downstream" | "surroundings" | "biodiversity";

export interface QuestionDef {
  id: QuestionId;
  section: Section;
  kind: QuestionKind;
  /** Answer codes exactly as OneAquaHealth stores them. */
  codes?: readonly string[];
  /** The letter OneAquaHealth's illustrations use for each code (A, B, C…). */
  letters?: readonly string[];
  /** Can a photo of the stream answer this? (Brook may suggest, never decide.) */
  visual: boolean;
  /** "I'm not sure" is a valid answer and is stored as null, as in the official app. */
  allowNotSure: boolean;
  /** Only asked when this returns true. */
  showIf?: (a: AnswerValues) => boolean;
  /** Numeric bounds for kind "number". */
  min?: number;
  max?: number;
}

export type FeelingKey = "joy" | "serenity" | "anger" | "fear";
export type Feelings = Partial<Record<FeelingKey, number>>;

/** What a question's answer can hold. null means "I'm not sure". */
export type AnswerValue = string | string[] | boolean | number | Feelings | null;
export type AnswerValues = Partial<Record<QuestionId, AnswerValue>>;

export const QUESTIONS: readonly QuestionDef[] = [
  // What do you see from where you stand (in ca. 100 m)?
  { id: "channelForm", section: "see", kind: "single", codes: ["FLAT", "U", "V"], letters: ["A", "B", "C"], visual: true, allowNotSure: true },
  { id: "bottomChannelType", section: "see", kind: "single", codes: ["NAT", "ART"], letters: ["A", "B"], visual: true, allowNotSure: true },
  { id: "banksChannelType", section: "see", kind: "single", codes: ["NAT", "ART", "LAS"], letters: ["A", "B", "C"], visual: true, allowNotSure: true },
  { id: "habitats", section: "see", kind: "multi", codes: ["SB", "SI", "SD", "RF", "AV"], letters: ["A", "B", "C", "D", "E"], visual: true, allowNotSure: true },
  { id: "fallenBiomassTypes", section: "see", kind: "multi", codes: ["FT", "FB", "FL"], letters: ["A", "B", "C"], visual: true, allowNotSure: true },
  { id: "waterFlow", section: "see", kind: "single", codes: ["FAS", "NOR", "STA", "DRY"], letters: ["A", "B", "C", "D"], visual: true, allowNotSure: true },
  // The water
  { id: "waterColor", section: "water", kind: "single", codes: ["CL", "MU", "FO", "CO"], letters: ["A", "B", "C", "D"], visual: true, allowNotSure: true },
  { id: "waterAbstraction", section: "water", kind: "yesno", visual: false, allowNotSure: true },
  { id: "hasDams", section: "water", kind: "yesno", visual: true, allowNotSure: true },
  { id: "numberOfDams", section: "water", kind: "number", visual: false, allowNotSure: true, min: 1, max: 50, showIf: (a) => a.hasDams === true },
  { id: "pipes", section: "water", kind: "yesno", visual: true, allowNotSure: true },
  { id: "waterDischarge", section: "water", kind: "yesno", visual: false, allowNotSure: true },
  { id: "construction", section: "water", kind: "yesno", visual: true, allowNotSure: true },
  { id: "waterHeight", section: "water", kind: "number", visual: false, allowNotSure: true, min: 0, max: 10 },
  // In the margins (5–10 m from the bank top), left and right facing downstream
  { id: "imperviousAreasLeft", section: "margins", kind: "yesno", visual: true, allowNotSure: true },
  { id: "imperviousAreasRight", section: "margins", kind: "yesno", visual: true, allowNotSure: true },
  { id: "isVegetationCoveredLeft", section: "margins", kind: "yesno", visual: true, allowNotSure: true },
  { id: "vegetationTypeLeft", section: "margins", kind: "single", codes: ["H", "B", "T"], letters: ["A", "B", "C"], visual: true, allowNotSure: true, showIf: (a) => a.isVegetationCoveredLeft === true },
  { id: "isVegetationCoveredRight", section: "margins", kind: "yesno", visual: true, allowNotSure: true },
  { id: "vegetationTypeRight", section: "margins", kind: "single", codes: ["H", "B", "T"], letters: ["A", "B", "C"], visual: true, allowNotSure: true, showIf: (a) => a.isVegetationCoveredRight === true },
  { id: "hasInvasivePlantSpecies", section: "margins", kind: "yesno", visual: false, allowNotSure: true },
  { id: "invasivePlantSpecies", section: "margins", kind: "text", visual: false, allowNotSure: true, showIf: (a) => a.hasInvasivePlantSpecies === true },
  { id: "recentVegetationCuts", section: "margins", kind: "yesno", visual: true, allowNotSure: true },
  // Your judgement, then how the place made you feel
  { id: "overallAssessment", section: "overall", kind: "rating", codes: ["GOOD", "MODERATE", "POOR"], visual: false, allowNotSure: false },
  { id: "feelings", section: "feelings", kind: "feelings", visual: false, allowNotSure: true },
] as const;

export const QUESTION_BY_ID: Record<QuestionId, QuestionDef> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
) as Record<QuestionId, QuestionDef>;

export const VISUAL_QUESTIONS = QUESTIONS.filter((q) => q.visual).map((q) => q.id);

export const FEELINGS: readonly FeelingKey[] = ["joy", "serenity", "anger", "fear"];

/** The questions still to be asked, in order, given what has been answered. */
export function activeQuestions(answers: AnswerValues): QuestionDef[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** OneAquaHealth's submission body (CitizenSubmissionPutDTO), field for field. */
export interface CitizenSubmissionPut {
  longitude: number;
  latitude: number;
  researchSite: string;
  upstreamPhoto?: string;
  downstreamPhoto?: string;
  surroundingPhoto?: string;
  interestingPhoto?: string;
  video?: string;
  channelForm?: string | null;
  bottomChannelType?: string | null;
  banksChannelType?: string | null;
  habitats?: string[];
  fallenBiomassTypes?: string[];
  waterFlow?: string | null;
  waterColor?: string | null;
  waterAbstraction?: boolean | null;
  hasDams?: boolean | null;
  numberOfDams?: number | null;
  pipes?: boolean | null;
  waterDischarge?: boolean | null;
  construction?: boolean | null;
  waterHeight?: number | null;
  imperviousAreasLeft?: boolean | null;
  imperviousAreasRight?: boolean | null;
  isVegetationCoveredLeft?: boolean | null;
  isVegetationCoveredRight?: boolean | null;
  vegetationTypeLeft?: string | null;
  vegetationTypeRight?: string | null;
  hasInvasivePlantSpecies?: boolean | null;
  invasivePlantSpecies?: string | null;
  recentVegetationCuts?: boolean | null;
  overallAssessment: string;
  joy?: number | null;
  serenity?: number | null;
  anger?: number | null;
  fear?: number | null;
}

export interface SiteRef {
  code: string;
  name: string;
  lat: number;
  lon: number;
  city?: string;
  /** A stream that is not one of OneAquaHealth's 106 research sites. */
  custom?: boolean;
}

/** Builds the exact body OneAquaHealth's API accepts. Unanswered fields are left out. */
export function toCitizenSubmission(site: SiteRef, answers: AnswerValues): CitizenSubmissionPut {
  const body: CitizenSubmissionPut = {
    latitude: round6(site.lat),
    longitude: round6(site.lon),
    researchSite: site.code,
    overallAssessment: String(answers.overallAssessment ?? ""),
  };
  for (const q of activeQuestions(answers)) {
    if (q.id === "overallAssessment" || q.id === "feelings") continue;
    if (!(q.id in answers)) continue;
    // "Not sure" is stored as null, as in the official app; lists are simply left out.
    if (q.kind === "multi" && answers[q.id] === null) continue;
    (body as unknown as Record<string, unknown>)[q.id] = answers[q.id];
  }
  const feelings = answers.feelings;
  if (feelings && typeof feelings === "object" && !Array.isArray(feelings)) {
    for (const key of FEELINGS) {
      if (typeof feelings[key] === "number") body[key] = feelings[key];
    }
  }
  return body;
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Is `value` a legal answer to `q`? Guards everything that came from speech or AI. */
export function isValidAnswer(q: QuestionDef, value: unknown): value is AnswerValue {
  if (value === null) return q.allowNotSure;
  switch (q.kind) {
    case "single":
    case "rating":
      return typeof value === "string" && !!q.codes?.includes(value);
    case "multi":
      return (
        Array.isArray(value) &&
        value.every((v) => typeof v === "string" && q.codes!.includes(v)) &&
        new Set(value).size === value.length
      );
    case "yesno":
      return typeof value === "boolean";
    case "number":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= (q.min ?? -Infinity) &&
        value <= (q.max ?? Infinity)
      );
    case "text":
      return typeof value === "string" && value.trim().length > 0 && value.length <= 300;
    case "feelings":
      return (
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.entries(value as object).every(
          ([k, v]) => (FEELINGS as readonly string[]).includes(k) && Number.isInteger(v) && v >= 0 && v <= 5,
        )
      );
  }
}
