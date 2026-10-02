// The "One Health" read-out on the story page: what today's check and
// OneAquaHealth's own lab data mean for people, for pets and other animals,
// and for the stream. Plain rules, each traceable to what triggered it.
// These are precautionary tips, not medical advice.

import type { AnswerValues } from "./protocol";
import type { OahSite } from "./sites";
import type { RecentWeather } from "./weather";

export type TipKey = "faecal" | "dogs" | "pathogens" | "foam" | "discharge" | "heat" | "shade" | "invasive" | "natural" | "concrete" | "generic" | "litter";

export interface OneHealthTips {
  people: { tip: TipKey; because: string[] };
  animals: { tip: TipKey; because: string[] };
  nature: { tip: TipKey; because: string[] };
}

export type Band = "good" | "moderate" | "poor";

/** OneAquaHealth lab classes (High…Bad) folded into the citizen's three-level scale. */
export function bandOfLab(cls: string | number | undefined | null): Band | null {
  switch (String(cls ?? "").toLowerCase()) {
    case "high":
    case "good":
      return "good";
    case "moderate":
      return "moderate";
    case "poor":
    case "bad":
      return "poor";
    default:
      return null;
  }
}

export const bandOfCitizen = (v: unknown): Band | null => (v === "GOOD" ? "good" : v === "MODERATE" ? "moderate" : v === "POOR" ? "poor" : null);

/** The most informative recent biological result at a site: invertebrates first, then diatoms, then fish. */
export function labHeadline(site: OahSite | null | undefined) {
  if (!site) return null;
  for (const key of ["macroinvertebrates", "diatoms", "fish"] as const) {
    const v = site.lab[key];
    if (v && bandOfLab(v.value as string)) return { key, ...v };
  }
  return null;
}

export function riskLevel(score: number | null | undefined): "low" | "medium" | "high" | null {
  if (typeof score !== "number") return null;
  return score < 0.3 ? "low" : score < 0.45 ? "medium" : "high";
}

export function oneHealthTips(a: AnswerValues, site: OahSite | null | undefined, weather: RecentWeather | null): OneHealthTips {
  const faecal = (site?.risk?.fecal ?? 0) >= 0.4;
  const pathogens = (site?.risk?.pathogen ?? 0) >= 0.4;
  const discharge = a.waterDischarge === true || a.pipes === true;
  const foam = a.waterColor === "FO";
  const hot = (weather?.maxTempC ?? 0) >= 28;
  const concrete = a.bottomChannelType === "ART" || a.banksChannelType === "ART";
  const natural = a.bottomChannelType === "NAT" && a.banksChannelType === "NAT";
  const trees = a.vegetationTypeLeft === "T" || a.vegetationTypeRight === "T";

  const people: OneHealthTips["people"] = discharge
    ? { tip: "discharge", because: [a.waterDischarge === true ? "waterDischarge" : "pipes"] }
    : faecal
      ? { tip: "faecal", because: ["lab:fecal"] }
      : pathogens
        ? { tip: "pathogens", because: ["lab:pathogen"] }
        : foam
          ? { tip: "foam", because: ["waterColor"] }
          : hot
            ? { tip: "heat", because: ["weather"] }
            : { tip: "generic", because: [] };

  const animals: OneHealthTips["animals"] =
    faecal || discharge
      ? { tip: "dogs", because: [faecal ? "lab:fecal" : "waterDischarge"] }
      : foam
        ? { tip: "foam", because: ["waterColor"] }
        : hot && !trees
          ? { tip: "heat", because: ["weather", "vegetation"] }
          : { tip: "shade", because: ["vegetation"] };

  const nature: OneHealthTips["nature"] =
    a.hasInvasivePlantSpecies === true
      ? { tip: "invasive", because: ["hasInvasivePlantSpecies"] }
      : concrete
        ? { tip: "concrete", because: ["bottomChannelType", "banksChannelType"] }
        : natural
          ? { tip: "natural", because: ["bottomChannelType", "banksChannelType"] }
          : { tip: "litter", because: [] };

  // Never show the same tip twice on one card set.
  if (animals.tip === people.tip) animals.tip = foam && people.tip !== "foam" ? "foam" : "shade";
  return { people, animals, nature };
}
